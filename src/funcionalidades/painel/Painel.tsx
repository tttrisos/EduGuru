import { useAuth } from '../../compartilhado/AuthContext'
import MinhaEvolucao from './MinhaEvolucao'
import PainelAdmin from './PainelAdmin'
import './painel.css'

// ============================================================
// Painel (endereço /painel, RF25). Escolhe a tela pelo papel de quem entrou:
//   - aluno → MinhaEvolucao.tsx (jornada de aprendizagem)
//   - admin → PainelAdmin.tsx (números gerais da plataforma)
// ============================================================
export default function Painel() {
  const { ehAdmin, perfil } = useAuth()

  return (
    <section className="pagina pagina-larga">
      <header className="pagina-topo">
        <h2>{ehAdmin ? `Olá, ${perfil?.nome ?? 'admin'}!` : 'Minha evolução'}</h2>
        <p>
          {ehAdmin
            ? 'Visão geral da plataforma.'
            : `Olá, ${perfil?.nome ?? 'estudante'}! Veja o que você já domina, o que revisar e para onde ir.`}
        </p>
      </header>
      {ehAdmin ? <PainelAdmin /> : <MinhaEvolucao />}
    </section>
  )
}
