import { useEffect, useState } from 'react'
import { useDialogo } from '../../compartilhado/Dialogo'
import { ShieldAlert } from 'lucide-react'
import { supabase } from '../../compartilhado/supabase'
import { formatarTamanho, gerarLinksArquivos } from '../../compartilhado/arquivos'
import type { Disciplina, MaterialModeracao } from '../../compartilhado/tipos'

async function consultarModeracao() {
  const { data, error } = await supabase.rpc('materiais_em_moderacao')
  const lista = (data as MaterialModeracao[]) ?? []
  const caminhos = lista.map((m) => m.arquivo_path).filter((p): p is string => !!p)
  return { lista, urls: await gerarLinksArquivos(caminhos), erro: error?.message ?? '' }
}

// Moderação (admin): arquivos novos e materiais denunciados esperam aprovação.
export default function Moderacao({ disciplinas }: { disciplinas: Disciplina[] }) {
  const { pedirTexto } = useDialogo()
  const [lista, setLista] = useState<MaterialModeracao[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')

  function carregar() {
    consultarModeracao().then((resultado) => {
      setLista(resultado.lista)
      setUrls(resultado.urls)
      setErro(resultado.erro)
    })
  }

  useEffect(() => {
    carregar()
  }, [])

  async function decidir(item: MaterialModeracao, aprovar: boolean) {
    const motivo = aprovar
      ? null
      : await pedirTexto({
          titulo: `Recusar "${item.titulo}"?`,
          mensagem: 'O material deixa de aparecer para os colegas. O autor verá o motivo.',
          rotulo: 'Motivo da recusa',
          valorInicial: 'Não segue as regras de uso.',
          textoConfirmar: 'Recusar',
          perigo: true,
        })
    if (!aprovar && motivo === null) return
    const { error } = await supabase.rpc('moderar_material', {
      p_material_id: item.id,
      p_aprovar: aprovar,
      p_motivo: motivo,
    })
    if (error) setErro(error.message)
    else carregar()
  }

  return (
    <div className="cartao">
      <h3>
        <ShieldAlert size={20} color="#8257e5" /> Moderação ({lista.length})
      </h3>
      <p className="item-meta">
        Links passam pelo filtro automático e já são publicados. Arquivos e materiais denunciados
        esperam sua análise antes de aparecer para os alunos.
      </p>
      {erro ? <p className="aviso erro">{erro}</p> : null}

      {lista.length === 0 ? (
        <p className="vazio">Nada para analisar agora.</p>
      ) : (
        <ul className="lista">
          {lista.map((item) => (
            <li key={item.id} className="item-lista">
              <div>
                <strong>
                  {item.titulo}
                  <span className="selo">{disciplinas.find((d) => d.id === item.disciplina_id)?.nome ?? 'Sem disciplina'}</span>
                  {item.denuncias > 0 ? <span className="selo selo-alerta">{item.denuncias} denúncia(s)</span> : null}
                </strong>
                <span className="item-meta">Enviado por {item.autor_nome}</span>
                {item.descricao ? <span className="item-meta">{item.descricao}</span> : null}
                <span className="item-meta">
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer noopener">
                      {item.link}
                    </a>
                  ) : null}
                  {item.arquivo_path && urls[item.arquivo_path] ? (
                    <a href={urls[item.arquivo_path]} target="_blank" rel="noreferrer noopener">
                      📎 {item.arquivo_nome} ({formatarTamanho(item.arquivo_tamanho)})
                    </a>
                  ) : null}
                </span>
                {item.motivos_denuncias ? (
                  <span className="item-meta">Motivos: {item.motivos_denuncias}</span>
                ) : null}
              </div>
              <div className="acoes-moderacao">
                <button type="button" className="btn btn-primario" onClick={() => decidir(item, true)}>
                  Aprovar
                </button>
                <button type="button" className="btn btn-perigo" onClick={() => decidir(item, false)}>
                  Recusar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
