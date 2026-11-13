import { useEffect, useMemo, useState } from 'react'
import { Library } from 'lucide-react'
import { useDialogo } from '../../compartilhado/Dialogo'
import { supabase } from '../../compartilhado/supabase'
import { formatarTamanho, gerarLinksArquivos } from '../../compartilhado/arquivos'
import type { Disciplina, Material, UsuarioAdmin } from '../../compartilhado/tipos'
import {
  OPCOES_STATUS,
  ROTULO_STATUS,
  contarPorStatus,
  filtrarMateriaisAdmin,
  ordenarMateriaisAdmin,
  type FiltroStatus,
  type MaterialAdmin,
} from './gestaoMateriais'

const POR_PAGINA = 15

async function consultar(disciplinas: Disciplina[]) {
  const [materiais, usuarios, denuncias] = await Promise.all([
    supabase.from('materiais').select('*').order('criado_em', { ascending: false }),
    supabase.rpc('listar_usuarios_admin'),
    supabase.from('denuncias_materiais').select('material_id'),
  ])
  const pessoas = new Map(((usuarios.data as UsuarioAdmin[]) ?? []).map((u) => [u.id, u]))
  const totalDenuncias = new Map<number, number>()
  for (const d of (denuncias.data as { material_id: number }[]) ?? []) {
    totalDenuncias.set(d.material_id, (totalDenuncias.get(d.material_id) ?? 0) + 1)
  }
  const lista: MaterialAdmin[] = ((materiais.data as Material[]) ?? []).map((m) => {
    const autor = m.enviado_por ? pessoas.get(m.enviado_por) : undefined
    return {
      ...m,
      autor_nome: autor?.nome ?? 'Conta excluída',
      autor_email: autor?.email ?? '',
      disciplina_nome: disciplinas.find((d) => d.id === m.disciplina_id)?.nome ?? null,
      denuncias: totalDenuncias.get(m.id) ?? 0,
    }
  })
  const caminhos = lista.map((m) => m.arquivo_path).filter((p): p is string => !!p)
  return {
    lista,
    urls: await gerarLinksArquivos(caminhos),
    erro: materiais.error?.message ?? usuarios.error?.message ?? '',
  }
}

// Admin: todos os materiais do site (publicados, em análise e recusados), com busca,
// filtros e as ações de retirar do ar, publicar e excluir.
export default function TodosMateriais({
  disciplinas,
  versao,
  aoMudar,
}: {
  disciplinas: Disciplina[]
  versao: number
  aoMudar: () => void
}) {
  const { confirmar, pedirTexto } = useDialogo()
  const [lista, setLista] = useState<MaterialAdmin[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [status, setStatus] = useState<FiltroStatus>('aprovado')
  const [disciplina, setDisciplina] = useState('')
  const [busca, setBusca] = useState('')
  const [quantos, setQuantos] = useState(POR_PAGINA)

  useEffect(() => {
    consultar(disciplinas)
      .then((r) => {
        setLista(r.lista)
        setUrls(r.urls)
        setErro(r.erro)
      })
      .catch(() => setErro('Não foi possível conectar ao banco.'))
      .finally(() => setCarregando(false))
  }, [disciplinas, versao])

  const totais = useMemo(() => contarPorStatus(lista), [lista])
  const filtrados = useMemo(
    () => ordenarMateriaisAdmin(filtrarMateriaisAdmin(lista, { status, disciplina, busca })),
    [lista, status, disciplina, busca],
  )

  async function retirar(item: MaterialAdmin) {
    const motivo = await pedirTexto({
      titulo: `Retirar "${item.titulo}" do ar?`,
      mensagem: 'O material deixa de aparecer para os colegas e fica como "Recusado". O autor verá o motivo.',
      rotulo: 'Motivo',
      valorInicial: 'Não segue as regras de uso.',
      textoConfirmar: 'Retirar do ar',
      perigo: true,
    })
    if (motivo === null) return
    const { error } = await supabase.rpc('moderar_material', { p_material_id: item.id, p_aprovar: false, p_motivo: motivo })
    if (error) setErro(error.message)
    else aoMudar()
  }

  async function publicar(item: MaterialAdmin) {
    const { error } = await supabase.rpc('moderar_material', { p_material_id: item.id, p_aprovar: true, p_motivo: null })
    if (error) setErro(error.message)
    else aoMudar()
  }

  async function excluir(item: MaterialAdmin) {
    const ok = await confirmar({
      titulo: `Excluir "${item.titulo}"?`,
      mensagem: `O material de ${item.autor_nome} é apagado para sempre${item.arquivo_path ? ', junto com o arquivo anexado' : ''}. Isso não pode ser desfeito.`,
      textoConfirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    if (item.arquivo_path) await supabase.storage.from('materiais').remove([item.arquivo_path])
    const { error } = await supabase.from('materiais').delete().eq('id', item.id)
    if (error) setErro(error.message)
    else aoMudar()
  }

  function filtrar(acao: () => void) {
    acao()
    setQuantos(POR_PAGINA)
  }

  return (
    <div className="cartao todos-materiais">
      <h3>
        <Library size={20} color="#8257e5" aria-hidden="true" /> Todos os materiais ({lista.length})
      </h3>
      <p className="item-meta">
        Tudo o que foi enviado ao site. Publicados aparecem para os alunos no fim do quiz, no Guru, no Carreiras e
        no perfil de quem enviou.
      </p>

      <div className="chips-areas" role="group" aria-label="Filtrar por situação">
        {OPCOES_STATUS.map((o) => (
          <button
            key={o.valor}
            type="button"
            aria-pressed={status === o.valor}
            className={`chip${status === o.valor ? ' ativo' : ''}${totais[o.valor] === 0 ? ' chip-vazio' : ''}`}
            onClick={() => filtrar(() => setStatus(o.valor))}
          >
            {o.label}
            <span className="chip-total">{totais[o.valor]}</span>
          </button>
        ))}
      </div>

      <div className="form-linha">
        <input
          className="campo"
          type="search"
          value={busca}
          onChange={(e) => filtrar(() => setBusca(e.target.value))}
          placeholder="Buscar por título, autor, e-mail, link ou arquivo"
          aria-label="Buscar materiais"
        />
        <select
          className="campo todos-materiais-disciplina"
          value={disciplina}
          onChange={(e) => filtrar(() => setDisciplina(e.target.value))}
          aria-label="Disciplina"
        >
          <option value="">Todas as disciplinas</option>
          <option value="sem">Sem disciplina</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
      </div>

      {erro ? <p className="aviso erro">{erro}</p> : null}
      {carregando ? <p className="status">Carregando...</p> : null}

      {!carregando && filtrados.length === 0 ? (
        <p className="vazio">Nenhum material com esses filtros.</p>
      ) : (
        <ul className="lista">
          {filtrados.slice(0, quantos).map((item) => (
            <li key={item.id} className="item-lista">
              <div>
                <strong>
                  {item.titulo}
                  <span className={`selo${item.status === 'recusado' ? ' selo-alerta' : ''}`}>{ROTULO_STATUS[item.status]}</span>
                  <span className="selo">{item.disciplina_nome ?? 'Sem disciplina'}</span>
                  {item.denuncias > 0 ? <span className="selo selo-alerta">{item.denuncias} denúncia(s)</span> : null}
                </strong>
                <span className="item-meta">
                  Enviado por {item.autor_nome}
                  {item.autor_email ? ` (${item.autor_email})` : ''} em {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                </span>
                {item.descricao ? <span className="item-meta">{item.descricao}</span> : null}
                {item.status === 'recusado' && item.motivo_moderacao ? (
                  <span className="item-meta">Motivo da recusa: {item.motivo_moderacao}</span>
                ) : null}
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
              </div>
              <div className="acoes-item">
                {item.status === 'aprovado' ? (
                  <button type="button" className="btn btn-secundario" onClick={() => retirar(item)}>
                    Retirar do ar
                  </button>
                ) : (
                  <button type="button" className="btn btn-primario" onClick={() => publicar(item)}>
                    Publicar
                  </button>
                )}
                <button type="button" className="btn btn-perigo" onClick={() => excluir(item)}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {filtrados.length > quantos ? (
        <button type="button" className="btn btn-secundario todos-materiais-mais" onClick={() => setQuantos((q) => q + POR_PAGINA)}>
          Ver mais ({filtrados.length - quantos})
        </button>
      ) : null}
    </div>
  )
}
