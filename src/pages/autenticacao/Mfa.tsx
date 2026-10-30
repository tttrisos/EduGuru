import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { supabase } from '../../supabase'
import { useAuth } from '../../contexts/AuthContext'
import { registrarLogEvento } from '../../lib/log'
import Rodape from '../../components/Rodape'

// Verificação em duas etapas (TOTP). No 1º acesso mostra o QR Code; depois
// só pede o código. Após 5 códigos errados, a sessão é encerrada.
const MAXIMO_TENTATIVAS = 5

type Preparo =
  | { modo: 'verificar'; fatorId: string }
  | { modo: 'cadastrar'; fatorId: string; qrCode: string; segredo: string }

async function prepararMfa(): Promise<Preparo> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error

  const verificado = data.totp[0]
  if (verificado) return { modo: 'verificar', fatorId: verificado.id }

  // Remove QR Codes gerados e nunca confirmados.
  const pendentes = data.all.filter((f) => f.factor_type === 'totp' && f.status === 'unverified')
  for (const fator of pendentes) {
    await supabase.auth.mfa.unenroll({ factorId: fator.id })
  }

  const { data: novo, error: erroCadastro } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `EduGuru ${new Date().toISOString()}`,
  })
  if (erroCadastro) throw erroCadastro

  return { modo: 'cadastrar', fatorId: novo.id, qrCode: novo.totp.qr_code, segredo: novo.totp.secret }
}

export default function Mfa() {
  const { usuario, carregando, mfaConcluido, atualizarMfa, sair } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as { rotaOrigem?: string } | null)?.rotaOrigem ?? '/painel'

  const [preparo, setPreparo] = useState<Preparo | null>(null)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [tentativasErradas, setTentativasErradas] = useState(0)

  // Evita gerar dois QR Codes (o efeito roda duas vezes em desenvolvimento).
  const jaPreparou = useRef(false)

  useEffect(() => {
    if (carregando || !usuario || mfaConcluido || jaPreparou.current) return
    jaPreparou.current = true
    prepararMfa()
      .then(setPreparo)
      .catch(() =>
        setErro(
          'Não foi possível iniciar a verificação em duas etapas. Confira se o MFA (TOTP) ' +
            'está habilitado no projeto Supabase e tente novamente.',
        ),
      )
  }, [carregando, usuario, mfaConcluido])

  if (carregando) return <p className="status">Carregando...</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (mfaConcluido) return <Navigate to={destino} replace />

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!preparo) return
    setErro('')

    const codigoLimpo = codigo.replace(/\D/g, '')
    if (codigoLimpo.length !== 6) {
      setErro('Digite os 6 números que aparecem no aplicativo autenticador.')
      return
    }

    setEnviando(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: preparo.fatorId,
      code: codigoLimpo,
    })

    if (error) {
      await registrarLogEvento('mfa_falhou', { etapa: preparo.modo })
      const erradas = tentativasErradas + 1
      setTentativasErradas(erradas)

      if (erradas >= MAXIMO_TENTATIVAS) {
        await registrarLogEvento('mfa_bloqueado', { tentativas: erradas })
        navigate('/login', {
          replace: true,
          state: { aviso: 'Muitos códigos inválidos. Por segurança, entre de novo com e-mail e senha.' },
        })
        await sair()
        return
      }

      setEnviando(false)
      setCodigo('')
      setErro(
        'Código inválido ou expirado. Confira o horário do celular e tente o código atual. ' +
          `Tentativas restantes: ${MAXIMO_TENTATIVAS - erradas}.`,
      )
      return
    }

    if (preparo.modo === 'cadastrar') await registrarLogEvento('mfa_ativado')
    await registrarLogEvento('login', { mfa: 'totp' })
    await atualizarMfa()
    setEnviando(false)
    navigate(destino, { replace: true })
  }

  async function aoSair() {
    await sair()
    navigate('/login', { replace: true })
  }

  return (
    <div className="login-tela">
      <div className="login-cartao cartao">
        <div className="login-marca">
          <GraduationCap size={32} color="#8257e5" />
          <div>
            <h1>EduGuru</h1>
            <small>Verificação em duas etapas</small>
          </div>
        </div>

        {!preparo && !erro ? <p className="status">Preparando...</p> : null}

        {preparo?.modo === 'cadastrar' ? (
          <div className="mfa-passos">
            <p>
              <strong>Primeiro acesso:</strong> para proteger sua conta, ative a verificação em
              duas etapas.
            </p>
            <ol>
              <li>Instale um app autenticador (Google Authenticator, Microsoft Authenticator, Authy...).</li>
              <li>No app, escolha adicionar conta e leia o QR Code abaixo.</li>
              <li>Digite o código de 6 números que o app mostrar.</li>
            </ol>
            <img className="mfa-qr" src={preparo.qrCode} alt="QR Code para o aplicativo autenticador" />
            <p className="mfa-segredo">
              Não consegue ler o QR? Digite esta chave no app:
              <code>{preparo.segredo}</code>
            </p>
          </div>
        ) : null}

        {preparo?.modo === 'verificar' ? (
          <p>Abra seu aplicativo autenticador e digite o código atual do EduGuru.</p>
        ) : null}

        <form onSubmit={aoEnviar} className="login-form">
          {preparo ? (
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
          ) : null}

          {erro ? <p className="aviso erro">{erro}</p> : null}

          {preparo ? (
            <button type="submit" className="btn btn-primario login-botao" disabled={enviando}>
              {enviando ? 'Verificando...' : preparo.modo === 'cadastrar' ? 'Ativar e entrar' : 'Verificar'}
            </button>
          ) : null}
          <button type="button" className="btn btn-secundario login-botao" onClick={aoSair}>
            Sair
          </button>
        </form>

        <p className="login-rodape">
          Perdeu acesso ao aplicativo autenticador? Peça a um administrador para redefinir a sua
          verificação em duas etapas (tela Usuários). No próximo login você cadastra o app de novo.
        </p>
      </div>

      <Rodape />
    </div>
  )
}
