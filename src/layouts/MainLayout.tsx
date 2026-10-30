import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Rodape from '../components/Rodape'

// Menu de cada papel.
const itensAluno = [
  { path: '/painel', label: 'Painel' },
  { path: '/quiz', label: 'Quiz' },
  { path: '/ranking', label: 'Ranking' },
  { path: '/notas', label: 'Notas' },
  { path: '/materiais', label: 'Materiais' },
  { path: '/disciplinas', label: 'Disciplinas' },
]

const itensAdmin = [
  { path: '/painel', label: 'Painel' },
  { path: '/disciplinas', label: 'Disciplinas' },
  { path: '/perguntas', label: 'Perguntas' },
  { path: '/materiais', label: 'Materiais' },
  { path: '/ranking', label: 'Ranking' },
  { path: '/usuarios', label: 'Usuários' },
  { path: '/logs', label: 'Logs' },
]

// Área logada: barra no topo e conteúdo abaixo.
export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { perfil, ehAdmin, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)

  const itens = ehAdmin ? itensAdmin : itensAluno

  async function aoSair() {
    await sair()
    navigate('/login', { replace: true })
  }

  function rotaAtiva(path: string) {
    return location.pathname.startsWith(path)
  }

  return (
    <div className="layout">
      <header className="topo">
        <div className="topo-conteudo">
          <Link to="/painel" className="marca" onClick={() => setMenuAberto(false)}>
            <GraduationCap size={26} color="#8257e5" />
            <span>EduGuru</span>
          </Link>

          <button
            type="button"
            className="topo-menu-btn"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuAberto((v) => !v)}
          >
            {menuAberto ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className={`topo-nav${menuAberto ? ' aberto' : ''}`}>
            {itens.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`topo-link${rotaAtiva(item.path) ? ' ativo' : ''}`}
                onClick={() => setMenuAberto(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="topo-usuario">
              <Link
                to="/minha-conta"
                className={`topo-link${rotaAtiva('/minha-conta') ? ' ativo' : ''}`}
                onClick={() => setMenuAberto(false)}
                title="Minha conta"
              >
                {perfil?.nome ?? 'Minha conta'}
                <span className={`selo${perfil?.papel === 'admin' ? ' selo-admin' : ''}`}>
                  {perfil?.papel === 'admin' ? 'Admin' : 'Aluno'}
                </span>
              </Link>
              <button type="button" className="btn btn-secundario topo-sair" onClick={aoSair}>
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="content">
        <Outlet />
        <Rodape />
      </main>
    </div>
  )
}
