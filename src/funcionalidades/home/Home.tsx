import { Link } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Lightbulb,
  ShieldCheck,
  Trophy,
  Zap,
} from 'lucide-react'
import { useAuth } from '../../compartilhado/AuthContext'
import { CURSOS } from '../../compartilhado/tipos'
import Rodape from '../../compartilhado/Rodape'
import './home.css'

// Página pública de apresentação. "disponivel: false" mostra o selo "Em breve".
const RECURSOS = [
  {
    icone: BookOpen,
    titulo: 'Disciplinas e materiais',
    texto: 'Disciplinas do seu curso e uma biblioteca de apostilas e links enviados pelos colegas.',
    disponivel: true,
  },
  {
    icone: Zap,
    titulo: 'Quiz rápido',
    texto: 'Até 10 perguntas de múltipla escolha por rodada, com correção na hora.',
    disponivel: true,
  },
  {
    icone: Trophy,
    titulo: 'Ranking',
    texto: 'Cada acerto vale pontos conforme o nível. Veja sua posição geral e em cada disciplina.',
    disponivel: true,
  },
  {
    icone: Lightbulb,
    titulo: 'Guru',
    texto: 'Foi mal no quiz? O Guru indica materiais da mesma disciplina para revisar.',
    disponivel: true,
  },
  {
    icone: BarChart3,
    titulo: 'Dashboard acadêmico',
    texto: 'Notas, faltas e desempenho nos quizzes em um só lugar.',
    disponivel: true,
  },
  {
    icone: ShieldCheck,
    titulo: 'Segurança e privacidade',
    texto: 'Login com verificação em duas etapas e controle total dos seus dados (LGPD).',
    disponivel: true,
  },
]

const PASSOS = [
  { titulo: 'Crie sua conta', texto: 'Cadastro rápido com nome, curso e e-mail.' },
  { titulo: 'Estude', texto: 'Acesse as disciplinas e os materiais de apoio.' },
  { titulo: 'Responda quizzes', texto: 'Teste o que aprendeu em rodadas curtas.' },
  { titulo: 'Evolua', texto: 'Suba no ranking e revise com as dicas do Guru.' },
]

function rolarPara(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Home() {
  const { usuario, mfaConcluido } = useAuth()
  const logado = !!usuario && mfaConcluido

  return (
    <div className="home">
      <header className="topo">
        <div className="topo-conteudo">
          <Link to="/" className="marca">
            <GraduationCap size={26} color="#8257e5" />
            <span>EduGuru</span>
          </Link>

          <nav className="home-nav">
            <button type="button" className="topo-link" onClick={() => rolarPara('como-funciona')}>
              Como funciona
            </button>
            <button type="button" className="topo-link" onClick={() => rolarPara('recursos')}>
              Recursos
            </button>
          </nav>

          <div className="home-acoes">
            {logado ? (
              <Link to="/painel" className="btn btn-primario">
                Ir para o painel
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secundario">
                  Entrar
                </Link>
                <Link to="/login" state={{ modo: 'cadastrar' }} className="btn btn-primario">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="home-hero">
        <h1>
          Estude, responda e <span className="destaque">acompanhe sua evolução.</span>
        </h1>
        <p>
          O EduGuru reúne disciplinas, materiais de estudo e quizzes rápidos para alunos de
          Sistemas de Informação, ADS e Engenharia de Software da UMC.
        </p>
        <div className="home-hero-acoes">
          {logado ? (
            <Link to="/painel" className="btn btn-primario btn-grande">
              Ir para o painel
            </Link>
          ) : (
            <>
              <Link to="/login" state={{ modo: 'cadastrar' }} className="btn btn-primario btn-grande">
                Criar conta grátis
              </Link>
              <Link to="/login" className="btn btn-secundario btn-grande">
                Já tenho conta
              </Link>
            </>
          )}
        </div>
      </section>

      <section id="como-funciona" className="home-secao">
        <h2>Como funciona</h2>
        <ol className="home-passos">
          {PASSOS.map((passo, i) => (
            <li key={passo.titulo} className="cartao">
              <span className="home-passo-numero">{i + 1}</span>
              <h3>{passo.titulo}</h3>
              <p>{passo.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="recursos" className="home-secao">
        <h2>Recursos</h2>
        <div className="home-recursos">
          {RECURSOS.map((r) => {
            const Icone = r.icone
            return (
              <div key={r.titulo} className="cartao home-recurso">
                <div className="home-recurso-topo">
                  <Icone size={22} color="#8257e5" />
                  {!r.disponivel ? <span className="selo">Em breve</span> : null}
                </div>
                <h3>{r.titulo}</h3>
                <p>{r.texto}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="home-secao">
        <h2>Para quem é</h2>
        <div className="home-cursos">
          {CURSOS.map((c) => (
            <span key={c.valor} className="home-curso">
              {c.label}
            </span>
          ))}
        </div>
      </section>

      {!logado ? (
        <section className="home-secao home-cta cartao">
          <h2>Pronto para começar?</h2>
          <p>Crie sua conta em menos de um minuto.</p>
          <Link to="/login" state={{ modo: 'cadastrar' }} className="btn btn-primario btn-grande">
            Criar conta grátis
          </Link>
        </section>
      ) : null}

      <div className="home-secao">
        <Rodape />
      </div>
    </div>
  )
}
