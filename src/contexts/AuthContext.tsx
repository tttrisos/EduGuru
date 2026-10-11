import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import { VERSAO_TERMOS, type Perfil } from '../types'
import { registrarLogEvento, registrarLoginFalhou } from '../lib/log'

type AuthContextValor = {
  usuario: User | null
  perfil: Perfil | null
  carregando: boolean
  ehAdmin: boolean
  // true só quando a sessão passou pelo 2º fator (nível "aal2").
  mfaConcluido: boolean
  atualizarMfa: () => Promise<void>
  // Relê o perfil do banco (ex.: depois de o titular corrigir os dados).
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

// Descobre se a sessão já passou pelo MFA. Antes disso o banco não
// devolve nem o próprio perfil (regra "mfa_obrigatorio" no RLS), então
// o perfil só é buscado depois do aal2.
async function lerDadosSessao(
  session: Session | null,
): Promise<{ mfaConcluido: boolean; perfil: Perfil | null }> {
  if (!session?.user) return { mfaConcluido: false, perfil: null }

  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (nivel?.currentLevel !== 'aal2') return { mfaConcluido: false, perfil: null }

  const { data } = await supabase.from('perfis').select('*').eq('id', session.user.id).single()
  return { mfaConcluido: true, perfil: (data as Perfil) ?? null }
}

// Guarda, em um lugar só, quem está logado e qual o papel dele.
// Qualquer página consulta isso via useAuth() em vez de checar sozinha.
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
    // Verifica se já existe sessão salva (o Supabase cuida disso sozinho).
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      const dados = await lerDadosSessao(session)
      setUsuario(session?.user ?? null)
      setMfaConcluido(dados.mfaConcluido)
      setPerfil(dados.perfil)
      setCarregando(false)
    })

    // Escuta login/logout/expiração de token/MFA verificado e atualiza o
    // estado. O setTimeout evita chamar o Supabase de dentro do próprio
    // callback de auth (a biblioteca pode travar esperando a si mesma).
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

  // Só confere a senha. O login só é registrado como concluído depois do
  // código do autenticador (tela /mfa).
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
    // O cadastro só é enviado depois que o checkbox do Termo/Política foi
    // marcado; o banco grava o aceite (data e versão) no perfil e o log de
    // cadastro é feito pelo trigger da tabela perfis.
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

// Hook e Provider no mesmo arquivo é o padrão de Context do React; a regra
// abaixo só afeta o hot-reload do Vite em desenvolvimento, não o build.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>')
  return contexto
}