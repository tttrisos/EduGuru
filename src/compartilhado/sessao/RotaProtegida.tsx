// ============================================================
// compartilhado/sessao/RotaProtegida.tsx
// PORTEIRO DAS TELAS LOGADAS: antes de mostrar a tela, confere na ordem:
// 1) está logado?  2) digitou o código das duas etapas, se a conta exige (quem ativou o MFA e todo
//    admin; ver nivelSessao.ts) ou o código do e-mail, se é um aparelho novo (supabase/25)?  3) aceitou a versão atual dos termos?
// 4) (somenteAdmin) é administrador?  Se faltar algo, manda para a tela certa (login, MFA, novo aceite).
// A tela só esconde; quem garante de verdade é o RLS do banco.
// ============================================================

import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './ContextoSessao'
import { VERSAO_TERMOS } from '../tipos'

type Props = {
  children: ReactNode
  somenteAdmin?: boolean
}

// Exige login, o código do MFA (quando a conta exige), aceite dos termos e, se somenteAdmin, papel de admin.
// O banco (RLS) repete essas regras.
export default function RotaProtegida({ children, somenteAdmin = false }: Props) {
  const { usuario, perfil, carregando, ehAdmin, verificacaoOk } = useAuth()
  const location = useLocation()

  if (carregando) {
    return <p className="status">Carregando...</p>
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ rotaOrigem: location.pathname }} />
  }

  if (!verificacaoOk) {
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
