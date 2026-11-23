import { useEffect, useState } from 'react'
import { useDialogo } from '../../../compartilhado/componentes/Dialogo'
import { Link } from 'react-router-dom'
import { supabase } from '../../../compartilhado/banco/supabase'
import { cursosDa, type Disciplina, type Material, type StatusMaterial } from '../../../compartilhado/tipos'
import { useAuth } from '../../../compartilhado/sessao/ContextoSessao'
import { formatarTamanho, gerarLinksArquivos } from '../../../compartilhado/banco/arquivos'
import { linkCurto, type ResultadoFiltro } from './filtroMateriais'
import Moderacao from './Moderacao'
import TodosMateriais from './TodosMateriais'
import ListasDoFiltro from './ListasDoFiltro'
import './materiais.css'

const LIMITE_MB = 5
const LIMITE_BYTES = LIMITE_MB * 1024 * 1024
const LIMITE_DESCRICAO = 500
const TIPOS_ACEITOS = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]

const SITUACAO: Record<StatusMaterial, string> = {
  aprovado: 'Público',
  pendente: 'Em análise',
  recusado: 'Recusado',
}

async function consultarMateriais(usuarioId: string) {
  const [materiais, disciplinas, sites] = await Promise.all([
    supabase.from('materiais').select('*').eq('enviado_por', usuarioId).order('id', { ascending: false }),
    supabase.from('disciplinas').select('*').order('nome'),
    supabase.from('filtro_sites').select('dominio').order('dominio'),
  ])
  const listaDisciplinas = (disciplinas.data as Disciplina[]) ?? []
  const listaSites = ((sites.data as { dominio: string }[]) ?? []).map((s) => s.dominio)
  if (materiais.error) {
    return { lista: [] as Material[], disciplinas: listaDisciplinas, sites: listaSites, urls: {}, erro: materiais.error.message }
  }

  const lista = (materiais.data as Material[]) ?? []
  const caminhos = lista.map((m) => m.arquivo_path).filter((p): p is string => !!p)
  const urls = await gerarLinksArquivos(caminhos)
  return { lista, disciplinas: listaDisciplinas, sites: listaSites, urls, erro: null }
}

export default function Materiais() {
  const { confirmar } = useDialogo()
  const { usuario, ehAdmin } = useAuth()
  const usuarioId = usuario?.id ?? ''
  const [lista, setLista] = useState<Material[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [sitesPermitidos, setSitesPermitidos] = useState<string[]>([])
  const [urlsArquivos, setUrlsArquivos] = useState<Record<string, string>>({})
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [link, setLink] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  // Material em edição (null = cadastrando um novo). O arquivo não é trocado na edição.
  const [editando, setEditando] = useState<Material | null>(null)
  // Admin: aumenta quando a Moderação ou "Todos os materiais" mudam algo, para as listas recarregarem juntas.
  const [versaoAdmin, setVersaoAdmin] = useState(0)

  async function buscar() {
    try {
      const resultado = await consultarMateriais(usuarioId)
      setDisciplinas(resultado.disciplinas)
      setSitesPermitidos(resultado.sites)
      if (resultado.erro) setErro(resultado.erro)
      else {
        setLista(resultado.lista)
        setUrlsArquivos(resultado.urls)
      }
    } catch {
      setErro('Não foi possível conectar ao banco.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (!usuarioId) return
    consultarMateriais(usuarioId)
      .then((resultado) => {
        setDisciplinas(resultado.disciplinas)
        setSitesPermitidos(resultado.sites)
        if (resultado.erro) setErro(resultado.erro)
        else {
          setLista(resultado.lista)
          setUrlsArquivos(resultado.urls)
        }
      })
      .catch(() => setErro('Não foi possível conectar ao banco.'))
      .finally(() => setCarregando(false))
  }, [usuarioId])

  function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const selecionado = e.target.files?.[0] ?? null
    setErro('')

    if (!selecionado) {
      setArquivo(null)
      return
    }
    if (!TIPOS_ACEITOS.includes(selecionado.type)) {
      setErro('Só é permitido anexar arquivos PDF ou DOCX.')
      e.target.value = ''
      setArquivo(null)
      return
    }
    if (selecionado.size > LIMITE_BYTES) {
      setErro(`O arquivo passou do limite de ${LIMITE_MB} MB.`)
      e.target.value = ''
      setArquivo(null)
      return
    }
    setArquivo(selecionado)
  }

  // O filtro é consultado no banco antes de subir o arquivo, para um material recusado nem ocupar
  // espaço. Ao gravar, o gatilho do banco aplica o filtro de novo, então a API direta também passa por ele.
  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (titulo.trim().length < 3) {
      setErro('Preencha o título do material (pelo menos 3 letras).')
      return
    }
    if (!disciplinaId) {
      setErro('Escolha a disciplina: é por ela que o material aparece no fim do quiz.')
      return
    }
    if (!link.trim() && !arquivo && !editando?.arquivo_path) {
      setErro('Informe um link OU anexe um arquivo (PDF/DOCX).')
      return
    }
    const arquivoNome = editando ? editando.arquivo_nome : (arquivo?.name ?? null)
    setEnviando(true)
    const { data: filtro, error: erroFiltro } = await supabase.rpc('verificar_material', {
      p_titulo: titulo,
      p_descricao: descricao || null,
      p_link: link.trim() || null,
      p_arquivo_nome: arquivoNome,
    })
    const resultado = filtro as ResultadoFiltro | null
    if (erroFiltro || !resultado) {
      setEnviando(false)
      setErro(erroFiltro?.message ?? 'Não foi possível conferir o material. Tente de novo.')
      return
    }
    if (resultado.motivo) {
      setEnviando(false)
      setErro(resultado.motivo)
      return
    }
    // Site fora da lista: não é recusado, mas o aluno precisa saber que vai esperar a análise.
    // Na edição, só conta se o link mudou (o banco faz a mesma conta).
    const linkMudou = !editando || link.trim() !== (editando.link ?? '')
    const siteNovo = resultado.site_novo && !ehAdmin && linkMudou
    if (siteNovo) {
      const ok = await confirmar({
        titulo: 'Este site ainda não está na lista de sites permitidos',
        mensagem:
          'Tudo bem: o material vai para a análise da equipe e fica público depois de aprovado. Se o site for liberado, os próximos links dele já passam direto.',
        textoConfirmar: 'Enviar para análise',
      })
      if (!ok) {
        setEnviando(false)
        return
      }
    }

    if (editando) {
      const { error } = await supabase
        .from('materiais')
        .update({
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          link: link.trim() || null,
          disciplina_id: Number(disciplinaId),
        })
        .eq('id', editando.id)
      setEnviando(false)
      if (error) {
        setErro(error.message)
        return
      }
      setSucesso(
        (editando.status === 'recusado' || siteNovo) && !ehAdmin
          ? 'Material alterado! Ele volta para a análise da equipe.'
          : 'Material alterado!',
      )
      limparFormulario()
      buscar()
      return
    }

    // Nome do arquivo no armazenamento: tira acentos e símbolos (nome "sanitizado") e coloca um
    // identificador aleatório na frente, para dois alunos nunca sobrescreverem o arquivo um do outro.
    let arquivoPath: string | null = null
    if (arquivo) {
      const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      arquivoPath = `${crypto.randomUUID()}-${nomeSeguro}`

      const { error: erroUpload } = await supabase.storage
        .from('materiais')
        .upload(arquivoPath, arquivo, { contentType: arquivo.type })

      if (erroUpload) {
        setErro(`Falha ao enviar o arquivo: ${erroUpload.message}`)
        setEnviando(false)
        return
      }
    }

    const { error } = await supabase.from('materiais').insert([
      {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        link: link.trim() || null,
        arquivo_path: arquivoPath,
        arquivo_nome: arquivo?.name ?? null,
        arquivo_tamanho: arquivo?.size ?? null,
        disciplina_id: Number(disciplinaId),
      },
    ])

    setEnviando(false)

    if (error) {
      // O banco recusou a linha: apaga o arquivo que já tinha subido, para não sobrar arquivo órfão.
      if (arquivoPath) await supabase.storage.from('materiais').remove([arquivoPath])
      setErro(error.message)
      return
    }

    setSucesso(
      arquivo && !ehAdmin
        ? 'Material enviado! Arquivos passam pela análise da equipe antes de ficarem públicos.'
        : siteNovo
          ? 'Material enviado! Como o site é novo, ele passa pela análise da equipe antes de ficar público.'
          : 'Material publicado! Ele já aparece para os colegas no fim do quiz.',
    )
    limparFormulario()
    buscar()
  }

  function limparFormulario() {
    setEditando(null)
    setTitulo('')
    setDescricao('')
    setLink('')
    setDisciplinaId('')
    setArquivo(null)
  }

  function editar(item: Material) {
    setEditando(item)
    setTitulo(item.titulo)
    setDescricao(item.descricao ?? '')
    setLink(item.link ?? '')
    setDisciplinaId(item.disciplina_id ? String(item.disciplina_id) : '')
    setArquivo(null)
    setErro('')
    setSucesso('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function aoMudarAdmin() {
    setVersaoAdmin((v) => v + 1)
    buscar()
  }

  async function excluir(item: Material) {
    const ok = await confirmar({
      titulo: `Excluir o material "${item.titulo}"?`,
      mensagem: item.arquivo_path ? 'O arquivo anexado também será apagado.' : undefined,
      textoConfirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    if (item.arquivo_path) {
      await supabase.storage.from('materiais').remove([item.arquivo_path])
    }
    const { error } = await supabase.from('materiais').delete().eq('id', item.id)
    if (error) setErro(error.message)
    else buscar()
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Meus materiais</h2>
        <p>Compartilhe com os colegas os links e as apostilas que ajudaram você.</p>
        <p className="pagina-fatos">
          <span>PDF ou DOCX até {LIMITE_MB} MB</span>
          <span>Os aprovados aparecem no fim do quiz da disciplina</span>
          <span>
            Veja o <Link to={`/perfil/${usuarioId}`}>seu perfil público</Link>
          </span>
        </p>
      </header>

      <div className="cartao">
        <form onSubmit={salvar} className="form-material">
          <label className="rotulo">
            Título
            <input
              className="campo"
              value={titulo}
              maxLength={120}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Videoaula de JOIN no PostgreSQL"
            />
          </label>
          <label className="rotulo">
            Disciplina
            <select className="campo" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
              <option value="">Escolha a disciplina</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} ({cursosDa(d).join('/')})
                </option>
              ))}
            </select>
          </label>
          <label className="rotulo form-material-inteiro">
            Link (https://)
            <input
              className="campo"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.youtube.com/... (opcional se anexar arquivo)"
            />
          </label>
          <label className="rotulo form-material-inteiro">
            Como esse material ajuda? <small>(opcional)</small>
            <textarea
              className="campo campo-texto"
              value={descricao}
              maxLength={LIMITE_DESCRICAO}
              rows={3}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Explica LEFT JOIN com exemplos; me ajudou a entender a questão de cardinalidade."
            />
            <small className="contador">
              {descricao.length}/{LIMITE_DESCRICAO}
            </small>
          </label>
          {editando ? (
            editando.arquivo_path ? (
              <p className="item-meta form-material-inteiro">
                📎 {editando.arquivo_nome} — o arquivo não é trocado na edição. Para enviar outro, exclua
                este material e compartilhe de novo.
              </p>
            ) : null
          ) : (
            <label className="campo-arquivo form-material-inteiro">
              <input type="file" accept=".pdf,.docx" onChange={aoEscolherArquivo} />
              {arquivo ? `📎 ${arquivo.name} (${formatarTamanho(arquivo.size)})` : 'Anexar PDF/DOCX (opcional)'}
            </label>
          )}

          <details className="regras-material form-material-inteiro">
            <summary>Regras de publicação</summary>
            <ul>
              <li>
                Links destes sites são publicados na hora: {sitesPermitidos.join(', ')}. Links de outros sites vão
                para a análise da equipe.
              </li>
              <li>Nada de conteúdo impróprio, ofensivo, pirataria, apostas ou qualquer coisa ilegal.</li>
              <li>Não coloque dados pessoais (CPF, e-mail, telefone) no título, na descrição ou no arquivo.</li>
              <li>Arquivos ficam em análise até a equipe aprovar. Links aprovados pelo filtro já ficam públicos.</li>
              <li>Junto do material aparecem seu nome abreviado (ex.: Maria S.) e seu curso.</li>
            </ul>
          </details>

          <div className="acoes-item form-material-inteiro">
            <button type="submit" className="btn btn-primario" disabled={enviando}>
              {enviando ? 'Enviando...' : editando ? 'Salvar alterações' : 'Compartilhar material'}
            </button>
            {editando ? (
              <button type="button" className="btn btn-secundario" onClick={limparFormulario}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        {erro ? <p className="aviso erro">{erro}</p> : null}
        {sucesso ? <p className="aviso sucesso">{sucesso}</p> : null}
      </div>

      <div className="cartao">
        <h3>Enviados por você ({lista.length})</h3>
        {carregando ? <p className="status">Carregando...</p> : null}

        {!carregando && lista.length === 0 ? (
          <p className="vazio">Você ainda não compartilhou nenhum material.</p>
        ) : (
          <ul className="lista">
            {lista.map((item) => (
              <li key={item.id} className="item-lista">
                <div>
                  <strong>
                    {item.titulo}
                    <span className={`selo situacao-${item.status}`}>{SITUACAO[item.status]}</span>
                    {item.disciplina_id ? (
                      <span className="selo">
                        {disciplinas.find((d) => d.id === item.disciplina_id)?.nome ?? 'Disciplina'}
                      </span>
                    ) : null}
                  </strong>
                  {item.descricao ? <span className="item-meta">{item.descricao}</span> : null}
                  <span className="item-meta">
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer noopener" title={item.link}>
                        {linkCurto(item.link)}
                      </a>
                    ) : null}
                    {item.arquivo_path && urlsArquivos[item.arquivo_path] ? (
                      <a href={urlsArquivos[item.arquivo_path]} target="_blank" rel="noreferrer noopener">
                        📎 {item.arquivo_nome} ({formatarTamanho(item.arquivo_tamanho)})
                      </a>
                    ) : null}
                  </span>
                  {item.status !== 'aprovado' && item.motivo_moderacao ? (
                    <span className="item-meta">{item.motivo_moderacao}</span>
                  ) : null}
                </div>
                <div className="acoes-item">
                  <button type="button" className="btn btn-secundario" onClick={() => editar(item)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn-perigo" onClick={() => excluir(item)}>
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {ehAdmin ? (
        <>
          <Moderacao disciplinas={disciplinas} versao={versaoAdmin} aoMudar={aoMudarAdmin} />
          <TodosMateriais disciplinas={disciplinas} versao={versaoAdmin} aoMudar={aoMudarAdmin} />
          <ListasDoFiltro versao={versaoAdmin} aoMudar={aoMudarAdmin} />
        </>
      ) : null}
    </section>
  )
}
