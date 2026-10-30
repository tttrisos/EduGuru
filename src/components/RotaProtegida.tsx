import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { VERSAO_TERMOS } from '../types'

type Props = {
  children: ReactNode
  somenteAdmin?: boolean
}

// Exige login, MFA, aceite dos termos e, se somenteAdmin, papel de admin.
// O banco (RLS) repete essas regras.
export default function RotaProtegida({ children, somenteAdmin = false }: Props) {
  const { usuario, perfil, carregando, ehAdmin, mfaConcluido } = useAuth()
  const location = useLocation()

  if (carregando) {
    return <p className="status">Carregando...</p>
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ rotaOrigem: location.pathname }} />
  }

  if (!mfaConcluido) {
    return <Navigate to="/mfa" replace state={{ rotaOrigem: location.pathname }} />
  }

  if (perfil && perfil.versao_termos !== VERSAO_TERMOS) {
    return <Navigate to="/aceite" replace state={{ rotaOrigem: location.pathname }} />
  }

  if (somenteAdmin && !ehAdmin) {
    return (
      <section className="pagina">
        <header className="pagina-topo">
          <h2>Acesso restrito</h2>
          <p>
            Esta área é exclusiva para administradores. Você está logado como{' '}
            <strong>{perfil?.nome ?? usuario.email}</strong> (perfil aluno).
          </p>
        </header>
      </section>
    )
  }

  return <>{children}</>
}
