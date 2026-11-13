import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Library } from 'lucide-react'
import { useDialogo } from '../../compartilhado/Dialogo'
import { supabase } from '../../compartilhado/supabase'
import { formatarTamanho, gerarLinksArquivos } from '../../compartilhado/arquivos'
import type { Disciplina, Material, UsuarioAdmin } from '../../compartilhado/tipos'
import {
  ACOES_POR_STATUS,
  OPCOES_STATUS,
  ROTULO_ACAO,
  resumoAlvo,
  textoConfirmacao,
  type AcaoMassa,
  ROTULO_STATUS,
  contarPorStatus,
  filtrarMateriaisAdmin,
  ordenarMateriaisAdmin,
  type FiltroStatus,
  type MaterialAdmin,
} from './gestaoMateriais'
import { linkCurto } from './filtroMateriais'

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
  // Ações em massa: andamento ("Excluindo 3 de 10...") e resultado.
  const [processando, setProcessando] = useState('')
  const [sucesso, setSucesso] = useState('')

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

  // Ação em massa sobre TODOS os materiais da lista filtrada (não só os da página).
  // Sempre mostra um aviso detalhado e exige que o admin digite a confirmação (ex.: "EXCLUIR 5").
  async function executarEmMassa(acao: AcaoMassa) {
    const alvo = filtrados
    if (alvo.length === 0) return
    const r = resumoAlvo(alvo, { status, disciplina, busca }, (id) => disciplinas.find((d) => String(d.id) === id)?.nome ?? id)
    const plural = r.quantidade === 1 ? 'material' : 'materiais'
    const exigir = textoConfirmacao(acao, r.quantidade)

    const cabecalho = [
      `Situação: ${r.situacao}`,
      `Filtros aplicados: ${r.filtros}`,
      `Materiais atingidos: ${r.quantidade} (de ${r.autores} ${r.autores === 1 ? 'autor' : 'autores'})`,
      r.comArquivo > 0 ? `Com arquivo anexado: ${r.comArquivo}` : '',
      r.denunciados > 0 ? `Com denúncias: ${r.denunciados}` : '',
    ].filter(Boolean)

    const consequencia: Record<AcaoMassa, string[]> = {
      excluir: [
        `ATENÇÃO: os ${r.quantidade} ${plural} serão APAGADOS PARA SEMPRE, com os arquivos anexados.`,
        'Não existe lixeira: a exclusão NÃO pode ser desfeita.',
        'Os materiais somem do fim do quiz, do Guru, do Carreiras, do perfil dos autores e da lista dos próprios autores.',
      ],
      publicar: [
        `ATENÇÃO: os ${r.quantidade} ${plural} ficarão VISÍVEIS PARA TODOS OS ALUNOS (fim do quiz, Guru, Carreiras e perfil de quem enviou).`,
        status === 'pendente'
          ? 'Materiais em análise podem ter arquivos que você ainda NÃO abriu. Confira antes de publicar.'
          : 'Materiais recusados tinham sido barrados por um motivo. Confira antes de publicar.',
        r.denunciados > 0 ? 'As denúncias desses materiais serão apagadas.' : '',
      ].filter(Boolean),
      retirar: [
        `ATENÇÃO: os ${r.quantidade} ${plural} deixarão de aparecer para os alunos e ficarão como "Recusado".`,
        'Os autores verão o motivo que você informar no próximo passo. Dá para publicar de novo depois.',
      ],
    }

    const confirmado = await pedirTexto({
      titulo:
        acao === 'excluir'
          ? `Excluir PARA SEMPRE ${r.quantidade} ${plural}?`
          : `${ROTULO_ACAO[acao]}: ${r.quantidade} ${plural}?`,
      mensagem: [...consequencia[acao], '', ...cabecalho].join('\n'),
      rotulo: `Para confirmar, digite ${exigir}`,
      valorInicial: '',
      exigir,
      textoConfirmar: `${ROTULO_ACAO[acao].replace(' todos', '')} ${r.quantidade} ${plural}`,
      perigo: acao !== 'publicar',
    })
    if (confirmado === null) return

    let motivo: string | null = null
    if (acao === 'retirar') {
      motivo = await pedirTexto({
        titulo: 'Motivo para os autores',
        mensagem: `Este motivo aparece para os autores dos ${r.quantidade} ${plural}.`,
        rotulo: 'Motivo',
        valorInicial: 'Não segue as regras de uso.',
        textoConfirmar: 'Retirar do ar',
        perigo: true,
      })
      if (motivo === null) return
    }

    setErro('')
    setSucesso('')
    const falhas: string[] = []
    if (acao === 'excluir') {
      setProcessando(`Excluindo ${r.quantidade} ${plural}...`)
      const caminhos = alvo.map((m) => m.arquivo_path).filter((c): c is string => !!c)
      if (caminhos.length > 0) await supabase.storage.from('materiais').remove(caminhos)
      const { error } = await supabase.from('materiais').delete().in('id', alvo.map((m) => m.id))
      if (error) falhas.push(error.message)
    } else {
      for (let i = 0; i < alvo.length; i++) {
        setProcessando(`${acao === 'publicar' ? 'Publicando' : 'Retirando do ar'} ${i + 1} de ${alvo.length}...`)
        const { error } = await supabase.rpc('moderar_material', {
          p_material_id: alvo[i].id,
          p_aprovar: acao === 'publicar',
          p_motivo: motivo,
        })
        if (error) falhas.push(`"${alvo[i].titulo}": ${error.message}`)
      }
    }
    setProcessando('')
    if (falhas.length > 0) setErro(`Alguns materiais não foram alterados: ${falhas.join('; ')}`)
    const feitos = acao === 'excluir' ? (falhas.length ? 0 : r.quantidade) : r.quantidade - falhas.length
    if (feitos > 0) {
      const verbo = acao === 'excluir' ? 'excluído(s)' : acao === 'publicar' ? 'publicado(s)' : 'retirado(s) do ar'
      setSucesso(`${feitos} ${feitos === 1 ? 'material' : 'materiais'} ${verbo}.`)
    }
    aoMudar()
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

      {filtrados.length > 0 ? (
        <div className="acoes-massa">
          <p>
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
              <strong>Ações em massa:</strong> valem para os <strong>{filtrados.length}</strong>{' '}
              {filtrados.length === 1 ? 'material' : 'materiais'} desta lista
              {disciplina || busca.trim() ? ' (com os filtros aplicados)' : ''}, inclusive os que não aparecem na página.
            </span>
          </p>
          <div className="acoes-massa-botoes">
            {ACOES_POR_STATUS[status].map((acao) => (
              <button
                key={acao}
                type="button"
                className={`btn ${acao === 'publicar' ? 'btn-primario' : acao === 'excluir' ? 'btn-perigo' : 'btn-secundario'}`}
                onClick={() => executarEmMassa(acao)}
                disabled={!!processando}
              >
                {ROTULO_ACAO[acao]} ({filtrados.length})
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {processando ? <p className="status">{processando}</p> : null}
      {sucesso ? <p className="aviso sucesso">{sucesso}</p> : null}
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
