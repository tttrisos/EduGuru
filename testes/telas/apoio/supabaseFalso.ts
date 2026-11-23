// Supabase falso para os testes de tela: responde com os dados de `banco` e registra as chamadas.
// Os filtros (eq, order...) são aceitos e ignorados; as regras de acesso de verdade são testadas
// no próprio banco (supabase/testes/testes_funcoes_banco.sql).

type Erro = { message: string; code?: string }
type Resposta = { data: unknown; error: Erro | null; count?: number }
type ValorRpc = unknown | ((args: Record<string, unknown> | undefined) => Resposta | unknown)

export type Chamada = { tipo: string; nome: string; args?: unknown }

export const banco = {
  tabelas: {} as Record<string, unknown[]>,
  rpc: {} as Record<string, ValorRpc>,
  erros: {} as Record<string, string>,
  sessao: null as null | { user: { id: string; email: string; created_at: string } },
  nivel: { currentLevel: 'aal1', nextLevel: 'aal1' },
  fatores: [] as { id: string; status: string; factor_type: string }[],
  auth: {} as Record<string, (...args: unknown[]) => unknown>,
  chamadas: [] as Chamada[],
}

export function limparBanco() {
  banco.tabelas = {}
  banco.rpc = {}
  banco.erros = {}
  banco.sessao = null
  banco.nivel = { currentLevel: 'aal1', nextLevel: 'aal1' }
  banco.fatores = []
  banco.auth = {}
  banco.chamadas = []
}

export function chamou(tipo: string, nome: string) {
  return banco.chamadas.filter((c) => c.tipo === tipo && c.nome === nome)
}

function erro(nome: string): Erro | null {
  return nome in banco.erros ? { message: banco.erros[nome] } : null
}

function consulta(tabela: string) {
  const linhas = () => banco.tabelas[tabela] ?? []
  const resposta = (): Resposta =>
    erro(tabela) ? { data: null, error: erro(tabela) } : { data: linhas(), error: null, count: linhas().length }
  const uma = (): Resposta => (erro(tabela) ? { data: null, error: erro(tabela) } : { data: linhas()[0] ?? null, error: null })

  const construtor: Record<string, unknown> = {}
  const proxy: Record<string, unknown> = new Proxy(construtor, {
    get(_alvo, prop: string) {
      if (prop === 'then') {
        return (ok: (r: Resposta) => unknown, falha?: (e: unknown) => unknown) => Promise.resolve(resposta()).then(ok, falha)
      }
      if (prop === 'single' || prop === 'maybeSingle') return () => Promise.resolve(uma())
      return (...args: unknown[]) => {
        banco.chamadas.push({ tipo: prop, nome: tabela, args })
        return proxy
      }
    },
  })
  return proxy
}

function rpc(nome: string, args?: Record<string, unknown>) {
  banco.chamadas.push({ tipo: 'rpc', nome, args })
  if (erro(nome)) return Promise.resolve({ data: null, error: erro(nome) })
  const valor = banco.rpc[nome]
  if (typeof valor === 'function') {
    const r = (valor as (a: unknown) => unknown)(args)
    if (r && typeof r === 'object' && 'error' in (r as object)) return Promise.resolve(r)
    return Promise.resolve({ data: r ?? null, error: null })
  }
  return Promise.resolve({ data: valor ?? null, error: null })
}

function auth(nome: string, padrao: (...args: unknown[]) => unknown) {
  return (...args: unknown[]) => {
    banco.chamadas.push({ tipo: 'auth', nome, args })
    return Promise.resolve((banco.auth[nome] ?? padrao)(...args))
  }
}

const ok = { data: {}, error: null }

const armazenamento = (balde: string) => ({
  createSignedUrls: (caminhos: string[]) =>
    Promise.resolve({ data: caminhos.map((p) => ({ path: p, signedUrl: `https://arquivos.teste/${balde}/${p}` })), error: null }),
  createSignedUrl: (p: string) => Promise.resolve({ data: { signedUrl: `https://arquivos.teste/${balde}/${p}` }, error: null }),
  upload: (p: string) => {
    banco.chamadas.push({ tipo: 'upload', nome: balde, args: [p] })
    return Promise.resolve({ data: { path: p }, error: erro(`upload:${balde}`) })
  },
  remove: (p: string[]) => {
    banco.chamadas.push({ tipo: 'remove', nome: balde, args: p })
    return Promise.resolve({ data: [], error: null })
  },
  list: () => Promise.resolve({ data: [], error: null }),
  getPublicUrl: (p: string) => ({ data: { publicUrl: `https://arquivos.teste/${balde}/${p}` } }),
})

export const supabase = {
  from: (tabela: string) => consulta(tabela),
  rpc,
  storage: { from: armazenamento },
  auth: {
    getSession: auth('getSession', () => ({ data: { session: banco.sessao }, error: null })),
    getUser: auth('getUser', () => ({ data: { user: banco.sessao?.user ?? null }, error: null })),
    refreshSession: auth('refreshSession', () => ({ data: { session: banco.sessao }, error: null })),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: auth('signInWithPassword', () => ({ data: { user: banco.sessao?.user ?? null, session: banco.sessao }, error: null })),
    signUp: auth('signUp', () => ({ data: { user: null, session: null }, error: null })),
    signOut: auth('signOut', () => ({ error: null })),
    updateUser: auth('updateUser', () => ({ data: { user: banco.sessao?.user ?? null }, error: null })),
    resetPasswordForEmail: auth('resetPasswordForEmail', () => ok),
    mfa: {
      getAuthenticatorAssuranceLevel: auth('getAuthenticatorAssuranceLevel', () => ({ data: banco.nivel, error: null })),
      listFactors: auth('listFactors', () => ({ data: { totp: banco.fatores, all: banco.fatores }, error: null })),
      enroll: auth('enroll', () => ({
        data: { id: 'fator-novo', totp: { qr_code: 'data:image/svg+xml;base64,PHN2Zy8+', secret: 'SEGREDO123', uri: 'otpauth://x' } },
        error: null,
      })),
      challengeAndVerify: auth('challengeAndVerify', () => ({ data: {}, error: null })),
      unenroll: auth('unenroll', () => ok),
    },
  },
}
