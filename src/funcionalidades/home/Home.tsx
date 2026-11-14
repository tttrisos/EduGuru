import { Link } from 'react-router-dom'
import {
  BookOpen,
  Briefcase,
  ClipboardList,
  Compass,
  GraduationCap,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useAuth } from '../../compartilhado/AuthContext'
import { CURSOS } from '../../compartilhado/tipos'
import Rodape from '../../compartilhado/Rodape'
import './home.css'

// ============================================================
// Página inicial pública (endereço "/", RF23): apresenta o EduGuru para quem não entrou.
// A ordem dos recursos segue a jornada do aluno (evolução → revisar → descobrir →
// direcionar); o quiz aparece como a ferramenta de prática, não como o centro.
// "disponivel: false" mostraria o selo "Em breve".
// ============================================================
const RECURSOS = [
  {
    icone: TrendingUp,
    titulo: 'Minha evolução',
    texto: 'Veja o que você já domina, o que precisa revisar e para onde ir, disciplina por disciplina.',
    disponivel: true,
  },
  {
    icone: Lightbulb,
    titulo: 'Guru',
    texto: 'Abaixo de 60% numa disciplina? O Guru indica materiais para você revisar.',
    disponivel: true,
  },
  {
    icone: Compass,
    titulo: 'Bússola EduGuru',
    texto: 'Autoavaliação de interesses: descubra quais áreas da tecnologia combinam com você.',
    disponivel: true,
  },
  {
    icone: Briefcase,
    titulo: 'EduGuru Carreiras',
    texto: 'Vagas reais de tecnologia, remotas ou em SP, ligadas ao seu desempenho e aos seus interesses.',
    disponivel: true,
  },
  {
    icone: ClipboardList,
    titulo: 'Notas e faltas',
    texto: 'Sua situação em cada disciplina com a regra de médias e faltas da UMC.',
    disponivel: true,
  },
  {
    icone: BookOpen,
    titulo: 'Materiais da comunidade',
    texto: 'Apostilas e links enviados pelos colegas, com moderação.',
    disponivel: true,
  },
  {
    icone: Zap,
    titulo: 'Prática com quiz e ranking',
    texto: 'Rodadas curtas com correção na hora para medir o que você aprendeu.',
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
  { titulo: 'Pratique e acompanhe', texto: 'Pratique as disciplinas e veja sua evolução em cada uma.' },
  { titulo: 'Revise e descubra', texto: 'Revise com o Guru e descubra suas áreas com a Bússola.' },
  { titulo: 'Direcione sua carreira', texto: 'Veja vagas ligadas ao que você domina e ao que gosta.' },
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
                Ver minha evolução
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
          Aprenda, evolua e <span className="destaque">descubra seu caminho na tecnologia.</span>
        </h1>
        <p>
          O EduGuru acompanha a sua evolução nas disciplinas, indica o que revisar e liga o que
          você aprende às áreas e vagas da tecnologia. Para alunos de Sistemas de Informação, ADS e
          Engenharia de Software da UMC.
        </p>
        <div className="home-hero-acoes">
          {logado ? (
            <Link to="/painel" className="btn btn-primario btn-grande">
              Ver minha evolução
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
