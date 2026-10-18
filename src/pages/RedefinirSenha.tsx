import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { registrarLogEvento } from '../lib/log'
import { REGRAS_SENHA, senhaAtendeTodasRegras } from '../lib/senha'
import Rodape from '../components/Rodape'

// Tela aberta pelo link do e-mail de "esqueci minha senha". O link cria uma
// sessão temporária. Se a conta tem verificação em duas etapas, o código do
// autenticador é pedido ANTES da nova senha — só o acesso ao e-mail não basta.
// Depois de trocar, todas as sessões da conta são encerradas.

type Etapa = 'mfa' | 'senha'

async function descobrirEtapa(): Promise<{ etapa: Etapa; fatorId: string | null }> {
  const [{ data: fatores }, { data: nivel }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ])
  const fator = fatores?.totp[0] ?? null
  if (fator && nivel?.currentLevel !== 'aal2') return { etapa: 'mfa', fatorId: fator.id }
  return { etapa: 'senha', fatorId: null }
}

export default function RedefinirSenha() {
  const { usuario, carregando } = useAuth()
  const navigate = useNavigate()

  const [etapa, setEtapa] = useState<Etapa | null>(null)
  const [fatorId, setFatorId] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const jaPreparou = useRef(false)

  useEffect(() => {
    if (carregando || !usuario || jaPreparou.current) return
    jaPreparou.current = true
    descobrirEtapa().then((r) => {
      setEtapa(r.etapa)
      setFatorId(r.fatorId)
    })
  }, [carregando, usuario])

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault()
    if (!fatorId) return
    setErro('')
    const codigoLimpo = codigo.replace(/\D/g, '')
    if (codigoLimpo.length !== 6) {
      setErro('Digite os 6 números que aparecem no aplicativo autenticador.')
      return
    }
    setEnviando(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fatorId, code: codigoLimpo })
    setEnviando(false)
    if (error) {
      await registrarLogEvento('mfa_falhou', { etapa: 'redefinir_senha' })
      setCodigo('')
      setErro('Código inválido ou expirado. Tente o código atual.')
      return
    }
    setEtapa('senha')
  }

  async function salvarSenha(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!senhaAtendeTodasRegras(senha)) {
      setErro('A senha ainda não atende a todos os requisitos listados abaixo.')
      return
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas digitadas não são iguais.')
      return
    }
    setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setEnviando(false)
      setErro(
        error.code === 'same_password'
          ? 'A nova senha precisa ser diferente da anterior.'
          : `Não foi possível trocar a senha: ${error.message}`,
      )
      return
    }
    await registrarLogEvento('senha_redefinida')
    // Encerra todas as sessões da conta (em qualquer aparelho) e tira o
    // "?recuperar-senha=…&code=…" do endereço.
    await supabase.auth.signOut({ scope: 'global' })
    window.history.replaceState(null, '', window.location.pathname)
    navigate('/login', {
      replace: true,
      state: { aviso: 'Senha alterada! Entre com a nova senha.' },
    })
  }

  let conteudo
  if (carregando || (usuario && !etapa)) {
    conteudo = <p className="status">Carregando...</p>
  } else if (!usuario) {
    conteudo = (
      <div className="mfa-passos">
        <p className="aviso erro">Este link é inválido ou já expirou.</p>
        <p className="item-meta">
          Peça um novo link e abra-o <strong>no mesmo navegador</strong> em que fez o pedido.
        </p>
        <Link to="/esqueci-senha" className="btn btn-primario">
          Pedir novo link
        </Link>
      </div>
    )
  } else if (etapa === 'mfa') {
    conteudo = (
      <form onSubmit={verificarCodigo} className="login-form">
        <p>Sua conta tem verificação em duas etapas. Digite o código atual do aplicativo autenticador.</p>
        <input
          className="campo mfa-codigo"
          placeholder="000000"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
        />
        {erro ? <p className="aviso erro">{erro}</p> : null}
        <button type="submit" className="btn btn-primario login-botao" disabled={enviando}>
          {enviando ? 'Verificando...' : 'Continuar'}
        </button>
      </form>
    )
  } else {
    conteudo = (
      <form onSubmit={salvarSenha} className="login-form">
        <input
          className="campo"
          type="password"
          placeholder="Nova senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="new-password"
          autoFocus
        />
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
          placeholder="Confirmar nova senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          autoComplete="new-password"
        />
        {erro ? <p className="aviso erro">{erro}</p> : null}
        <button type="submit" className="btn btn-primario login-botao" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
    )
  }

  return (
    <div className="login-tela">
      <div className="login-cartao cartao">
        <div className="login-marca">
          <GraduationCap size={32} color="#8257e5" />
          <div>
            <h1>EduGuru</h1>
            <small>Criar nova senha</small>
          </div>
        </div>
        {conteudo}
      </div>
      <Rodape />
    </div>
  )
}
