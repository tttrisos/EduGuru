import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { CURSOS } from '../types'
import { REGRAS_SENHA, senhaAtendeTodasRegras } from '../lib/senha'
import Rodape from '../components/Rodape'

export default function Login() {
  const { entrar, cadastrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar')
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
  const [avisoCadastro, setAvisoCadastro] = useState('')

  const destino = (location.state as { rotaOrigem?: string } | null)?.rotaOrigem ?? '/'

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

  // Busca cidade/estado ao sair do campo de CEP. Campo opcional: se
  // ficar vazio, não faz nada.
  async function aoSairDoCep() {
    const cepLimpo = cep.replace(/\D/g, '') // tira tudo que não é número
    setErroCep('')
    setCidade('')
    setEstado('')

    if (!cepLimpo) return // campo vazio, tudo bem — é opcional

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

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAvisoCadastro('')

    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }

    if (modo === 'entrar') {
      setEnviando(true)
      const { erro } = await entrar(email.trim(), senha)
      setEnviando(false)
      if (erro) setErro(erro)
      else navigate(destino, { replace: true })
      return
    }

    // ---- validações extras, só no modo "cadastrar" ----
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

    setEnviando(true)
    const { erro } = await cadastrar(
      nome.trim(),
      email.trim(),
      senha,
      curso,
      cidade || null,
      estado || null,
    )
    setEnviando(false)
    if (erro) {
      setErro(erro)
    } else {
      setAvisoCadastro('Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.')
      setSenha('')
      limparCamposCadastro()
      setModo('entrar')
    }
  }

  return (
    <div className="login-tela">
      <div className="login-cartao cartao">
        <div className="login-marca">
          <GraduationCap size={32} color="#8257e5" />
          <div>
            <h1>EduGuru</h1>
            <small>PFC · UMC 2026</small>
          </div>
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

          {erro ? <p className="aviso erro">{erro}</p> : null}
          {avisoCadastro ? <p className="aviso sucesso">{avisoCadastro}</p> : null}

          <button type="submit" className="btn btn-primario login-botao" disabled={enviando}>
            {enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className="login-rodape">
          A senha nunca é guardada como texto puro — o Supabase Auth já cuida do hash
          (criptografia) automaticamente antes de salvar no banco.
        </p>
      </div>

      <Rodape />
    </div>
  )
}