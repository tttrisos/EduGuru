import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../compartilhado/sessao/ContextoSessao'
import { CHAVE_ADIAMENTO, dataDeAdiamento, deveMostrarAvisoMfa } from './avisoMfa'
import './conta.css'

// O navegador pode bloquear o armazenamento (aba anônima): aí o aviso só volta a aparecer.
function lerAdiamento() {
  try {
    return localStorage.getItem(CHAVE_ADIAMENTO)
  } catch {
    return null
  }
}

export default function AvisoAtivarMfa() {
  const { temMfa, ehAdmin } = useAuth()
  const [adiadoAte, setAdiadoAte] = useState(lerAdiamento)

  if (!deveMostrarAvisoMfa(temMfa, ehAdmin, adiadoAte, new Date())) return null

  function adiar() {
    const data = dataDeAdiamento(new Date())
    try {
      localStorage.setItem(CHAVE_ADIAMENTO, data)
    } catch {
      // sem armazenamento: esconde só até recarregar a página
    }
    setAdiadoAte(data)
  }

  return (
    <div className="cartao aviso-mfa" role="note">
      <ShieldAlert size={24} color="var(--amarelo-texto)" aria-hidden="true" />
      <div>
        <strong>Proteja a sua conta</strong>
        <p>
          Hoje a sua conta depende da senha e do seu e-mail. Ative a verificação em duas etapas: além da
          senha, todo login passa a pedir um código do aplicativo no seu celular, e ninguém entra só com a
          senha, nem se descobrir a senha do seu e-mail.
        </p>
        <div className="acoes-item">
          <Link to="/minha-conta" state={{ focar: 'duas-etapas' }} className="btn btn-primario">
            Ativar agora
          </Link>
          <button type="button" className="btn btn-secundario" onClick={adiar}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
