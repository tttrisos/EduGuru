// ============================================================
// compartilhado/sessao/ContextoSessao.tsx
// SESSÃO DO USUÁRIO: guarda quem está logado e deixa isso disponível para todas as telas (useAuth()).
// Supabase Auth: login (signInWithPassword), cadastro (signUp), sair (signOut) e nível da sessão
// (aal1 = só senha; aal2 = senha + código de duas etapas). A regra de quando o código é exigido
// (MFA opcional para aluno, obrigatório para admin) está em nivelSessao.ts.
// Banco: lê o perfil na tabela perfis (nome, papel aluno/admin, curso, aceite dos termos).
// Usado por: quase todas as telas (ex.: ehAdmin decide o que mostrar).
// ============================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../banco/supabase'
import { VERSAO_TERMOS, type Perfil } from '../tipos'
import { registrarLogEvento, registrarLoginFalhou } from '../banco/log'
import { situacaoDaSessao } from './nivelSessao'

type AuthContextValor = {
  usuario: User | null
  perfil: Perfil | null
  carregando: boolean
  ehAdmin: boolean
  // true quando a sessão cumpre a verificação que a conta exige (nivelSessao.ts):
  // aluno sem MFA = só a senha; quem ativou o MFA (e todo admin) = senha + código.
  verificacaoOk: boolean
  // a conta tem o MFA (aplicativo autenticador) ativo?
  temMfa: boolean
  atualizarMfa: () => Promise<void>
  recarregarPerfil: () => Promise<void>
  entrar: (email: string, senha: string) => Promise<{ erro: string | null }>
  cadastrar: (
    nome: string,
    email: string,
    senha: string,
    curso: string,
    cidade: string | null,
    estado: string | null,
  ) => Promise<{ erro: string | null }>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthContextValor | null>(null)

type DadosSessao = { verificacaoOk: boolean; temMfa: boolean; perfil: Perfil | null }

// Quem ativou o MFA e ainda não digitou o código: o banco não devolve nada, então nem lê o perfil.
async function lerDadosSessao(session: Session | null): Promise<DadosSessao> {
  if (!session?.user) return { verificacaoOk: false, temMfa: false, perfil: null }

  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const antes = situacaoDaSessao(nivel?.currentLevel, nivel?.nextLevel, null)
  if (!antes.liberada) return { verificacaoOk: false, temMfa: antes.temMfa, perfil: null }

  const { data } = await supabase.from('perfis').select('*').eq('id', session.user.id).single()
  const perfil = (data as Perfil) ?? null
  // Com o papel em mãos: administrador sem o código não é liberado (precisa cadastrar o MFA).
  const depois = situacaoDaSessao(nivel?.currentLevel, nivel?.nextLevel, perfil?.papel ?? null)
  return { verificacaoOk: depois.liberada, temMfa: depois.temMfa, perfil }
}

// Guarda quem está logado e o papel (aluno/admin). As páginas usam useAuth().
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [verificacaoOk, setVerificacaoOk] = useState(false)
  const [temMfa, setTemMfa] = useState(false)

  function aplicar(dados: DadosSessao) {
    setVerificacaoOk(dados.verificacaoOk)
    setTemMfa(dados.temMfa)
    setPerfil(dados.perfil)
  }

  async function carregarDadosSessao(session: Session | null) {
    const dados = await lerDadosSessao(session)
    aplicar(dados)
    return dados
  }

  async function atualizarMfa() {
    const { data } = await supabase.auth.getSession()
    await carregarDadosSessao(data.session)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      const dados = await lerDadosSessao(session)
      setUsuario(session?.user ?? null)
      aplicar(dados)
      setCarregando(false)
    })

    // O setTimeout evita chamar o Supabase dentro do próprio evento de login.
    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento: string, session: Session | null) => {
      setUsuario(session?.user ?? null)
      setTimeout(async () => {
        aplicar(await lerDadosSessao(session))
      }, 0)
    })

    return () => assinatura.subscription.unsubscribe()
  }, [])

  // Confere a senha. Quem não tem MFA já entra aqui; quem tem (e o admin) termina na tela /mfa.
  async function entrar(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error || !data.user) {
      await registrarLoginFalhou(email)
      return { erro: 'E-mail ou senha inválidos.' }
    }
    // Lê a situação ANTES de voltar, para a próxima tela já saber se precisa do código.
    setUsuario(data.user)
    const dados = await carregarDadosSessao(data.session)
    if (dados.verificacaoOk) await registrarLogEvento('login', { mfa: 'nao' })
    return { erro: null }
  }

  async function cadastrar(
    nome: string,
    email: string,
    senha: string,
    curso: string,
    cidade: string | null,
    estado: string | null,
  ) {
    // O banco grava o perfil e o aceite dos termos a partir destes dados.
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
          curso,
          cidade,
          estado,
          consentimento_aceito: true,
          versao_termos: VERSAO_TERMOS,
        },
      },
    })
    if (error) return { erro: error.message }
    return { erro: null }
  }

  async function sair() {
    await registrarLogEvento('logout')
    await supabase.auth.signOut()
  }

  const valor: AuthContextValor = {
    usuario,
    perfil,
    carregando,
    ehAdmin: perfil?.papel === 'admin',
    verificacaoOk,
    temMfa,
    atualizarMfa,
    recarregarPerfil: atualizarMfa,
    entrar,
    cadastrar,
    sair,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>')
  return contexto
}