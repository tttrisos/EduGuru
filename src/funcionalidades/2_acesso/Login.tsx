// ============================================================
// funcionalidades/2_acesso/Login.tsx
// TELA DE LOGIN E CADASTRO (endereço /login) — RF01, RF02, RF05.
// Login: e-mail e senha → quem ativou a verificação em duas etapas (e todo admin) vai para Mfa.tsx.
// Cadastro: nome, curso, e-mail, senha (regras em regrasSenha.ts), aceite dos termos e CEP opcional.
// API externa: ViaCEP (busca cidade/UF pelo CEP) — documentação em docs/INTEGRACAO_VIACEP.md.
// Sessão: usa entrar/cadastrar de compartilhado/sessao/ContextoSessao.tsx.
// ============================================================

import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useAuth } from '../../compartilhado/sessao/ContextoSessao'
import { CURSOS } from '../../compartilhado/tipos'
import { REGRAS_SENHA, senhaAtendeTodasRegras } from './regrasSenha'
import Rodape from '../../compartilhado/layout/Rodape'
import Captcha, { captchaLigado } from '../../compartilhado/componentes/Captcha'
import './acesso.css'

// A MESMA tela serve para entrar e para criar conta: o estado "modo" troca o formulário.
// Esta tela só faz validações de conforto (campo vazio, senhas diferentes). Quem decide de verdade é o
// Supabase Auth: confere a senha (hash bcrypt), o captcha e se o e-mail já existe.
export default function Login() {
  // entrar() e cadastrar() vêm do contexto de sessão (ContextoSessao.tsx), que conversa com o Supabase.
  const { entrar, cadastrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Quem chega aqui pode trazer um "recado" da tela anterior (location.state):
  //  - rotaOrigem: a tela protegida que o usuário tentou abrir (RotaProtegida manda para cá e,
  //    depois do login, ele volta para ela);
  //  - modo: 'cadastrar' quando o botão "Criar conta" da página inicial foi clicado;
  //  - aviso: mensagem para mostrar (ex.: "sessão encerrada em outro aparelho").
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
  const [avisoCadastro, setAvisoCadastro] = useState(estadoRota?.aviso ?? '')
  // Captcha 'não sou um robô' (Captcha.tsx): cada token vale uma tentativa; depois pede outro.
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

  // INTEGRAÇÃO COM API EXTERNA (ViaCEP, RF05). Roda quando o campo CEP perde o foco.
  // 1) Tira tudo que não é número; 2) confere se tem 8 dígitos; 3) chama a API pública do ViaCEP
  //    direto do navegador; 4) preenche cidade e estado.
  // LGPD (minimização): o CEP NÃO é enviado ao nosso banco — só cidade e estado vão para o cadastro.
  // Se o CEP não existir ou o ViaCEP estiver fora do ar, o cadastro continua (o CEP é opcional).
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
        setErroCep('CEP não encontrado. Você pode deixar em branco e continuar.')
      } else {
        setCidade(dados.localidade)
        setEstado(dados.uf)
      }
    } catch {
      setErroCep('Não foi possível consultar o CEP agora. Pode deixar em branco e continuar.')
    } finally {
      setBuscandoCep(false)
    }
  }

  // Botão "Entrar" ou "Criar conta".
  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault() // impede o navegador de recarregar a página ao enviar o formulário
    setErro('')
    setAvisoCadastro('')

    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }

    // ENTRAR (RF01): manda e-mail, senha e o token do captcha para o Supabase Auth.
    // Se der certo, vai para a tela de origem (ou /painel). Quem precisa de mais uma etapa
    // (código do aplicativo ou código por e-mail) é desviado pela RotaProtegida para /mfa.
    // A mensagem de erro é sempre genérica, para não revelar se o e-mail existe (RF01-CA02).
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

    // CADASTRAR (RF02): as validações abaixo são só de conforto, para avisar antes de enviar.
    // A senha também é conferida pelo Supabase Auth, e o perfil é criado por um gatilho no banco
    // (supabase/04) com papel "aluno" — o usuário nunca escolhe ser administrador.
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

    // cidade/estado vão como null quando o CEP não foi informado (campo opcional, LGPD).
    // O aceite dos termos é gravado com data e versão (RF13) dentro de cadastrar().
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
      // A conta só passa a valer depois que o usuário clica no link enviado ao e-mail (Brevo).
      setAvisoCadastro('Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.')
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
          <input
            className="campo"
            type="password"
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

              <input
                className="campo"
                type="password"
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
            disabled={enviando || (captchaLigado && !captcha)}
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