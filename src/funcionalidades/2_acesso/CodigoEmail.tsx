import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, MailCheck } from 'lucide-react'
import { supabase } from '../../compartilhado/banco/supabase'
import { registrarLogEvento } from '../../compartilhado/banco/log'
import { useAuth } from '../../compartilhado/sessao/ContextoSessao'
import { useDialogo } from '../../compartilhado/componentes/Dialogo'
import { descreverAparelho } from '../../compartilhado/utilitarios/aparelho'
import Rodape from '../../compartilhado/layout/Rodape'
import { guardarTokenAparelho, mensagemCodigoEmail } from './regrasCodigoEmail'
import './acesso.css'

type RespostaEnvio = { ok: boolean; motivo?: string; email?: string; segundos?: number }
type RespostaConfirmacao = { ok: boolean; motivo?: string; restantes?: number; token?: string | null }

export default function CodigoEmail({ destino }: { destino: string }) {
  const { usuario, emailMascarado, atualizarMfa, sair } = useAuth()
  const { confirmar } = useDialogo()
  const navigate = useNavigate()
  const aparelho = descreverAparelho(navigator.userAgent)

  const [email, setEmail] = useState(emailMascarado)
  const [codigo, setCodigo] = useState('')
  const [lembrar, setLembrar] = useState(true)
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [espera, setEspera] = useState(0) // segundos até poder reenviar

  // Envia só uma vez ao abrir (o efeito roda duas vezes em desenvolvimento).
  const jaEnviou = useRef(false)

  // O código é gerado e enviado pelo banco (enviar_codigo_email), que guarda só o hash; o reenvio
  // e a quantidade diária são limitados lá (cota gratuita do Brevo).
  async function enviar() {
    setErro('')
    setInfo('')
    const { data, error } = await supabase.rpc('enviar_codigo_email', { p_aparelho: aparelho })
    const r = data as RespostaEnvio | null
    if (error || !r) {
      setErro('Não foi possível enviar o código agora. Tente de novo em alguns minutos.')
      return
    }
    if (r.email) setEmail(r.email)
    if (r.ok) {
      setInfo('Código enviado! Pode levar até 1 minuto para chegar. Confira também o spam.')
      setEspera(60)
    } else if (r.motivo === 'aguarde') {
      // Já tinha um código recente (ex.: recarregou a página): usa o mesmo.
      setInfo('Já enviamos um código há pouco. Use o último que chegou.')
      setEspera(r.segundos ?? 60)
    } else if (r.motivo === 'ja_verificada') {
      await atualizarMfa()
    } else {
      setErro(mensagemCodigoEmail(r.motivo))
    }
  }

  useEffect(() => {
    if (jaEnviou.current) return
    jaEnviou.current = true
    enviar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (espera <= 0) return
    const id = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [espera])

  // O banco compara os hashes. Com "Lembrar este aparelho", devolve um token aleatório que fica no
  // navegador; o banco guarda só o hash dele, por 30 dias. Na 5ª tentativa errada, o código é apagado.
  async function aoConfirmar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const limpo = codigo.replace(/\D/g, '')
    if (limpo.length !== 6) {
      setErro('Digite os 6 números que chegaram no seu e-mail.')
      return
    }
    setEnviando(true)
    const { data, error } = await supabase.rpc('confirmar_codigo_email', {
      p_codigo: limpo,
      p_lembrar: lembrar,
      p_aparelho: aparelho,
    })
    const r = data as RespostaConfirmacao | null
    if (error || !r) {
      setEnviando(false)
      setErro('Não foi possível conferir o código. Tente de novo.')
      return
    }
    if (!r.ok) {
      setEnviando(false)
      setCodigo('')
      setErro(mensagemCodigoEmail(r.motivo, { restantes: r.restantes }))
      return
    }
    if (r.token && usuario) guardarTokenAparelho(usuario.id, r.token)
    await registrarLogEvento('login', { mfa: 'email', aparelho })
    await atualizarMfa()
    setEnviando(false)
    navigate(destino, { replace: true })
  }

  async function aoSair() {
    if (!(await confirmar({ titulo: 'Sair da sua conta?', mensagem: 'Para entrar de novo neste aparelho, você vai precisar da senha e de um novo código do e-mail.', textoConfirmar: 'Sair' }))) return
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
            <small>Confirme que é você</small>
          </div>
        </div>

        <p>
          <MailCheck size={18} aria-hidden="true" /> Este aparelho (<strong>{aparelho}</strong>) é novo para a sua
          conta. Enviamos um código de 6 números para <strong>{email ?? 'o seu e-mail'}</strong>.
        </p>

        <form onSubmit={aoConfirmar} className="login-form">
          <input
            className="campo mfa-codigo"
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            aria-label="Código recebido por e-mail"
          />

          <label className="checkbox-linha">
            <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
            <span>Lembrar este aparelho por 30 dias (não marque em computador público ou emprestado).</span>
          </label>

          {info ? <p className="aviso sucesso">{info}</p> : null}
          {erro ? <p className="aviso erro">{erro}</p> : null}

          <button type="submit" className="btn btn-primario login-botao" disabled={enviando}>
            {enviando ? 'Conferindo...' : 'Confirmar e entrar'}
          </button>
          <button type="button" className="btn btn-secundario login-botao" onClick={enviar} disabled={espera > 0}>
            {espera > 0 ? `Reenviar código (${espera}s)` : 'Reenviar código'}
          </button>
          <button type="button" className="btn btn-secundario login-botao" onClick={aoSair}>
            Sair
          </button>
        </form>

        <p className="login-rodape">
          O código vale por 10 minutos e a equipe do EduGuru nunca pede este código. Quer entrar sem depender do
          e-mail? Depois de entrar, ative o aplicativo autenticador em Minha conta.
        </p>
      </div>

      <Rodape />
    </div>
  )
}
