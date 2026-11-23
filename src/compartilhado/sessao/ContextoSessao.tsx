import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../banco/supabase'
import { VERSAO_TERMOS, type Perfil } from '../tipos'
import { registrarLogEvento, registrarLoginFalhou } from '../banco/log'
import { situacaoDaSessao } from './nivelSessao'
import { descreverAparelho } from '../utilitarios/aparelho'
import { esquecerTokenAparelho, lerTokenAparelho } from '../../funcionalidades/2_acesso/regrasCodigoEmail'
import {
  AVISO_SESSAO_EXPIRADA,
  INTERVALO_CONFERENCIA_MS,
  lerUltimaAtividade,
  limparAtividade,
  marcarAtividade,
  precisaGravar,
  sessaoExpirou,
} from './inatividade'

type AuthContextValor = {
  usuario: User | null
  perfil: Perfil | null
  carregando: boolean
  ehAdmin: boolean
  // true quando a sessão cumpre a verificação que a conta exige (nivelSessao.ts):
  // aluno sem MFA = só a senha; quem ativou o MFA (e todo admin) = senha + código.
  verificacaoOk: boolean
  temMfa: boolean
  // aparelho novo sem o aplicativo: falta o código enviado por e-mail (tela /mfa mostra CodigoEmail)
  precisaCodigoEmail: boolean
  emailMascarado: string | null
  // mensagem para a tela de login quando a sessão foi encerrada em outro aparelho ou expirou
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

// Link do e-mail (confirmação de cadastro ou nova senha, fluxo PKCE): o endereço chega com ?code=.
// Lido assim que o site carrega, antes de o Supabase trocar o código pela sessão e limpar o endereço.
const VEIO_DE_LINK_DO_EMAIL = new URLSearchParams(window.location.search).has('code')

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

// Descobre o que ainda falta para liberar a sessão: código do aplicativo (aal2), código do e-mail
// em aparelho novo ou nada. Administrador sempre precisa do aplicativo, por isso a situação
// é conferida de novo depois de ler o papel no perfil.
async function lerDadosSessao(session: Session | null): Promise<DadosSessao> {
  if (!session?.user) return SEM_SESSAO

  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const antes = situacaoDaSessao(nivel?.currentLevel, nivel?.nextLevel, null)
  if (!antes.liberada) return { ...SEM_SESSAO, temMfa: antes.temMfa }

  // Sem o aplicativo, o banco diz se este aparelho precisa do código do e-mail.
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
  const depois = situacaoDaSessao(nivel?.currentLevel, nivel?.nextLevel, perfil?.papel ?? null)
  return { ...SEM_SESSAO, verificacaoOk: depois.liberada, temMfa: depois.temMfa, perfil, aparelhoLembrado }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [verificacaoOk, setVerificacaoOk] = useState(false)
  const [temMfa, setTemMfa] = useState(false)
  const [precisaCodigoEmail, setPrecisaCodigoEmail] = useState(false)
  const [emailMascarado, setEmailMascarado] = useState<string | null>(null)
  const [avisoSaida, setAvisoSaida] = useState<string | null>(null)
  const expirando = useRef(false) // evita encerrar duas vezes (intervalo e volta para a aba juntos)

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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      // Chegou por um link do e-mail: é um acesso novo, então o relógio de inatividade começa agora.
      if (session && VEIO_DE_LINK_DO_EMAIL) marcarAtividade()
      if (!session) limparAtividade()
      // Sessão guardada, mas o site ficou mais de 30 minutos sem uso (ex.: fechou o navegador e
      // voltou no outro dia): encerra antes de mostrar qualquer tela logada.
      if (session && sessaoExpirou(lerUltimaAtividade(), Date.now())) {
        await expirarSessao()
        setCarregando(false)
        return
      }
      if (session && lerUltimaAtividade() === null) marcarAtividade()
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

  // SESSÃO EXPIRADA (30 min sem uso): grava o log como logout por inatividade, encerra só a
  // sessão deste navegador (os outros aparelhos continuam) e deixa o aviso para a tela de login.
  async function expirarSessao() {
    if (expirando.current) return
    expirando.current = true
    setAvisoSaida(AVISO_SESSAO_EXPIRADA)
    await registrarLogEvento('logout', { motivo: 'sessao_expirada' })
    limparAtividade()
    await supabase.auth.signOut({ scope: 'local' })
    expirando.current = false
  }

  // Conta o tempo sem uso enquanto alguém está logado. Clique, tecla, toque, rolagem ou mouse
  // contam como uso (gravado no máximo a cada 15 s). A cada 30 s, e ao voltar para a aba, confere
  // se passou de 30 minutos. O horário fica no navegador, então vale para todas as abas abertas.
  useEffect(() => {
    if (!usuario) return
    let ultimaGravacao = 0
    function aoUsar() {
      const agora = Date.now()
      // Voltou a mexer depois de 30 min parado: não renova, encerra (o tempo já tinha passado).
      if (sessaoExpirou(lerUltimaAtividade(), agora)) return void expirarSessao()
      if (precisaGravar(ultimaGravacao, agora)) {
        ultimaGravacao = agora
        marcarAtividade(agora)
      }
    }
    function conferirExpiracao() {
      if (sessaoExpirou(lerUltimaAtividade(), Date.now())) expirarSessao()
    }
    function aoVoltarParaAba() {
      if (document.visibilityState === 'visible') conferirExpiracao()
    }
    const eventos = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const
    eventos.forEach((e) => window.addEventListener(e, aoUsar, { passive: true }))
    document.addEventListener('visibilitychange', aoVoltarParaAba)
    const intervalo = setInterval(conferirExpiracao, INTERVALO_CONFERENCIA_MS)
    return () => {
      eventos.forEach((e) => window.removeEventListener(e, aoUsar))
      document.removeEventListener('visibilitychange', aoVoltarParaAba)
      clearInterval(intervalo)
    }
  }, [usuario])

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

  async function entrar(email: string, senha: string, captcha?: string | null) {
    setAvisoSaida(null)
    expirando.current = false
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
      options: captcha ? { captchaToken: captcha } : undefined,
    })
    if (error?.code === 'captcha_failed') {
      return { erro: 'Confirme a verificação "não sou um robô" e tente de novo.' }
    }
    // Conta criada, mas o link de confirmação do e-mail ainda não foi aberto. O Supabase só devolve
    // este código quando a senha está CERTA, então avisar não ajuda quem está chutando senhas.
    // Não é uma falha de senha, por isso não vai para o log como "login_falhou".
    if (error?.code === 'email_not_confirmed') {
      return {
        erro:
          'Seu e-mail ainda não foi confirmado. Abra o link que enviamos quando você criou a conta ' +
          '(confira também o spam) e depois entre de novo.',
      }
    }
    if (error || !data.user) {
      // Grava a falha no log (só se o e-mail existir; o banco não conta para a tela se existe).
      // A mensagem é a mesma para e-mail inexistente e senha errada, para não revelar quem tem conta.
      await registrarLoginFalhou(email)
      return { erro: 'E-mail ou senha inválidos.' }
    }
    // Lê a situação ANTES de voltar, para a próxima tela já saber se precisa do código.
    setUsuario(data.user)
    marcarAtividade()
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
    // O perfil é criado por um gatilho do banco (supabase/04) a partir de options.data.
    // O CEP não é enviado: só cidade e estado (minimização, LGPD).
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        captchaToken: captcha ?? undefined,
        // Para onde o link "Confirmar e-mail" volta. Sem isto, o Supabase usa a "Site URL" do projeto
        // (https://tttrisos.github.io, sem /EduGuru/), e o GitHub Pages mostrava erro 404.
        // O "?cadastro-confirmado=1" avisa o site (principal.tsx) para mostrar a mensagem certa.
        emailRedirectTo: `${window.location.origin}${window.location.pathname}?cadastro-confirmado=1`,
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

  // Sem o scope, o Supabase usa 'global' e encerraria a sessão em todos os aparelhos.
  async function sair() {
    await registrarLogEvento('logout')
    await supabase.auth.signOut({ scope: 'local' })
    limparAtividade()
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