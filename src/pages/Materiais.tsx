import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Material } from '../types'
import { useAuth } from '../contexts/AuthContext'

const LIMITE_MB = 5
const LIMITE_BYTES = LIMITE_MB * 1024 * 1024
const TIPOS_ACEITOS = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]

function formatarTamanho(bytes: number | null) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

// O bucket é privado: em vez de link público, geramos links assinados que
// expiram em 1 hora, só para quem está logado.
const VALIDADE_LINK_SEGUNDOS = 60 * 60

async function consultarMateriais() {
  const { data, error } = await supabase
    .from('materiais')
    .select('*')
    .order('id', { ascending: false })
  if (error) return { lista: [] as Material[], urls: {}, erro: error.message }

  const lista = (data as Material[]) ?? []
  const caminhos = lista.map((m) => m.arquivo_path).filter((p): p is string => !!p)
  const urls: Record<string, string> = {}

  if (caminhos.length > 0) {
    const { data: assinadas } = await supabase.storage
      .from('materiais')
      .createSignedUrls(caminhos, VALIDADE_LINK_SEGUNDOS)
    for (const item of assinadas ?? []) {
      if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
    }
  }
  return { lista, urls, erro: null }
}

export default function Materiais() {
  const { usuario, ehAdmin } = useAuth()
  const [lista, setLista] = useState<Material[]>([])
  const [urlsArquivos, setUrlsArquivos] = useState<Record<string, string>>({})
  const [titulo, setTitulo] = useState('')
  const [link, setLink] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  async function buscar() {
    try {
      const resultado = await consultarMateriais()

      if (resultado.erro) setErro(resultado.erro)
      else {
        setLista(resultado.lista)
        setUrlsArquivos(resultado.urls)
        setErro('')
      }
    } catch {
      setErro('Não foi possível conectar ao banco.')
    } finally {
      setCarregando(false)
    }
  }

  // Carga inicial: o setState fica dentro do .then (callback assíncrono),
  // não no corpo do efeito — é o que pede a regra react-hooks/set-state-in-effect.
  useEffect(() => {
    consultarMateriais()
      .then((resultado) => {
        if (resultado.erro) setErro(resultado.erro)
        else {
          setLista(resultado.lista)
          setUrlsArquivos(resultado.urls)
        }
      })
      .catch(() => setErro('Não foi possível conectar ao banco.'))
      .finally(() => setCarregando(false))
  }, [])

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

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!titulo.trim()) {
      setErro('Preencha o título do material.')
      return
    }
    if (!link.trim() && !arquivo) {
      setErro('Informe um link OU anexe um arquivo (PDF/DOCX).')
      return
    }

    setEnviando(true)

    // Upload só acontece se tiver arquivo selecionado.
    let arquivoPath: string | null = null
    let arquivoNome: string | null = null
    let arquivoTamanho: number | null = null

    if (arquivo) {
      const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const caminho = `${crypto.randomUUID()}-${nomeSeguro}`

      const { error: erroUpload } = await supabase.storage
        .from('materiais')
        .upload(caminho, arquivo, { contentType: arquivo.type })

      if (erroUpload) {
        setErro(`Falha ao enviar o arquivo: ${erroUpload.message}`)
        setEnviando(false)
        return
      }

      arquivoPath = caminho
      arquivoNome = arquivo.name
      arquivoTamanho = arquivo.size
    }

    const { error } = await supabase.from('materiais').insert([
      {
        titulo: titulo.trim(),
        link: link.trim() || null,
        arquivo_path: arquivoPath,
        arquivo_nome: arquivoNome,
        arquivo_tamanho: arquivoTamanho,
      },
    ])

    setEnviando(false)

    if (error) {
      setErro(error.message)
      return
    }

    setTitulo('')
    setLink('')
    setArquivo(null)
    buscar()
  }

  async function excluir(item: Material) {
    // Remove do Storage também, senão o arquivo fica órfão ocupando espaço.
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
        <h2>Materiais</h2>
        <p>
          Links e apostilas (PDF/DOCX, até {LIMITE_MB} MB). Na próxima entrega cada material
          passa a pertencer a uma disciplina.
        </p>
      </header>

      <div className="cartao">
        <form onSubmit={salvar} className="form-linha form-materiais">
          <input
            className="campo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título (ex: Apostila de React)"
          />
          <input
            className="campo"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://... (opcional se anexar arquivo)"
          />
          <label className="campo-arquivo">
            <input type="file" accept=".pdf,.docx" onChange={aoEscolherArquivo} />
            {arquivo ? `📎 ${arquivo.name} (${formatarTamanho(arquivo.size)})` : 'Anexar PDF/DOCX (opcional)'}
          </label>
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Adicionar'}
          </button>
        </form>

        {erro ? <p className="aviso erro">{erro}</p> : null}
        {carregando ? <p className="status">Carregando...</p> : null}

        {!carregando && lista.length === 0 ? (
          <p className="vazio">Nenhum material cadastrado ainda.</p>
        ) : (
          <ul className="lista">
            {lista.map((item) => (
              <li key={item.id} className="item-lista">
                <div>
                  <strong>{item.titulo}</strong>
                  <span className="item-meta">
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer">
                        {item.link}
                      </a>
                    ) : null}
                    {item.arquivo_path && urlsArquivos[item.arquivo_path] ? (
                      <a href={urlsArquivos[item.arquivo_path]} target="_blank" rel="noreferrer">
                        📎 {item.arquivo_nome} ({formatarTamanho(item.arquivo_tamanho)})
                      </a>
                    ) : null}
                  </span>
                </div>
                {/* Só quem enviou (ou admin) pode excluir — o RLS garante isso no banco. */}
                {ehAdmin || item.enviado_por === usuario?.id ? (
                  <button type="button" className="btn btn-perigo" onClick={() => excluir(item)}>
                    Excluir
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}