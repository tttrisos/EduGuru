// EduGuru Carreiras: leitura das vagas da API do GitHub, filtro por área e cache.
// As vagas são issues públicas dos repositórios abaixo (comunidades brasileiras de tecnologia).
// Documentação da integração: docs/INTEGRACAO_GITHUB_VAGAS.md.

export const FONTES = ['backend-br/vagas', 'frontendbr/vagas'] as const
export type Fonte = (typeof FONTES)[number]

export type NivelVaga = 'Estágio' | 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista'
export type ModalidadeVaga = 'Remoto' | 'Híbrido' | 'Presencial'

// Só o que o EduGuru usa da issue. O texto da vaga (body) e quem publicou são descartados:
// podem ter e-mail e telefone de recrutadores, e o aluno lê tudo no site de origem.
export type Vaga = {
  fonte: Fonte
  numero: number
  titulo: string
  url: string
  etiquetas: string[]
  publicadaEm: string
  nivel: NivelVaga | null
  modalidade: ModalidadeVaga | null
}

export type AreaParaFiltro = { id: number; nome: string; palavras_chave: string[] }

// Etiquetas que indicam que a issue não é uma vaga válida ou está abandonada.
const ETIQUETAS_IGNORADAS = ['stale', 'link-quebrado', 'triagem-recusada', 'avisos', 'falta de informacoes', 'pendente de informacoes']

// Vagas abertas há mais tempo que isso costumam estar encerradas.
export const IDADE_MAXIMA_DIAS = 90

export const CHAVE_CACHE = 'eduguru-vagas-v1'
export const VALIDADE_CACHE_MS = 30 * 60 * 1000
export const TEMPO_LIMITE_MS = 10_000

// Sem acento, minúsculo e com espaços simples.
export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const ehLetraOuNumero = (c: string | undefined) => !!c && /[a-z0-9]/.test(c)

// A palavra aparece como termo inteiro? ("java" não casa com "javascript"; "c#" e ".net" funcionam.)
export function contemTermo(texto: string, termo: string) {
  const t = normalizar(termo)
  if (!t) return false
  const alvo = normalizar(texto)
  let i = alvo.indexOf(t)
  while (i !== -1) {
    const antes = alvo[i - 1]
    const depois = alvo[i + t.length]
    const inicioOk = !ehLetraOuNumero(t[0]) || !ehLetraOuNumero(antes)
    const fimOk = !ehLetraOuNumero(t[t.length - 1]) || !ehLetraOuNumero(depois)
    if (inicioOk && fimOk) return true
    i = alvo.indexOf(t, i + 1)
  }
  return false
}

function textoDaVaga(vaga: Pick<Vaga, 'titulo' | 'etiquetas'>) {
  return `${vaga.titulo} ${vaga.etiquetas.join(' ')}`
}

// Termos da área que aparecem na vaga (vazio = a vaga não é da área).
export function termosEncontrados(vaga: Pick<Vaga, 'titulo' | 'etiquetas'>, area: AreaParaFiltro) {
  const texto = textoDaVaga(vaga)
  return area.palavras_chave.filter((p) => contemTermo(texto, p))
}

export function vagaDaArea(vaga: Pick<Vaga, 'titulo' | 'etiquetas'>, area: AreaParaFiltro) {
  return termosEncontrados(vaga, area).length > 0
}

const NIVEIS: [NivelVaga, string[]][] = [
  ['Estágio', ['estagio', 'estagiario', 'estagiaria', 'intern', 'internship']],
  ['Júnior', ['junior', 'jr', 'jr.']],
  ['Pleno', ['pleno', 'mid-level', 'mid level']],
  ['Sênior', ['senior', 'sr', 'sr.']],
  ['Especialista', ['especialista', 'staff', 'principal']],
]

// Primeiro olha as etiquetas (mais confiáveis), depois o título.
export function nivelDaVaga(titulo: string, etiquetas: string[]): NivelVaga | null {
  for (const fonte of [etiquetas.join(' | '), titulo]) {
    for (const [nivel, termos] of NIVEIS) {
      if (termos.some((t) => contemTermo(fonte, t))) return nivel
    }
  }
  return null
}

const MODALIDADES: [ModalidadeVaga, string[]][] = [
  ['Remoto', ['remoto', 'remote', 'home office']],
  ['Híbrido', ['hibrido', 'hybrid']],
  ['Presencial', ['presencial', 'on-site', 'alocado']],
]

export function modalidadeDaVaga(titulo: string, etiquetas: string[]): ModalidadeVaga | null {
  for (const fonte of [etiquetas.join(' | '), titulo]) {
    for (const [modalidade, termos] of MODALIDADES) {
      if (termos.some((t) => contemTermo(fonte, t))) return modalidade
    }
  }
  return null
}

// Formato da issue devolvida pela API do GitHub (só os campos lidos).
export type IssueGitHub = {
  number: number
  title: string
  html_url: string
  created_at: string
  labels?: ({ name?: string } | string)[]
  pull_request?: unknown
}

// Converte a issue em vaga; devolve null quando não é uma vaga válida.
export function converterIssue(issue: IssueGitHub, fonte: Fonte, agora = Date.now()): Vaga | null {
  if (!issue || issue.pull_request) return null
  if (typeof issue.number !== 'number' || typeof issue.title !== 'string') return null
  if (!/^https:\/\/github\.com\//.test(issue.html_url ?? '')) return null

  const etiquetas = (issue.labels ?? [])
    .map((l) => (typeof l === 'string' ? l : (l.name ?? '')))
    .filter((l) => l.trim() !== '')
  if (etiquetas.some((e) => ETIQUETAS_IGNORADAS.some((ig) => normalizar(e).includes(ig)))) return null

  const publicada = Date.parse(issue.created_at)
  if (Number.isNaN(publicada) || agora - publicada > IDADE_MAXIMA_DIAS * 24 * 60 * 60 * 1000) return null

  const titulo = issue.title.trim()
  return {
    fonte,
    numero: issue.number,
    titulo,
    url: issue.html_url,
    etiquetas,
    publicadaEm: new Date(publicada).toISOString(),
    nivel: nivelDaVaga(titulo, etiquetas),
    modalidade: modalidadeDaVaga(titulo, etiquetas),
  }
}

// Mais recentes primeiro.
export function ordenarVagas(vagas: Vaga[]) {
  return [...vagas].sort((a, b) => b.publicadaEm.localeCompare(a.publicadaEm))
}

// Filtros da tela: áreas (vazio = todas), nível e busca livre.
export type FiltroVagas = {
  areas: AreaParaFiltro[]
  nivel: 'todos' | 'inicio' | NivelVaga
  busca: string
}

export function filtrarVagas(vagas: Vaga[], filtro: FiltroVagas) {
  const busca = normalizar(filtro.busca)
  return vagas.filter((v) => {
    if (filtro.areas.length > 0 && !filtro.areas.some((a) => vagaDaArea(v, a))) return false
    if (filtro.nivel === 'inicio' && v.nivel !== 'Estágio' && v.nivel !== 'Júnior') return false
    if (filtro.nivel !== 'todos' && filtro.nivel !== 'inicio' && v.nivel !== filtro.nivel) return false
    if (busca && !normalizar(textoDaVaga(v)).includes(busca)) return false
    return true
  })
}

// Cache no navegador

type ArmazenamentoSimples = Pick<Storage, 'getItem' | 'setItem'>

export type CacheVagas = { salvoEm: number; vagas: Vaga[] }

function vagaValida(v: unknown): v is Vaga {
  const x = v as Vaga
  return (
    !!x &&
    (FONTES as readonly string[]).includes(x.fonte) &&
    typeof x.numero === 'number' &&
    typeof x.titulo === 'string' &&
    typeof x.url === 'string' &&
    /^https:\/\/github\.com\//.test(x.url) &&
    Array.isArray(x.etiquetas) &&
    typeof x.publicadaEm === 'string'
  )
}

export function lerCache(armazenamento: ArmazenamentoSimples | null): CacheVagas | null {
  if (!armazenamento) return null
  try {
    const bruto = armazenamento.getItem(CHAVE_CACHE)
    if (!bruto) return null
    const dados = JSON.parse(bruto) as CacheVagas
    if (typeof dados?.salvoEm !== 'number' || !Array.isArray(dados.vagas)) return null
    return { salvoEm: dados.salvoEm, vagas: dados.vagas.filter(vagaValida) }
  } catch {
    return null
  }
}

export function salvarCache(armazenamento: ArmazenamentoSimples | null, cache: CacheVagas) {
  if (!armazenamento) return
  try {
    armazenamento.setItem(CHAVE_CACHE, JSON.stringify(cache))
  } catch {
    // Sem espaço ou armazenamento bloqueado: segue sem cache.
  }
}

// Acesso à API

export type ResultadoVagas = {
  vagas: Vaga[]
  // api = acabou de buscar; cache = cópia recente; cache-antigo = GitHub fora do ar, cópia antiga
  origem: 'api' | 'cache' | 'cache-antigo'
  salvoEm: number
  aviso: string
}

export class ErroVagas extends Error {}

export const MSG_SEM_CONEXAO =
  'Não foi possível buscar as vagas no GitHub agora. Confira sua conexão e tente de novo em alguns minutos.'

function horaCurta(ms: number) {
  return new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Mensagem amigável para cada tipo de falha.
export function mensagemDeErro(status: number | null, cabecalhos?: Pick<Headers, 'get'>) {
  if (status === 403 || status === 429) {
    const restante = cabecalhos?.get('x-ratelimit-remaining')
    const reinicio = Number(cabecalhos?.get('x-ratelimit-reset'))
    if (restante === '0' && reinicio > 0) {
      return `O GitHub limitou as consultas desta rede por um tempo. Tente de novo depois das ${horaCurta(reinicio * 1000)}.`
    }
    return 'O GitHub limitou as consultas desta rede por um tempo. Tente de novo em alguns minutos.'
  }
  if (status !== null && status >= 500) return 'O GitHub está fora do ar no momento. Tente de novo em alguns minutos.'
  return MSG_SEM_CONEXAO
}

export function urlDaFonte(fonte: Fonte) {
  return `https://api.github.com/repos/${fonte}/issues?state=open&per_page=100`
}

async function buscarFonte(fonte: Fonte, fetchFn: typeof fetch, agora: number): Promise<Vaga[]> {
  const controle = new AbortController()
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS)
  let resposta: Response
  try {
    resposta = await fetchFn(urlDaFonte(fonte), {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controle.signal,
    })
  } catch {
    throw new ErroVagas(MSG_SEM_CONEXAO)
  } finally {
    clearTimeout(timer)
  }
  if (!resposta.ok) throw new ErroVagas(mensagemDeErro(resposta.status, resposta.headers))
  let dados: unknown
  try {
    dados = await resposta.json()
  } catch {
    throw new ErroVagas(MSG_SEM_CONEXAO)
  }
  if (!Array.isArray(dados)) throw new ErroVagas(MSG_SEM_CONEXAO)
  return dados.map((i) => converterIssue(i as IssueGitHub, fonte, agora)).filter((v): v is Vaga => v !== null)
}

function armazenamentoPadrao(): ArmazenamentoSimples | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

// Busca as vagas das duas fontes. Usa o cache por 30 minutos; se o GitHub falhar,
// mostra a última cópia salva e avisa. Só lança erro quando não há nada para mostrar.
export async function buscarVagas(opcoes: {
  forcar?: boolean
  fetchFn?: typeof fetch
  armazenamento?: ArmazenamentoSimples | null
  agora?: number
} = {}): Promise<ResultadoVagas> {
  const fetchFn = opcoes.fetchFn ?? fetch.bind(globalThis)
  const armazenamento = opcoes.armazenamento === undefined ? armazenamentoPadrao() : opcoes.armazenamento
  const agora = opcoes.agora ?? Date.now()
  const cache = lerCache(armazenamento)

  if (!opcoes.forcar && cache && agora - cache.salvoEm < VALIDADE_CACHE_MS) {
    return { vagas: cache.vagas, origem: 'cache', salvoEm: cache.salvoEm, aviso: '' }
  }

  const resultados = await Promise.allSettled(FONTES.map((f) => buscarFonte(f, fetchFn, agora)))
  const falhas = resultados.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

  if (falhas.length === FONTES.length) {
    const motivo = falhas[0].reason instanceof ErroVagas ? falhas[0].reason.message : MSG_SEM_CONEXAO
    if (cache && cache.vagas.length > 0) {
      return {
        vagas: cache.vagas,
        origem: 'cache-antigo',
        salvoEm: cache.salvoEm,
        aviso: `${motivo} Mostrando as vagas salvas em ${new Date(cache.salvoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`,
      }
    }
    throw new ErroVagas(motivo)
  }

  // Uma fonte falhou: usa a cópia antiga só dela.
  const vagas: Vaga[] = []
  const fontesComFalha: Fonte[] = []
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') vagas.push(...r.value)
    else {
      fontesComFalha.push(FONTES[i])
      vagas.push(...(cache?.vagas.filter((v) => v.fonte === FONTES[i]) ?? []))
    }
  })

  const ordenadas = ordenarVagas(vagas)
  salvarCache(armazenamento, { salvoEm: agora, vagas: ordenadas })
  return {
    vagas: ordenadas,
    origem: 'api',
    salvoEm: agora,
    aviso: fontesComFalha.length
      ? `Não foi possível atualizar as vagas de ${fontesComFalha.join(', ')}; as demais estão em dia.`
      : '',
  }
}
