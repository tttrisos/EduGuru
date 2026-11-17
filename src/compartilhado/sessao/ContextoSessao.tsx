// ============================================================
// compartilhado/sessao/ContextoSessao.tsx
// SESSÃO DO USUÁRIO: guarda quem está logado e deixa isso disponível para todas as telas (useAuth()).
// Supabase Auth: login (signInWithPassword), cadastro (signUp), sair (signOut) e nível da sessão
// (aal1 = só senha; aal2 = senha + código de duas etapas). A regra de quando o código é exigido
// (MFA opcional para aluno, obrigatório para admin) está em nivelSessao.ts.
// Código por e-mail em aparelho novo (quem não usa o aplicativo): o banco responde se esta sessão
// precisa dele (situacao_codigo_email, supabase/25); a tela é 2_acesso/CodigoEmail.tsx.
// Sessão encerrada em outro aparelho ("Sair dos outros aparelhos"): a cada minuto e ao voltar para a
// aba, pergunta ao Supabase Auth se a sessão ainda existe; se não, sai e avisa no login (supabase/26).
// Banco: lê o perfil na tabela perfis (nome, papel aluno/admin, curso, aceite dos termos).
// Usado por: quase todas as telas (ex.: ehAdmin decide o que mostrar).
// ============================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../banco/supabase'
import { VERSAO_TERMOS, type Perfil } from '../tipos'
import { registrarLogEvento, registrarLoginFalhou } from '../banco/log'
import { situacaoDaSessao } from './nivelSessao'
import { descreverAparelho } from '../utilitarios/aparelho'
import { esquecerTokenAparelho, lerTokenAparelho } from '../../funcionalidades/2_acesso/regrasCodigoEmail'

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
  // aparelho novo sem o aplicativo: falta o código enviado por e-mail (tela /mfa mostra CodigoEmail)
  precisaCodigoEmail: boolean
  emailMascarado: string | null
  // mensagem para a tela de login quando a sessão foi encerrada em outro aparelho
  avisoSaida: string | null
  atualizarMfa: () => Promise<void>
  recarregarPerfil: () => Promise<void>
  entrar: (email: string, senha: string, captcha?: string | null) => Promise<{ erro: string | null }>
  cadastrar: (
    nome: string,
    email: string,
    senha: string,
    curso: string,
    cidade: string | null,
    estado: string | null,
    captcha?: string | null,
  ) => Promise<{ erro: string | null }>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthContextValor | null>(null)

type DadosSessao = {
  verificacaoOk: boolean
  temMfa: boolean
  perfil: Perfil | null
  precisaCodigoEmail: boolean
  emailMascarado: string | null
  aparelhoLembrado: boolean
}

const SEM_SESSAO: DadosSessao = {
  verificacaoOk: false,
  temMfa: false,
  perfil: null,
  precisaCodigoEmail: false,
  emailMascarado: null,
  aparelhoLembrado: false,
}

type SituacaoCodigoEmail = {
  precisa_codigo: boolean
  email?: string
  aparelho_lembrado?: boolean
  token_invalido?: boolean
}

// O CORAÇÃO DO LOGIN: descobre em que ponto está a sessão e o que ainda falta. Passo a passo:
//  1) Sem sessão → ninguém logado.
//  2) Pergunta ao Supabase Auth o nível da sessão: aal1 (só senha) ou aal2 (senha + código do
//     aplicativo). Se a conta tem o aplicativo e a sessão ainda é aal1, PARA aqui: o banco não
//     devolveria nada mesmo (RLS), então nem tenta ler o perfil. A RotaProtegida manda para /mfa.
//  3) Conta SEM o aplicativo: pergunta ao banco (situacao_codigo_email) se este aparelho é novo.
//     Aparelho novo → falta o código enviado por e-mail (tela CodigoEmail.tsx).
//  4) Tudo certo → lê o perfil (nome, papel, curso, aceite) e confere de novo com o papel em mãos,
//     porque administrador SEMPRE precisa do aplicativo, mesmo que ainda não tenha cadastrado.
async function lerDadosSessao(session: Session | null): Promise<DadosSessao> {
  if (!session?.user) return SEM_SESSAO

  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const antes = situacaoDaSessao(nivel?.currentLevel, nivel?.nextLevel, null)
  if (!antes.liberada) return { ...SEM_SESSAO, temMfa: antes.temMfa }

  // Sem o aplicativo: pergunta ao banco se este aparelho precisa do código do e-mail.
  // Se o script 25 ainda não foi rodado (erro), segue como antes.
  let aparelhoLembrado = false
  if (!antes.temMfa) {
    const { data: sit, error } = await supabase.rpc('situacao_codigo_email', {
      p_token: lerTokenAparelho(session.user.id),
    })
    const situacao = sit as SituacaoCodigoEmail | null
    if (!error && situacao) {
      if (situacao.token_invalido) esquecerTokenAparelho(session.user.id)
      if (situacao.precisa_codigo) {
        return { ...SEM_SESSAO, precisaCodigoEmail: true, emailMascarado: situacao.email ?? null }
      }
      aparelhoLembrado = !!situacao.aparelho_lembrado
    }
  }

  const { data } = await supabase.from('perfis').select('*').eq('id', session.user.id).single()
  const perfil = (data as Perfil) ?? null
  // Com o papel em mãos: administrador sem o código não é liberado (precisa cadastrar o MFA).
  const depois = situacaoDaSessao(nivel?.currentLevel, nivel?.nextLevel, perfil?.papel ?? null)
  return { ...SEM_SESSAO, verificacaoOk: depois.liberada, temMfa: depois.temMfa, perfil, aparelhoLembrado }
}

// Guarda quem está logado e o papel (aluno/admin). As páginas usam useAuth().
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [verificacaoOk, setVerificacaoOk] = useState(false)
  const [temMfa, setTemMfa] = useState(false)
  const [precisaCodigoEmail, setPrecisaCodigoEmail] = useState(false)
  const [emailMascarado, setEmailMascarado] = useState<string | null>(null)
  const [avisoSaida, setAvisoSaida] = useState<string | null>(null)

  function aplicar(dados: DadosSessao) {
    setVerificacaoOk(dados.verificacaoOk)
    setTemMfa(dados.temMfa)
    setPrecisaCodigoEmail(dados.precisaCodigoEmail)
    setEmailMascarado(dados.emailMascarado)
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

  // Ao abrir o site: lê a sessão guardada no navegador (o usuário pode já estar logado de antes).
  // Depois, fica "ouvindo" o Supabase Auth: qualquer login, logout ou renovação do token dispara
  // onAuthStateChange, e a situação da sessão é lida de novo.
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

  // Esta sessão foi encerrada em outro aparelho? O banco já recusa os dados (supabase/26);
  // aqui o site percebe e volta para o login, em até 1 minuto ou ao voltar para a aba.
  useEffect(() => {
    if (!usuario) return
    async function conferirSessao() {
      const { error } = await supabase.auth.getUser()
      if (error?.code === 'session_not_found') {
        setAvisoSaida('Esta sessão foi encerrada em outro aparelho. Entre de novo.')
        await supabase.auth.signOut({ scope: 'local' })
      }
    }
    function aoVoltarParaAba() {
      if (document.visibilityState === 'visible') conferirSessao()
    }
    const intervalo = setInterval(conferirSessao, 60_000)
    document.addEventListener('visibilitychange', aoVoltarParaAba)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoVoltarParaAba)
    }
  }, [usuario])

  // Confere a senha. Quem não tem MFA já entra aqui (ou, em aparelho novo, vai para o código do e-mail);
  // quem tem o aplicativo (e o admin) termina na tela /mfa.
  // captcha = token do "não sou um robô" (Captcha.tsx); o Supabase confere quando a proteção está ligada.
  async function entrar(email: string, senha: string, captcha?: string | null) {
    setAvisoSaida(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
      options: captcha ? { captchaToken: captcha } : undefined,
    })
    if (error?.code === 'captcha_failed') {
      return { erro: 'Confirme a verificação "não sou um robô" e tente de novo.' }
    }
    if (error || !data.user) {
      // Grava a falha no log (só se o e-mail existir; o banco não conta para a tela se existe).
      // A mensagem é a mesma para e-mail inexistente e senha errada, para não revelar quem tem conta.
      await registrarLoginFalhou(email)
      return { erro: 'E-mail ou senha inválidos.' }
    }
    // Lê a situação ANTES de voltar, para a próxima tela já saber se precisa do código.
    setUsuario(data.user)
    const dados = await carregarDadosSessao(data.session)
    // O login só vai para o log quando a sessão já está liberada. Quem ainda precisa do código
    // (aplicativo ou e-mail) tem o login registrado depois, na tela que confere o código.
    if (dados.verificacaoOk) {
      await registrarLogEvento('login', {
        mfa: dados.aparelhoLembrado ? 'aparelho' : 'nao',
        aparelho: descreverAparelho(navigator.userAgent),
      })
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
    captcha?: string | null,
  ) {
    // CADASTRO (RF02): o Supabase Auth cria a conta e guarda a senha só como hash (bcrypt).
    // Os dados extras vão em "options.data"; um gatilho do banco (supabase/04) lê esses dados e cria
    // a linha em perfis com papel "aluno", registrando o aceite com a versão dos termos (RF13).
    // O CEP não está aqui de propósito: só cidade e estado (LGPD, minimização).
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        captchaToken: captcha ?? undefined,
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
    if (error?.code === 'captcha_failed') return { erro: 'Confirme a verificação "não sou um robô" e tente de novo.' }
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
    precisaCodigoEmail,
    emailMascarado,
    avisoSaida,
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