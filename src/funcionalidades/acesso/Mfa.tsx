// ============================================================
// funcionalidades/acesso/Mfa.tsx
// VERIFICAÇÃO EM DUAS ETAPAS NO LOGIN (endereço /mfa) — RF03, RF04.
// Só chega aqui quem precisa do código (ver compartilhado/sessao/nivelSessao.ts):
// - quem ATIVOU o MFA em Minha conta: digita o código de 6 dígitos do aplicativo;
// - administrador sem MFA: é obrigado a cadastrar o aplicativo (QR Code) antes de entrar.
// Código certo → sessão vira aal2. 5 códigos errados → sai da conta. Banco: supabase/05 e 23.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useDialogo } from '../../compartilhado/componentes/Dialogo'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useAuth } from '../../compartilhado/sessao/ContextoSessao'
import { registrarLogEvento } from '../../compartilhado/banco/log'
import Rodape from '../../compartilhado/layout/Rodape'
import { confirmarCodigo, fatorVerificado, iniciarCadastroTotp } from './fatoresMfa'
import './acesso.css'

const MAXIMO_TENTATIVAS = 5

type Preparo =
  | { modo: 'verificar'; fatorId: string }
  | { modo: 'cadastrar'; fatorId: string; qrCode: string; segredo: string }

// Tem aplicativo confirmado → pede o código. Não tem → só o admin cadastra aqui (é obrigatório para ele).
async function prepararMfa(ehAdmin: boolean): Promise<Preparo | null> {
  const fatorId = await fatorVerificado()
  if (fatorId) return { modo: 'verificar', fatorId }
  if (!ehAdmin) return null
  return { modo: 'cadastrar', ...(await iniciarCadastroTotp()) }
}

export default function Mfa() {
  const { confirmar } = useDialogo()
  const { usuario, perfil, carregando, verificacaoOk, atualizarMfa, sair } = useAuth()
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
    if (carregando || !usuario || verificacaoOk || jaPreparou.current) return
    jaPreparou.current = true
    prepararMfa(perfil?.papel === 'admin')
      .then((resultado) => {
        // Sem MFA e sem ser admin: não precisa de código (a sessão é recarregada e segue para o destino).
        if (resultado) setPreparo(resultado)
        else {
          jaPreparou.current = false // o perfil pode chegar depois: tenta de novo quando ele mudar
          atualizarMfa()
        }
      })
      .catch(() =>
        setErro(
          'Não foi possível iniciar a verificação em duas etapas. Confira se o MFA (TOTP) ' +
            'está habilitado no projeto Supabase e tente novamente.',
        ),
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, usuario, verificacaoOk, perfil])

  if (carregando) return <p className="status">Carregando...</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (verificacaoOk) return <Navigate to={destino} replace />

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
    const error = await confirmarCodigo(preparo.fatorId, codigoLimpo)

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
    if (!(await confirmar({ titulo: 'Sair da sua conta?', mensagem: 'Para entrar de novo, você vai precisar da senha e do código do aplicativo autenticador.', textoConfirmar: 'Sair' }))) return
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
              <strong>Conta de administrador:</strong> para alunos a verificação em duas etapas é
              opcional, mas para administradores ela é obrigatória. Ative para continuar.
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
          verificação em duas etapas (tela Usuários). Depois disso você entra só com a senha e, se
          quiser, ativa de novo em Minha conta.
        </p>
      </div>

      <Rodape />
    </div>
  )
}
