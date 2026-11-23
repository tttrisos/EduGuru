import { useAuth } from '../../../compartilhado/sessao/ContextoSessao'
import MinhaEvolucao from './MinhaEvolucao'
import PainelAdmin from '../../7_administracao/PainelAdmin'
import './painel.css'

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
