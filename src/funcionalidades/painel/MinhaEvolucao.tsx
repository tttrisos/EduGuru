import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenCheck, Briefcase, Compass, Lightbulb, RotateCcw } from 'lucide-react'
import { supabase } from '../../compartilhado/banco/supabase'
import NumeroDestaque from '../../compartilhado/componentes/NumeroDestaque'
import GraficoBarras from '../../compartilhado/componentes/GraficoBarras'
import { gerarLinksArquivos } from '../../compartilhado/banco/arquivos'
import { calcularSituacao } from '../notas/calculoNotas'
import { combinarSugestoes, destaques, type AfinidadeBussola } from '../bussola/afinidadeBussola'
import { fraseAprender, resumirEvolucao } from './evolucao'
import type {
  AreaSugerida,
  DesempenhoDisciplina,
  LinhaRanking,
  Nota,
  RecomendacaoGuru,
  TentativaQuiz,
} from '../../compartilhado/tipos'

// ============================================================
// Minha evolução (painel do aluno, RF25): o centro do EduGuru é a aprendizagem do aluno.
// A tela mostra a JORNADA em 4 etapas, cada uma ligada a uma funcionalidade:
//   1) Aprender   → desempenho por disciplina (quiz)          → banco: meu_desempenho()
//   2) Revisar    → Guru indica materiais abaixo de 60%        → banco: recomendacoes_guru()
//   3) Descobrir  → Bússola: áreas que combinam com o aluno    → banco: minha_bussola()
//   4) Direcionar → Carreiras: áreas sugeridas e vagas         → banco: minhas_areas_carreira()
// Depois vêm os números, os gráficos, o Guru e os atalhos. Pontos e ranking ficam por último.
// ============================================================

type DadosAluno = {
  tentativas: TentativaQuiz[]
  desempenho: DesempenhoDisciplina[]
  ranking: LinhaRanking[]
  guru: RecomendacaoGuru[]
  linksArquivos: Record<string, string>
  notas: Nota[]
  bussola: AfinidadeBussola[]
  areasDesempenho: AreaSugerida[]
}

// Todas as consultas ao banco de uma vez (Promise.all = em paralelo).
async function consultarDadosAluno(): Promise<DadosAluno> {
  const [tentativas, desempenho, ranking, guru, notas, bussola, areas] = await Promise.all([
    supabase
      .from('tentativas_quiz')
      .select('*')
      .not('finalizada_em', 'is', null)
      .order('finalizada_em', { ascending: true }),
    supabase.rpc('meu_desempenho'),
    supabase.rpc('ranking', { p_disciplina_id: null }),
    supabase.rpc('recomendacoes_guru'),
    supabase.from('notas').select('*'),
    supabase.rpc('minha_bussola'),
    supabase.rpc('minhas_areas_carreira'),
  ])

  // Links temporários (1 hora) dos arquivos que o Guru indica.
  const listaGuru = (guru.data as RecomendacaoGuru[]) ?? []
  const caminhos = listaGuru.map((g) => g.arquivo_path).filter((p): p is string => !!p)

  return {
    tentativas: (tentativas.data as TentativaQuiz[]) ?? [],
    desempenho: (desempenho.data as DesempenhoDisciplina[]) ?? [],
    ranking: (ranking.data as LinhaRanking[]) ?? [],
    guru: listaGuru,
    linksArquivos: await gerarLinksArquivos(caminhos),
    notas: (notas.data as Nota[]) ?? [],
    // Bússola e Carreiras: se o script do banco ainda não foi rodado, a etapa só fica vazia.
    bussola: bussola.error ? [] : ((bussola.data as AfinidadeBussola[]) ?? []),
    areasDesempenho: areas.error ? [] : ((areas.data as AreaSugerida[]) ?? []),
  }
}

export default function MinhaEvolucao() {
  const [dados, setDados] = useState<DadosAluno | null>(null)

  useEffect(() => {
    consultarDadosAluno().then(setDados)
  }, [])

  if (!dados) return <p className="status">Carregando...</p>

  // ---- Cálculos da tela ----
  const resumo = resumirEvolucao(dados.desempenho)
  const disciplinasGuru = [...new Set(dados.guru.map((g) => g.disciplina_id))]
  const areaPrincipal = destaques(dados.bussola)[0] ?? null
  const areasSugeridas = combinarSugestoes(dados.areasDesempenho, dados.bussola)

  // Notas da faculdade (regra da UMC em notas/calculoNotas.ts)
  const situacoes = dados.notas.map((n) => calcularSituacao(n, n.faltas))
  const comMd = situacoes.filter((s) => s.md !== null)
  const mediaGeral = comMd.length > 0 ? comMd.reduce((soma, s) => soma + (s.md ?? 0), 0) / comMd.length : null
  const emAlerta = situacoes.filter(
    (s) => s.alertaFaltas || s.situacao === 'Em exame' || s.situacao.startsWith('Reprovado'),
  ).length

  // Gamificação (fica por último na tela)
  const pontos = dados.tentativas.reduce((soma, t) => soma + t.pontos, 0)
  const minhaPosicao = dados.ranking.find((l) => l.eh_voce)?.posicao

  const ultimasRodadas = dados.tentativas.slice(-10).map((t, i) => ({
    rotulo: `${new Date(t.finalizada_em ?? t.iniciada_em).toLocaleDateString('pt-BR')} #${i + 1}`,
    valor: t.total_perguntas > 0 ? Math.round((t.acertos / t.total_perguntas) * 100) : 0,
  }))

  return (
    <>
      {/* 1) A jornada: as 4 etapas da aprendizagem */}
      <ol className="jornada">
        <li className="jornada-etapa">
          <span className="jornada-icone" aria-hidden="true">
            <BookOpenCheck size={22} />
          </span>
          <span className="jornada-numero">1. Aprender</span>
          <strong>{resumo.praticadas > 0 ? `${resumo.dominadas} dominada(s)` : 'Ainda sem prática'}</strong>
          <p>{fraseAprender(resumo)}</p>
          <Link to="/quiz" className="jornada-link">
            Praticar uma disciplina →
          </Link>
        </li>
        <li className="jornada-etapa">
          <span className="jornada-icone" aria-hidden="true">
            <RotateCcw size={22} />
          </span>
          <span className="jornada-numero">2. Revisar</span>
          <strong>{disciplinasGuru.length > 0 ? `${disciplinasGuru.length} para revisar` : 'Nada para revisar'}</strong>
          <p>
            {disciplinasGuru.length > 0
              ? 'O Guru separou materiais das disciplinas abaixo de 60%.'
              : 'Quando uma disciplina ficar abaixo de 60%, o Guru indica materiais.'}
          </p>
          <a href="#guru" className="jornada-link">
            Ver o Guru →
          </a>
        </li>
        <li className="jornada-etapa">
          <span className="jornada-icone" aria-hidden="true">
            <Compass size={22} />
          </span>
          <span className="jornada-numero">3. Descobrir</span>
          <strong>{areaPrincipal ? areaPrincipal.area : 'Bússola não respondida'}</strong>
          <p>
            {areaPrincipal
              ? `Sua área de maior interesse (${areaPrincipal.afinidade}% de afinidade).`
              : 'Responda a Bússola para descobrir as áreas que combinam com você.'}
          </p>
          <Link to="/bussola" className="jornada-link">
            {areaPrincipal ? 'Ver a Bússola →' : 'Responder a Bússola →'}
          </Link>
        </li>
        <li className="jornada-etapa">
          <span className="jornada-icone" aria-hidden="true">
            <Briefcase size={22} />
          </span>
          <span className="jornada-numero">4. Direcionar</span>
          <strong>{areasSugeridas.length > 0 ? `${areasSugeridas.length} área(s) para você` : 'Sem áreas sugeridas'}</strong>
          <p>
            {areasSugeridas.length > 0
              ? `Vagas de ${areasSugeridas.slice(0, 2).map((a) => a.area).join(' e ')}, remotas ou em SP.`
              : 'Domine uma disciplina ou responda a Bússola para receber sugestões de vagas.'}
          </p>
          <Link to="/carreiras" className="jornada-link">
            Ver vagas →
          </Link>
        </li>
      </ol>

      {/* 2) Números da aprendizagem e da faculdade */}
      <div className="grade-big-numbers">
        <NumeroDestaque
          valor={resumo.aproveitamentoGeral !== null ? `${resumo.aproveitamentoGeral}%` : '—'}
          legenda="Aproveitamento geral"
          detalhe="acertos ÷ respostas"
        />
        <NumeroDestaque valor={resumo.dominadas} legenda="Disciplinas dominadas" detalhe="60% ou mais" />
        <NumeroDestaque valor={resumo.paraRevisar} legenda="Disciplinas para revisar" detalhe="abaixo de 60%" />
        <NumeroDestaque
          valor={mediaGeral !== null ? mediaGeral.toFixed(1).replace('.', ',') : '—'}
          legenda="Média geral (MD)"
          detalhe="notas da faculdade"
        />
        <NumeroDestaque valor={emAlerta} legenda="Disciplinas em alerta" detalhe="exame, reprovação ou faltas" />
      </div>

      {/* 3) Gráficos de evolução */}
      <div className="grade-graficos">
        <div className="cartao">
          <GraficoBarras
            titulo="Aproveitamento por disciplina (%)"
            itens={dados.desempenho.map((d) => ({ rotulo: d.disciplina, valor: d.aproveitamento }))}
            maximo={100}
            sufixo="%"
            vazio="Pratique uma disciplina para ver seu aproveitamento."
          />
        </div>
        <div className="cartao">
          <GraficoBarras
            titulo="Evolução nas últimas práticas (%)"
            itens={ultimasRodadas}
            maximo={100}
            sufixo="%"
            vazio="Nenhuma prática finalizada ainda."
          />
        </div>
      </div>

      {/* 4) Guru: materiais das disciplinas com aproveitamento abaixo de 60% */}
      <div className="cartao guru" id="guru">
        <h3>
          <Lightbulb size={20} color="#8257e5" /> Guru
        </h3>
        {disciplinasGuru.length === 0 ? (
          <p>
            Nenhuma disciplina para revisar. O Guru indica materiais quando seu aproveitamento fica abaixo de 60% em
            uma disciplina (com pelo menos 5 perguntas respondidas).
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

      {/* 5) Gamificação: motivação extra, não o centro */}
      <div className="cartao evolucao-gamificacao">
        <p>
          <strong>{pontos} pontos</strong>
          {minhaPosicao ? ` · ${minhaPosicao}º lugar no ranking` : ''} · {dados.tentativas.length} prática(s) feita(s)
        </p>
        <Link to="/ranking" className="item-meta">
          Ver o ranking →
        </Link>
      </div>

      {/* 6) Atalhos */}
      <div className="grade-inicio">
        <Link to="/notas" className="atalho">
          <h3>Notas e faltas</h3>
          <p>Registre M1, ND, NI, exame e faltas e veja sua situação na UMC.</p>
        </Link>
        <Link to="/materiais" className="atalho">
          <h3>Materiais</h3>
          <p>Apostilas e links das disciplinas, enviados pelos colegas.</p>
        </Link>
        <Link to="/carreiras" className="atalho">
          <h3>Carreiras</h3>
          <p>Vagas de tecnologia ligadas ao seu desempenho e aos seus interesses.</p>
        </Link>
      </div>
    </>
  )
}
