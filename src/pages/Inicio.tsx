import { Link } from 'react-router-dom'
import { BookOpen, FileText, HelpCircle } from 'lucide-react'

export default function Inicio() {
  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Bem-vindo ao EduGuru</h2>
        <p>
          Plataforma para organizar disciplinas, montar quizzes e guardar
          materiais de estudo — o primeiro passo da jornada gamificada.
        </p>
      </header>

      <div className="grade-inicio">
        <Link to="/disciplinas" className="atalho">
          <BookOpen size={22} color="#8257e5" />
          <h3>Disciplinas</h3>
          <p>Cadastre as matérias da grade para amarrar perguntas e materiais depois.</p>
        </Link>
        <Link to="/perguntas" className="atalho">
          <HelpCircle size={22} color="#8257e5" />
          <h3>Perguntas</h3>
          <p>Banco de questões do quiz, com nível de dificuldade.</p>
        </Link>
        <Link to="/materiais" className="atalho">
          <FileText size={22} color="#8257e5" />
          <h3>Materiais</h3>
          <p>Links e apostilas que o Guru vai indicar conforme o desempenho.</p>
        </Link>
      </div>
    </section>
  )
}
