import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { supabase } from '../../supabase'
import { registrarPedidoRedefinicao } from '../../lib/log'
import Rodape from '../../components/Rodape'

// Esqueci minha senha: o Supabase envia o e-mail com o link de redefinição.
export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const emailLimpo = email.trim()
    if (!emailLimpo) {
      setErro('Digite o e-mail da sua conta.')
      return
    }

    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
      redirectTo: `${window.location.origin}${window.location.pathname}?recuperar-senha=1`,
    })
    await registrarPedidoRedefinicao(emailLimpo)
    setEnviando(false)

    if (error && error.status === 429) {
      setErro('Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente de novo.')
      return
    }
    // Mesma resposta com ou sem conta, para não revelar quem está cadastrado.
    setEnviado(true)
  }

  return (
    <div className="login-tela">
      <div className="login-cartao cartao">
        <Link to="/login" className="termos-voltar">
          ← Voltar ao login
        </Link>

        <div className="login-marca">
          <GraduationCap size={32} color="#8257e5" />
          <div>
            <h1>EduGuru</h1>
            <small>Esqueci minha senha</small>
          </div>
        </div>

        {enviado ? (
          <div className="mfa-passos">
            <p className="aviso sucesso">
              Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha.
            </p>
            <p className="item-meta">
              Abra o link <strong>neste mesmo navegador</strong>. Não chegou? Confira a caixa de spam
              ou peça de novo em alguns minutos.
            </p>
          </div>
        ) : (
          <form onSubmit={aoEnviar} className="login-form">
            <p className="item-meta">
              Digite o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.
            </p>
            <input
              className="campo"
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            {erro ? <p className="aviso erro">{erro}</p> : null}
            <button type="submit" className="btn btn-primario login-botao" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>
        )}
      </div>

      <Rodape />
    </div>
  )
}
