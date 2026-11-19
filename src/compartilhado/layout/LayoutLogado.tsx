import { useState } from 'react'
import { useDialogo } from '../componentes/Dialogo'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChevronDown,
  CircleUserRound,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { useAuth } from '../sessao/ContextoSessao'
import Rodape from './Rodape'
import { aplicarTema, temaSalvo, type Tema } from '../utilitarios/tema'

// ============================================================
// Barra superior da área logada (aparece em todas as telas depois do login).
// Quem usa: Rotas.tsx, que coloca todas as telas logadas "dentro" deste layout;
// a tela da vez aparece no <Outlet /> lá embaixo.
//
// O menu do ALUNO segue a jornada de aprendizagem, não o quiz:
//   Minha evolução (painel e disciplinas) → Estudar (quiz, ranking, materiais)
//   → Bússola (interesses) → Carreiras (vagas).
// O menu do ADMIN segue o trabalho de gestão.
// ============================================================

// "marca": item com a assinatura "EduGuru" em cima (produtos próprios: Bússola e Carreiras).
// "filhos": submenu que abre ao passar o mouse (ou com Tab); no celular fica sempre aberto.
type ItemMenu = { path: string; label: string; marca?: boolean; filhos?: SubItem[] }
type SubItem = { path: string; label: string; icone: typeof Zap }

const itensAluno: ItemMenu[] = [
  {
    path: '/painel',
    label: 'Minha evolução',
    filhos: [
      { path: '/painel', label: 'Minha evolução', icone: TrendingUp },
      // Para o aluno, Disciplinas é só consulta (a grade de cada curso), por isso fica no fim
      // deste submenu, e não como item próprio na barra.
      { path: '/disciplinas', label: 'Disciplinas', icone: Library },
    ],
  },
  {
    path: '/quiz',
    label: 'Estudar',
    filhos: [
      { path: '/quiz', label: 'Quiz', icone: Zap },
      { path: '/ranking', label: 'Ranking', icone: Trophy },
      { path: '/materiais', label: 'Materiais', icone: BookOpen },
    ],
  },
  { path: '/bussola', label: 'Bússola', marca: true },
  { path: '/carreiras', label: 'Carreiras', marca: true },
]

const itensAdmin: ItemMenu[] = [
  { path: '/painel', label: 'Painel' },
  {
    path: '/disciplinas',
    label: 'Conteúdo',
    filhos: [
      { path: '/disciplinas', label: 'Disciplinas', icone: Library },
      { path: '/perguntas', label: 'Perguntas', icone: HelpCircle },
      { path: '/materiais', label: 'Materiais', icone: BookOpen },
    ],
  },
  { path: '/ranking', label: 'Ranking' },
  { path: '/carreiras', label: 'Carreiras', marca: true },
  { path: '/usuarios', label: 'Usuários' },
  { path: '/logs', label: 'Logs' },
]

export default function LayoutLogado() {
  const { confirmar } = useDialogo()
  const location = useLocation()
  const navigate = useNavigate()
  const { perfil, ehAdmin, temMfa, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const [tema, setTema] = useState<Tema>(temaSalvo)

  const itens = ehAdmin ? itensAdmin : itensAluno

  // No topo aparece o primeiro nome da pessoa (ex.: "Thiago"), no lugar do texto "Minha conta".
  // Sem perfil carregado ainda, fica "Minha conta".
  const primeiroNome = perfil?.nome?.trim().split(/\s+/)[0] || 'Minha conta'

  // Sair pede confirmação (janela do EduGuru, em compartilhado/Dialogo.tsx).
  async function aoSair() {
    if (!(await confirmar({ titulo: 'Sair da sua conta?', mensagem: temMfa ? 'Para entrar de novo, você vai precisar da senha e do código do aplicativo autenticador.' : 'Para entrar de novo, você vai precisar da sua senha.', textoConfirmar: 'Sair' }))) return
    await sair()
    navigate('/login', { replace: true })
  }

  // Tema escuro/claro: salvo no navegador (compartilhado/tema.ts).
  function trocarTema(novo: Tema) {
    aplicarTema(novo)
    setTema(novo)
  }

  // O item fica sublinhado quando a tela aberta começa com o endereço dele.
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

          {/* Botão "hambúrguer": só aparece no celular */}
          <button
            type="button"
            className="topo-menu-btn"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuAberto((v) => !v)}
          >
            {menuAberto ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className={`topo-nav${menuAberto ? ' aberto' : ''}`}>
            {itens.map((item) =>
              item.filhos ? (
                // Item com submenu (ex.: Estudar → Quiz, Ranking, Materiais)
                <div key={item.path} className="topo-grupo">
                  <Link
                    to={item.path}
                    className={`topo-link${item.filhos.some((f) => rotaAtiva(f.path)) ? ' ativo' : ''}`}
                    onClick={() => setMenuAberto(false)}
                  >
                    {item.label}
                    <ChevronDown size={14} aria-hidden="true" />
                  </Link>
                  <div className="topo-grupo-menu">
                    {item.filhos.map((f) => (
                      <Link
                        key={f.path}
                        to={f.path}
                        className={`topo-link${rotaAtiva(f.path) ? ' ativo' : ''}`}
                        onClick={() => setMenuAberto(false)}
                      >
                        <f.icone size={16} aria-hidden="true" /> {f.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                // Item simples (ex.: Logs, no menu do admin) ou com a assinatura EduGuru (Bússola, Carreiras)
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
              ),
            )}

            <div className="topo-usuario">
              {/* Menu da conta (mostra o primeiro nome): dados pessoais, privacidade, senha e tema */}
              <div className="topo-conta">
                <Link
                  to="/minha-conta"
                  className={`topo-link${rotaAtiva('/minha-conta') ? ' ativo' : ''}`}
                  onClick={() => setMenuAberto(false)}
                  title={perfil?.nome ? `Minha conta — ${perfil.nome}` : 'Minha conta'}
                  aria-label={perfil?.nome ? `Minha conta de ${primeiroNome}` : undefined}
                >
                  <CircleUserRound size={20} aria-hidden="true" />
                  <span className="topo-conta-nome">{primeiroNome}</span>
                  <span className={`selo${perfil?.papel === 'admin' ? ' selo-admin' : ''}`}>
                    {perfil?.papel === 'admin' ? 'Admin' : 'Aluno'}
                  </span>
                  <ChevronDown size={14} aria-hidden="true" />
                </Link>
                <div className="topo-conta-menu">
                  {ehAdmin ? (
                    <Link
                      to="/painel"
                      className={`topo-link${rotaAtiva('/painel') ? ' ativo' : ''}`}
                      onClick={() => setMenuAberto(false)}
                    >
                      <LayoutDashboard size={16} /> Painel
                    </Link>
                  ) : null}
                  <Link
                    to="/minha-conta"
                    className={`topo-link${rotaAtiva('/minha-conta') ? ' ativo' : ''}`}
                    onClick={() => setMenuAberto(false)}
                  >
                    <ShieldCheck size={16} /> Meus dados, senha e privacidade
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

      {/* Aqui entra a tela aberta (Painel, Quiz, Carreiras...) */}
      <main className="content">
        <Outlet />
        <Rodape />
      </main>
    </div>
  )
}
