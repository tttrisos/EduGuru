import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useAuth } from '../../compartilhado/sessao/ContextoSessao'
import { CURSOS } from '../../compartilhado/tipos'
import { REGRAS_SENHA, senhaAtendeTodasRegras } from './regrasSenha'
import Rodape from '../../compartilhado/layout/Rodape'
import Captcha, { captchaLigado } from '../../compartilhado/componentes/Captcha'
import CampoSenha from '../../compartilhado/componentes/CampoSenha'
import './acesso.css'

// As validações desta tela são só de conforto; quem decide é o Supabase Auth.
export default function Login() {
  const { entrar, cadastrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const estadoRota = location.state as { rotaOrigem?: string; modo?: 'cadastrar'; aviso?: string } | null
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>(estadoRota?.modo ?? 'entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [curso, setCurso] = useState('')
  const [cep, setCep] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erroCep, setErroCep] = useState('')
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  // Veio do link "Confirmar e-mail" (principal.tsx) sem estar logado: avisa que já pode entrar.
  const veioDaConfirmacao = new URLSearchParams(window.location.search).has('cadastro-confirmado')
  const [avisoCadastro, setAvisoCadastro] = useState(
    estadoRota?.aviso ?? (veioDaConfirmacao ? 'E-mail confirmado! Agora entre com seu e-mail e senha.' : ''),
  )
  const [captcha, setCaptcha] = useState<string | null>(null)
  const [reiniciarCaptcha, setReiniciarCaptcha] = useState(0)

  const destino = estadoRota?.rotaOrigem ?? '/painel'

  function limparCamposCadastro() {
    setConfirmarSenha('')
    setCurso('')
    setCep('')
    setCidade('')
    setEstado('')
    setErroCep('')
    setAceitouTermos(false)
  }

  function trocarModo(novoModo: 'entrar' | 'cadastrar') {
    setModo(novoModo)
    setErro('')
    setAvisoCadastro('')
    limparCamposCadastro()
  }

  // ViaCEP (RF05): o CEP não é enviado ao banco, só a cidade e o estado (minimização, LGPD).
  // Se a consulta falhar, o cadastro continua: o CEP é opcional.
  async function aoSairDoCep() {
    const cepLimpo = cep.replace(/\D/g, '')
    setErroCep('')
    setCidade('')
    setEstado('')

    if (!cepLimpo) return

    if (cepLimpo.length !== 8) {
      setErroCep('CEP inválido — precisa ter 8 números.')
      return
    }

    setBuscandoCep(true)
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const dados = await resposta.json()

      if (dados.erro) {
        setErroCep('CEP não encontrado. Pode deixar em branco e continuar (cidade e estado podem ser informados depois, em Minha conta).')
      } else {
        setCidade(dados.localidade)
        setEstado(dados.uf)
      }
    } catch {
      setErroCep('Não foi possível consultar o CEP agora. Pode deixar em branco e continuar (cidade e estado podem ser informados depois, em Minha conta).')
    } finally {
      setBuscandoCep(false)
    }
  }

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAvisoCadastro('')

    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }

    // Mensagem de erro genérica, para não revelar se o e-mail existe (RF01-CA02).
    if (modo === 'entrar') {
      setEnviando(true)
      const { erro } = await entrar(email.trim(), senha, captcha)
      setEnviando(false)
      // Cada token do captcha vale para UMA tentativa: depois de usar, pede um novo.
      setReiniciarCaptcha((n) => n + 1)
      if (erro) setErro(erro)
      else navigate(destino, { replace: true })
      return
    }

    // O perfil é criado no banco sempre com o papel "aluno".
    if (!nome.trim()) {
      setErro('Digite seu nome.')
      return
    }
    if (!curso) {
      setErro('Escolha o curso que você está fazendo.')
      return
    }
    if (!senhaAtendeTodasRegras(senha)) {
      setErro('A senha ainda não atende a todos os requisitos listados abaixo.')
      return
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas digitadas não são iguais.')
      return
    }
    if (!aceitouTermos) {
      setErro('Você precisa aceitar o Termo de Aceite e a Política de Privacidade para continuar.')
      return
    }
    // A consulta ao ViaCEP começa quando o campo CEP perde o foco, e clicar em "Criar conta" já tira o
    // foco. Sem esta espera, o cadastro seguia antes da resposta e a cidade/estado se perdiam.
    if (buscandoCep) {
      setErro('Aguarde a consulta do CEP terminar e clique de novo em "Criar conta".')
      return
    }

    setEnviando(true)
    const { erro } = await cadastrar(
      nome.trim(),
      email.trim(),
      senha,
      curso,
      cidade || null,
      estado || null,
      captcha,
    )
    setEnviando(false)
    setReiniciarCaptcha((n) => n + 1)
    if (erro) {
      setErro(erro)
    } else {
      setAvisoCadastro(
        'Conta criada! Abra o link que enviamos para o seu e-mail para confirmar o cadastro e depois faça login. ' +
          'Se o link não for aberto em 24 horas (por exemplo, com o e-mail digitado errado), o cadastro é apagado e você pode criar a conta de novo.',
      )
      setSenha('')
      limparCamposCadastro()
      setModo('entrar')
    }
  }

  return (
    <div className="login-split">
      <div className="login-painel-form">
        <Link to="/" className="termos-voltar">
          ← Voltar ao início
        </Link>

        <div className="login-marca">
          <GraduationCap size={32} color="#8257e5" />
          <div>
            <h1>EduGuru</h1>
            <small>PFC · UMC 2026</small>
          </div>
        </div>

        <div>
          <h2 className="login-titulo">{modo === 'entrar' ? 'Entrar na conta' : 'Criar sua conta'}</h2>
          <p className="login-subtitulo">
            {modo === 'entrar'
              ? 'Entre na sua conta e continue estudando.'
              : 'Leva menos de um minuto. Depois, se quiser, ative a verificação em duas etapas em Minha conta.'}
          </p>
        </div>

        <div className="login-abas">
          <button
            type="button"
            className={`login-aba${modo === 'entrar' ? ' ativa' : ''}`}
            onClick={() => trocarModo('entrar')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`login-aba${modo === 'cadastrar' ? ' ativa' : ''}`}
            onClick={() => trocarModo('cadastrar')}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={aoEnviar} className="login-form">
          {modo === 'cadastrar' ? (
            <>
              <input
                className="campo"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
              />

              <select
                className="campo"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
              >
                <option value="" disabled>
                  Selecione seu curso...
                </option>
                {CURSOS.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.label}
                  </option>
                ))}
              </select>

              <input
                className="campo"
                placeholder="CEP (opcional)"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={aoSairDoCep}
                inputMode="numeric"
                maxLength={9}
              />
              {buscandoCep ? <p className="cep-status">Consultando CEP...</p> : null}
              {!buscandoCep && cidade && estado ? (
                <p className="cep-status cep-ok">📍 {cidade} - {estado}</p>
              ) : null}
              {erroCep ? <p className="cep-status cep-erro">{erroCep}</p> : null}
            </>
          ) : null}

          <input
            className="campo"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <CampoSenha
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
          />

          {modo === 'cadastrar' ? (
            <>
              <ul className="lista-regras-senha">
                {REGRAS_SENHA.map((regra) => {
                  const ok = regra.testar(senha)
                  return (
                    <li key={regra.chave} className={ok ? 'regra-ok' : 'regra-falha'}>
                      <span aria-hidden="true">{ok ? '✅' : '❌'}</span>
                      {regra.descricao}
                    </li>
                  )
                })}
              </ul>

              <CampoSenha
                placeholder="Confirmar senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                autoComplete="new-password"
              />
              {confirmarSenha && confirmarSenha !== senha ? (
                <p className="aviso erro campo-aviso">As senhas não coincidem.</p>
              ) : null}

              <label className="checkbox-linha">
                <input
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={(e) => setAceitouTermos(e.target.checked)}
                />
                <span>
                  Li e aceito o{' '}
                  <Link to="/termos" target="_blank" rel="noreferrer">
                    Termo de Aceite
                  </Link>{' '}
                  e a{' '}
                  <Link to="/privacidade" target="_blank" rel="noreferrer">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>
            </>
          ) : null}

          <Captcha aoMudar={setCaptcha} reiniciar={reiniciarCaptcha} />

          {erro ? <p className="aviso erro">{erro}</p> : null}
          {avisoCadastro ? <p className="aviso sucesso">{avisoCadastro}</p> : null}

          <button
            type="submit"
            className="btn btn-primario login-botao"
            disabled={enviando || buscandoCep || (captchaLigado && !captcha)}
          >
            {enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {modo === 'entrar' ? (
          <Link to="/esqueci-senha" className="login-esqueci">
            Esqueci minha senha
          </Link>
        ) : null}

        <p className="login-rodape">
          A senha nunca é guardada como texto puro — o Supabase Auth já cuida do hash
          (criptografia) automaticamente antes de salvar no banco.
        </p>

        <Rodape />
      </div>

      <div className="login-painel-arte" aria-hidden="true">
        <div className="login-arte-caixa">
          <GraduationCap size={56} color="#fff" />
          <strong>EduGuru</strong>
          <p>Estude, responda e acompanhe sua evolução.</p>
        </div>
      </div>
    </div>
  )
}