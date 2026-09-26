import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Rodape from '../components/Rodape'

const itensBase = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/disciplinas', label: 'Disciplinas', icon: BookOpen },
  { path: '/perguntas', label: 'Perguntas', icon: HelpCircle },
  { path: '/materiais', label: 'Materiais', icon: FileText },
]

const itemLogs = { path: '/logs', label: 'Logs', icon: ShieldCheck }

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { perfil, ehAdmin, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)

  // aluno não vê "Logs" no menu (rota e RLS já bloqueiam mesmo assim)
  const itens = ehAdmin ? [...itensBase, itemLogs] : itensBase

  async function aoSair() {
    await sair()
    navigate('/login', { replace: true })
  }

  function rotaAtiva(path: string) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="layout">
      <button
        type="button"
        className="menu-btn"
        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setMenuAberto((v) => !v)}
      >
        {menuAberto ? <X size={20} /> : <Menu size={20} />}
      </button>

      {menuAberto ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
        />
      ) : null}

      <aside className={`sidebar${menuAberto ? ' aberta' : ''}`}>
        <Link to="/" className="brand" onClick={() => setMenuAberto(false)}>
          <GraduationCap size={28} color="#8257e5" />
          <div>
            <h1>EduGuru</h1>
            <small>PFC · UMC 2026</small>
          </div>
        </Link>

        <nav className="nav">
          {itens.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item${rotaAtiva(item.path) ? ' ativo' : ''}`}
                onClick={() => setMenuAberto(false)}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="usuario-caixa">
          <div className="usuario-info">
            <strong>{perfil?.nome ?? 'Carregando...'}</strong>
            <span className={`selo${perfil?.papel === 'admin' ? ' selo-admin' : ''}`}>
              {perfil?.papel === 'admin' ? 'Administrador' : 'Aluno'}
            </span>
          </div>
          <button type="button" className="btn btn-perigo usuario-sair" onClick={aoSair}>
            <LogOut size={16} />
            Sair
          </button>
        </div>

        <div className="sidebar-links">
          <Link to="/termos" onClick={() => setMenuAberto(false)}>
            Termo de Aceite
          </Link>
          <Link to="/privacidade" onClick={() => setMenuAberto(false)}>
            Política de Privacidade
          </Link>
        </div>
      </aside>

      <main className="content">
        <Outlet />
        <Rodape />
      </main>
    </div>
  )
}