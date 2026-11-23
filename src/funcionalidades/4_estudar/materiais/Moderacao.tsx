import { useEffect, useState } from 'react'
import { useDialogo } from '../../../compartilhado/componentes/Dialogo'
import { ShieldAlert } from 'lucide-react'
import { supabase } from '../../../compartilhado/banco/supabase'
import { formatarTamanho, gerarLinksArquivos } from '../../../compartilhado/banco/arquivos'
import type { Disciplina, MaterialModeracao } from '../../../compartilhado/tipos'
import { dominioDoLink, ehSiteNovo, linkCurto } from './filtroMateriais'

async function consultarModeracao() {
  const { data, error } = await supabase.rpc('materiais_em_moderacao')
  const lista = (data as MaterialModeracao[]) ?? []
  const caminhos = lista.map((m) => m.arquivo_path).filter((p): p is string => !!p)
  return { lista, urls: await gerarLinksArquivos(caminhos), erro: error?.message ?? '' }
}

export default function Moderacao({
  disciplinas,
  versao,
  aoMudar,
}: {
  disciplinas: Disciplina[]
  versao: number
  aoMudar: () => void
}) {
  const { confirmar, pedirTexto } = useDialogo()
  const [lista, setLista] = useState<MaterialModeracao[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  function carregar() {
    consultarModeracao().then((resultado) => {
      setLista(resultado.lista)
      setUrls(resultado.urls)
      setErro(resultado.erro)
    })
  }

  // Recarrega quando "Todos os materiais" (ou esta lista) muda algo.
  useEffect(() => {
    carregar()
  }, [versao])

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
    else aoMudar()
  }

  // Aprova e libera o site: os próximos links dele passam direto pelo filtro.
  async function aprovarELiberar(item: MaterialModeracao) {
    const dominio = dominioDoLink(item.link ?? '')
    const ok = await confirmar({
      titulo: `Aprovar e liberar o site ${dominio}?`,
      mensagem:
        'O material é publicado e o site entra na lista de sites permitidos: os próximos links dele serão publicados sem passar pela moderação. Outros links desse site que estão esperando também são publicados. Você pode tirar o site da lista depois, em "Listas do filtro".',
      textoConfirmar: 'Aprovar e liberar',
    })
    if (!ok) return
    const { data, error } = await supabase.rpc('aprovar_e_liberar_site', { p_material_id: item.id })
    if (error) {
      setErro(error.message)
      return
    }
    setErro('')
    setAviso(
      Number(data) > 0
        ? `Site ${dominio} liberado. Mais ${data} material(is) desse site foram publicados junto.`
        : `Site ${dominio} liberado.`,
    )
    aoMudar()
  }

  return (
    <div className="cartao">
      <h3>
        <ShieldAlert size={20} color="#8257e5" /> Moderação ({lista.length})
      </h3>
      <p className="item-meta">
        Links de sites da lista passam pelo filtro automático e já são publicados. Arquivos, links de
        sites novos e materiais denunciados esperam sua análise antes de aparecer para os alunos.
      </p>
      {erro ? <p className="aviso erro">{erro}</p> : null}
      {aviso ? <p className="aviso sucesso">{aviso}</p> : null}

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
                  {ehSiteNovo(item.motivo_moderacao) ? (
                    <span className="selo selo-alerta">Site novo: {dominioDoLink(item.link ?? '')}</span>
                  ) : null}
                </strong>
                <span className="item-meta">Enviado por {item.autor_nome}</span>
                {item.descricao ? <span className="item-meta">{item.descricao}</span> : null}
                <span className="item-meta">
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer noopener" title={item.link}>
                      {linkCurto(item.link)}
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
                {ehSiteNovo(item.motivo_moderacao) ? (
                  <button type="button" className="btn btn-secundario" onClick={() => aprovarELiberar(item)}>
                    Aprovar e liberar o site
                  </button>
                ) : null}
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
