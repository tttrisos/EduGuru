import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import { supabase } from '../../compartilhado/supabase'
import { useAuth } from '../../compartilhado/AuthContext'
import BigNumber from '../../compartilhado/BigNumber'
import GraficoBarras from '../../compartilhado/GraficoBarras'
import { gerarLinksArquivos } from '../../compartilhado/arquivos'
import { calcularSituacao } from '../notas/calculoNotas'
import type {
  DesempenhoDisciplina,
  Disciplina,
  EstatisticasAdmin,
  LinhaRanking,
  Nota,
  RecomendacaoGuru,
  TentativaQuiz,
} from '../../compartilhado/tipos'
import './painel.css'

// Painel (RF25): indicadores do aluno ou, para o admin, da plataforma.
export default function Painel() {
  const { ehAdmin, perfil } = useAuth()

  return (
    <section className="pagina pagina-larga">
      <header className="pagina-topo">
        <h2>Olá, {perfil?.nome ?? 'estudante'}!</h2>
        <p>{ehAdmin ? 'Visão geral da plataforma.' : 'Seu desempenho nos quizzes e na faculdade.'}</p>
      </header>
      {ehAdmin ? <PainelAdmin /> : <PainelAluno />}
    </section>
  )
}

// Aluno

type DadosAluno = {
  tentativas: TentativaQuiz[]
  desempenho: DesempenhoDisciplina[]
  ranking: LinhaRanking[]
  guru: RecomendacaoGuru[]
  linksArquivos: Record<string, string>
  notas: Nota[]
  disciplinas: Disciplina[]
}

async function consultarDadosAluno(): Promise<DadosAluno> {
  const [tentativas, desempenho, ranking, guru, notas, disciplinas] = await Promise.all([
    supabase
      .from('tentativas_quiz')
      .select('*')
      .not('finalizada_em', 'is', null)
      .order('finalizada_em', { ascending: true }),
    supabase.rpc('meu_desempenho'),
    supabase.rpc('ranking', { p_disciplina_id: null }),
    supabase.rpc('recomendacoes_guru'),
    supabase.from('notas').select('*'),
    supabase.from('disciplinas').select('*'),
  ])

  const listaGuru = (guru.data as RecomendacaoGuru[]) ?? []
  const caminhos = listaGuru.map((g) => g.arquivo_path).filter((p): p is string => !!p)

  return {
    tentativas: (tentativas.data as TentativaQuiz[]) ?? [],
    desempenho: (desempenho.data as DesempenhoDisciplina[]) ?? [],
    ranking: (ranking.data as LinhaRanking[]) ?? [],
    guru: listaGuru,
    linksArquivos: await gerarLinksArquivos(caminhos),
    notas: (notas.data as Nota[]) ?? [],
    disciplinas: (disciplinas.data as Disciplina[]) ?? [],
  }
}

function PainelAluno() {
  const [dados, setDados] = useState<DadosAluno | null>(null)

  useEffect(() => {
    consultarDadosAluno().then(setDados)
  }, [])

  if (!dados) return <p className="status">Carregando...</p>

  // Indicadores
  const pontos = dados.tentativas.reduce((soma, t) => soma + t.pontos, 0)
  const minhaPosicao = dados.ranking.find((l) => l.eh_voce)?.posicao
  const respondidas = dados.desempenho.reduce((soma, d) => soma + d.respondidas, 0)
  const acertos = dados.desempenho.reduce((soma, d) => soma + d.acertos, 0)
  const aproveitamento = respondidas > 0 ? Math.round((acertos / respondidas) * 100) : null

  const situacoes = dados.notas.map((n) => calcularSituacao(n, n.faltas))
  const comMd = situacoes.filter((s) => s.md !== null)
  const mediaGeral = comMd.length > 0 ? comMd.reduce((soma, s) => soma + (s.md ?? 0), 0) / comMd.length : null
  const emAlerta = situacoes.filter(
    (s) => s.alertaFaltas || s.situacao === 'Em exame' || s.situacao.startsWith('Reprovado'),
  ).length

  // Gráficos
  const ultimasRodadas = dados.tentativas.slice(-10).map((t, i) => ({
    rotulo: `${new Date(t.finalizada_em ?? t.iniciada_em).toLocaleDateString('pt-BR')} #${i + 1}`,
    valor: t.total_perguntas > 0 ? Math.round((t.acertos / t.total_perguntas) * 100) : 0,
  }))

  // Guru: agrupa os materiais por disciplina.
  const disciplinasGuru = [...new Set(dados.guru.map((g) => g.disciplina_id))]

  return (
    <>
      <div className="grade-big-numbers">
        <BigNumber valor={pontos} legenda="Pontos" />
        <BigNumber valor={minhaPosicao ? `${minhaPosicao}º` : '—'} legenda="Posição no ranking" />
        <BigNumber valor={dados.tentativas.length} legenda="Quizzes feitos" />
        <BigNumber valor={aproveitamento !== null ? `${aproveitamento}%` : '—'} legenda="Acertos nos quizzes" />
        <BigNumber
          valor={mediaGeral !== null ? mediaGeral.toFixed(1).replace('.', ',') : '—'}
          legenda="Média geral (MD)"
        />
        <BigNumber valor={emAlerta} legenda="Disciplinas em alerta" detalhe="exame, reprovação ou faltas" />
      </div>

      <div className="grade-graficos">
        <div className="cartao">
          <GraficoBarras
            titulo="Acertos por disciplina (%)"
            itens={dados.desempenho.map((d) => ({ rotulo: d.disciplina, valor: d.aproveitamento }))}
            maximo={100}
            sufixo="%"
            vazio="Faça um quiz para ver seu desempenho."
          />
        </div>
        <div className="cartao">
          <GraficoBarras
            titulo="Acertos nas últimas rodadas (%)"
            itens={ultimasRodadas}
            maximo={100}
            sufixo="%"
            vazio="Nenhuma rodada finalizada ainda."
          />
        </div>
      </div>

      <div className="cartao guru">
        <h3>
          <Lightbulb size={20} color="#8257e5" /> Guru
        </h3>
        {disciplinasGuru.length === 0 ? (
          <p>
            Nenhuma disciplina com baixo desempenho. O Guru indica materiais quando seu aproveitamento
            fica abaixo de 60% em uma disciplina (com pelo menos 5 perguntas respondidas).
          </p>
        ) : (
          disciplinasGuru.map((id) => {
            const itens = dados.guru.filter((g) => g.disciplina_id === id)
            const materiais = itens.filter((g) => g.material_id !== null)
            return (
              <div key={id} className="guru-disciplina">
                <p>
                  <strong>{itens[0].disciplina}</strong> — {itens[0].aproveitamento}% de acertos. Revise:
                </p>
                {materiais.length === 0 ? (
                  <p className="vazio">Ainda não há materiais desta disciplina.</p>
                ) : (
                  <ul>
                    {materiais.map((m) => (
                      <li key={m.material_id}>
                        {m.link ? (
                          <a href={m.link} target="_blank" rel="noreferrer">
                            {m.titulo}
                          </a>
                        ) : m.arquivo_path && dados.linksArquivos[m.arquivo_path] ? (
                          <a href={dados.linksArquivos[m.arquivo_path]} target="_blank" rel="noreferrer">
                            📎 {m.titulo}
                          </a>
                        ) : (
                          m.titulo
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="grade-inicio">
        <Link to="/quiz" className="atalho">
          <h3>Fazer um quiz</h3>
          <p>Até 10 perguntas de uma disciplina, com resultado na hora.</p>
        </Link>
        <Link to="/notas" className="atalho">
          <h3>Notas e faltas</h3>
          <p>Registre M1, ND, NI, exame e faltas e veja sua situação.</p>
        </Link>
        <Link to="/materiais" className="atalho">
          <h3>Materiais</h3>
          <p>Apostilas e links das disciplinas, enviados pelos colegas.</p>
        </Link>
      </div>
    </>
  )
}

// Admin

function PainelAdmin() {
  const [dados, setDados] = useState<EstatisticasAdmin | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    supabase.rpc('estatisticas_admin').then(({ data, error }) => {
      if (error) setErro(error.message)
      else setDados(data as EstatisticasAdmin)
    })
  }, [])

  if (erro) return <p className="aviso erro">{erro}</p>
  if (!dados) return <p className="status">Carregando...</p>

  return (
    <>
      <div className="grade-big-numbers">
        <BigNumber valor={dados.alunos} legenda="Alunos cadastrados" />
        <BigNumber valor={dados.disciplinas} legenda="Disciplinas" />
        <BigNumber valor={dados.perguntas_prontas} legenda="Perguntas no quiz" />
        <BigNumber valor={dados.materiais} legenda="Materiais" />
        <BigNumber valor={dados.quizzes} legenda="Quizzes realizados" />
        <BigNumber valor={`${dados.aproveitamento_geral}%`} legenda="Acertos (média geral)" />
      </div>

      <div className="grade-graficos">
        <div className="cartao">
          <GraficoBarras
            titulo="Quizzes finalizados nos últimos 7 dias"
            itens={(dados.quizzes_por_dia ?? []).map((d) => ({ rotulo: d.dia, valor: d.total }))}
          />
        </div>
        <div className="cartao">
          <GraficoBarras
            titulo="Acertos da turma por disciplina (%)"
            itens={dados.aproveitamento_por_disciplina.map((d) => ({
              rotulo: d.disciplina,
              valor: d.aproveitamento,
            }))}
            maximo={100}
            sufixo="%"
            vazio="Nenhum quiz respondido ainda."
          />
        </div>
      </div>

      <div className="grade-inicio">
        <Link to="/perguntas" className="atalho">
          <h3>Perguntas</h3>
          <p>Cadastre perguntas com 4 alternativas e gabarito.</p>
        </Link>
        <Link to="/disciplinas" className="atalho">
          <h3>Disciplinas</h3>
          <p>Matérias da grade de cada curso.</p>
        </Link>
        <Link to="/usuarios" className="atalho">
          <h3>Usuários</h3>
          <p>Gerencie contas e redefina a verificação em duas etapas.</p>
        </Link>
      </div>
    </>
  )
}
