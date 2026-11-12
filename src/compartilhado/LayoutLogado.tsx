import { useState } from 'react'
import { useDialogo } from './Dialogo'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, ChevronDown, CircleUserRound, ClipboardList, GraduationCap, LogOut, Menu, Moon, ShieldCheck, Sun, X } from 'lucide-react'
import { useAuth } from './AuthContext'
import Rodape from './Rodape'
import { aplicarTema, temaSalvo, type Tema } from './tema'

// Menu de cada papel. O Painel abre pelo botão "Minha conta";
// Notas e Materiais ficam no menu que abre sobre ele.
// "marca": item com a assinatura "EduGuru" em cima (produto próprio, como o EduGuru Carreiras).
type ItemMenu = { path: string; label: string; marca?: boolean }

const itensAluno: ItemMenu[] = [
  { path: '/quiz', label: 'Quiz' },
  { path: '/ranking', label: 'Ranking' },
  { path: '/disciplinas', label: 'Disciplinas' },
  { path: '/carreiras', label: 'Carreiras', marca: true },
]

const itensAdmin: ItemMenu[] = [
  { path: '/disciplinas', label: 'Disciplinas' },
  { path: '/perguntas', label: 'Perguntas' },
  { path: '/ranking', label: 'Ranking' },
  { path: '/carreiras', label: 'Carreiras', marca: true },
  { path: '/usuarios', label: 'Usuários' },
  { path: '/logs', label: 'Logs' },
]

// Área logada: barra no topo e conteúdo abaixo.
export default function LayoutLogado() {
  const { confirmar } = useDialogo()
  const location = useLocation()
  const navigate = useNavigate()
  const { perfil, ehAdmin, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const [tema, setTema] = useState<Tema>(temaSalvo)

  const itens = ehAdmin ? itensAdmin : itensAluno

  async function aoSair() {
    if (!(await confirmar({ titulo: 'Sair da sua conta?', mensagem: 'Para entrar de novo, você vai precisar da senha e do código do aplicativo autenticador.', textoConfirmar: 'Sair' }))) return
    await sair()
    navigate('/login', { replace: true })
  }

  function trocarTema(novo: Tema) {
    aplicarTema(novo)
    setTema(novo)
  }

  function rotaAtiva(path: string) {
    return location.pathname.startsWith(path)
  }

  return (
    <div className="layout">
      <header className="topo">
        <div className="topo-conteudo">
          <Link to="/" className="marca" onClick={() => setMenuAberto(false)}>
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
                className={`topo-link${item.marca ? ' topo-link-marca' : ''}${rotaAtiva(item.path) ? ' ativo' : ''}`}
                onClick={() => setMenuAberto(false)}
                aria-label={item.marca ? `EduGuru ${item.label}` : undefined}
              >
                {item.marca ? (
                  <span className="assinatura" aria-hidden="true">
                    EduGuru
                  </span>
                ) : null}
                {item.label}
              </Link>
            ))}

            <div className="topo-usuario">
              {/* "Minha conta" leva ao Painel; o menu abre ao passar o mouse (ou com Tab) */}
              <div className="topo-conta">
                <Link
                  to="/painel"
                  className={`topo-link${rotaAtiva('/painel') ? ' ativo' : ''}`}
                  onClick={() => setMenuAberto(false)}
                  title={perfil?.nome ?? 'Minha conta'}
                >
                  <CircleUserRound size={20} aria-hidden="true" />
                  Minha conta
                  <span className={`selo${perfil?.papel === 'admin' ? ' selo-admin' : ''}`}>
                    {perfil?.papel === 'admin' ? 'Admin' : 'Aluno'}
                  </span>
                  <ChevronDown size={14} aria-hidden="true" />
                </Link>
                <div className="topo-conta-menu">
                  {!ehAdmin ? (
                    <Link
                      to="/notas"
                      className={`topo-link${rotaAtiva('/notas') ? ' ativo' : ''}`}
                      onClick={() => setMenuAberto(false)}
                    >
                      <ClipboardList size={16} /> Notas
                    </Link>
                  ) : null}
                  <Link
                    to="/materiais"
                    className={`topo-link${rotaAtiva('/materiais') ? ' ativo' : ''}`}
                    onClick={() => setMenuAberto(false)}
                  >
                    <BookOpen size={16} /> Materiais
                  </Link>
                  <Link
                    to="/minha-conta"
                    className={`topo-link${rotaAtiva('/minha-conta') ? ' ativo' : ''}`}
                    onClick={() => setMenuAberto(false)}
                  >
                    <ShieldCheck size={16} /> Meus dados e privacidade
                  </Link>
                  <div className="topo-tema" role="group" aria-label="Aparência do site">
                    <button
                      type="button"
                      className={`topo-link${tema === 'escuro' ? ' ativo' : ''}`}
                      aria-pressed={tema === 'escuro'}
                      onClick={() => trocarTema('escuro')}
                    >
                      <Moon size={16} /> Modo escuro
                    </button>
                    <button
                      type="button"
                      className={`topo-link${tema === 'claro' ? ' ativo' : ''}`}
                      aria-pressed={tema === 'claro'}
                      onClick={() => trocarTema('claro')}
                    >
                      <Sun size={16} /> Modo claro
                    </button>
                  </div>
                </div>
              </div>
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
