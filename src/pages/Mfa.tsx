import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { registrarLogEvento } from '../lib/log'
import Rodape from '../components/Rodape'

// Autenticação em dois fatores (TOTP — app autenticador, ex.: Google
// Authenticator, Microsoft Authenticator, Authy).
//   - 1º acesso (sem fator): mostra o QR Code e pede o código para ativar.
//   - Acessos seguintes: só pede o código atual do app.
// Só depois disso a sessão vira "aal2" e o banco libera os dados.

type Preparo =
  | { modo: 'verificar'; fatorId: string }
  | { modo: 'cadastrar'; fatorId: string; qrCode: string; segredo: string }

async function prepararMfa(): Promise<Preparo> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error

  const verificado = data.totp[0]
  if (verificado) return { modo: 'verificar', fatorId: verificado.id }

  // Sobras de um cadastro abandonado (QR gerado, código nunca digitado)
  // são removidas antes de gerar um novo QR.
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
  const destino = (location.state as { rotaOrigem?: string } | null)?.rotaOrigem ?? '/'

  const [preparo, setPreparo] = useState<Preparo | null>(null)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Em modo de desenvolvimento o React roda o efeito duas vezes; sem esta
  // trava seriam gerados dois QR Codes diferentes.
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
      setEnviando(false)
      setCodigo('')
      setErro('Código inválido ou expirado. Confira o horário do celular e tente o código atual.')
      return
    }

    // Sessão agora é aal2: registra ativação (1º acesso) e login concluído.
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
          Perdeu acesso ao aplicativo autenticador? Fale com um administrador do projeto para
          remover o fator antigo e cadastrar de novo.
        </p>
      </div>

      <Rodape />
    </div>
  )
}
