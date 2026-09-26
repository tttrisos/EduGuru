import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import type { Perfil } from '../types'
import { registrarLogEvento } from '../lib/log'

type AuthContextValor = {
  usuario: User | null
  perfil: Perfil | null
  carregando: boolean
  ehAdmin: boolean
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

// Guarda, em um lugar só, quem está logado e qual o papel dele.
// Qualquer página consulta isso via useAuth() em vez de checar sozinha.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)

  async function buscarPerfil(userId: string) {
    const { data } = await supabase.from('perfis').select('*').eq('id', userId).single()
    setPerfil((data as Perfil) ?? null)
  }

  useEffect(() => {
    // Verifica se já existe sessão salva (o Supabase cuida disso sozinho).
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUsuario(session?.user ?? null)
      if (session?.user) buscarPerfil(session.user.id)
      setCarregando(false)
    })

    // Escuta login/logout/expiração de token e atualiza o estado.
    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento: string, session: Session | null) => {
      setUsuario(session?.user ?? null)
      if (session?.user) buscarPerfil(session.user.id)
      else setPerfil(null)
    })

    return () => assinatura.subscription.unsubscribe()
  }, [])

  async function entrar(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      await registrarLogEvento('login_falhou', null, email, { motivo: error.message })
      return { erro: 'E-mail ou senha inválidos.' }
    }
    await registrarLogEvento('login', data.user?.id ?? null, data.user?.email ?? email)
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, curso, cidade, estado } },
    })
    if (error) return { erro: error.message }
    await registrarLogEvento('login', data.user?.id ?? null, data.user?.email ?? email, {
      evento: 'cadastro_de_conta',
    })
    return { erro: null }
  }

  async function sair() {
    await registrarLogEvento('logout', usuario?.id ?? null, usuario?.email ?? null)
    await supabase.auth.signOut()
  }

  const valor: AuthContextValor = {
    usuario,
    perfil,
    carregando,
    ehAdmin: perfil?.papel === 'admin',
    entrar,
    cadastrar,
    sair,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>')
  return contexto
}