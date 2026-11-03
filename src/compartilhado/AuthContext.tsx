import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { VERSAO_TERMOS, type Perfil } from './tipos'
import { registrarLogEvento, registrarLoginFalhou } from './log'

type AuthContextValor = {
  usuario: User | null
  perfil: Perfil | null
  carregando: boolean
  ehAdmin: boolean
  // true só quando a sessão passou pelo 2º fator (nível "aal2").
  mfaConcluido: boolean
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

// O perfil só é lido depois do MFA (antes disso o banco não devolve nada).
async function lerDadosSessao(
  session: Session | null,
): Promise<{ mfaConcluido: boolean; perfil: Perfil | null }> {
  if (!session?.user) return { mfaConcluido: false, perfil: null }

  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (nivel?.currentLevel !== 'aal2') return { mfaConcluido: false, perfil: null }

  const { data } = await supabase.from('perfis').select('*').eq('id', session.user.id).single()
  return { mfaConcluido: true, perfil: (data as Perfil) ?? null }
}

// Guarda quem está logado e o papel (aluno/admin). As páginas usam useAuth().
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [mfaConcluido, setMfaConcluido] = useState(false)

  async function carregarDadosSessao(session: Session | null) {
    const dados = await lerDadosSessao(session)
    setMfaConcluido(dados.mfaConcluido)
    setPerfil(dados.perfil)
  }

  async function atualizarMfa() {
    const { data } = await supabase.auth.getSession()
    await carregarDadosSessao(data.session)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      const dados = await lerDadosSessao(session)
      setUsuario(session?.user ?? null)
      setMfaConcluido(dados.mfaConcluido)
      setPerfil(dados.perfil)
      setCarregando(false)
    })

    // O setTimeout evita chamar o Supabase dentro do próprio evento de login.
    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento: string, session: Session | null) => {
      setUsuario(session?.user ?? null)
      setTimeout(async () => {
        const dados = await lerDadosSessao(session)
        setMfaConcluido(dados.mfaConcluido)
        setPerfil(dados.perfil)
      }, 0)
    })

    return () => assinatura.subscription.unsubscribe()
  }, [])

  // Só confere a senha; o login termina na tela /mfa.
  async function entrar(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error || !data.user) {
      await registrarLoginFalhou(email)
      return { erro: 'E-mail ou senha inválidos.' }
    }
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
    mfaConcluido,
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