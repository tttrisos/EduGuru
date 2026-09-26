import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Props = {
  children: ReactNode
  somenteAdmin?: boolean
}

// Bloqueia acesso a quem não está logado (e, se somenteAdmin, a quem não
// é admin). Isso é só UX — a segurança de verdade está no RLS do Supabase.
export default function RotaProtegida({ children, somenteAdmin = false }: Props) {
  const { usuario, perfil, carregando, ehAdmin } = useAuth()
  const location = useLocation()

  if (carregando) {
    return <p className="status">Carregando...</p>
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ rotaOrigem: location.pathname }} />
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
