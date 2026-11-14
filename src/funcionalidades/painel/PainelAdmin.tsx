import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { supabase } from '../../compartilhado/supabase'
import BigNumber from '../../compartilhado/BigNumber'
import GraficoBarras from '../../compartilhado/GraficoBarras'
import type { EstatisticasAdmin, EstatisticasBussola, EstatisticasCarreiras } from '../../compartilhado/tipos'

// ============================================================
// Painel do administrador (RF25): números gerais da plataforma, nunca dados de um aluno.
//   - estatisticas_admin()      → supabase/12_notas_e_painel.sql (alunos, quizzes, acertos)
//   - estatisticas_carreiras()  → supabase/17_carreiras.sql (cliques em "Candidatar-se")
//   - estatisticas_bussola()    → supabase/18_bussola.sql (quantos responderam, área preferida)
// Todas conferem no banco se quem chama é admin com verificação em duas etapas.
// ============================================================

export default function PainelAdmin() {
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

      <PainelCarreiras />

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

// EduGuru Carreiras: cliques em "Candidatar-se" (sem identificar quem clicou).
function PainelCarreiras() {
  const [dados, setDados] = useState<EstatisticasCarreiras | null>(null)
  const [bussola, setBussola] = useState<EstatisticasBussola | null>(null)

  useEffect(() => {
    // Se os scripts 17 e 18 ainda não foram rodados, a seção (ou a parte da Bússola) não aparece.
    supabase.rpc('estatisticas_carreiras').then(({ data, error }) => {
      if (!error && data) setDados(data as EstatisticasCarreiras)
    })
    supabase.rpc('estatisticas_bussola').then(({ data, error }) => {
      if (!error && data) setBussola(data as EstatisticasBussola)
    })
  }, [])

  if (!dados) return null

  return (
    <div className="cartao painel-carreiras">
      <h3>
        <Briefcase size={20} color="#8257e5" aria-hidden="true" /> Carreiras
      </h3>
      <div className="grade-big-numbers">
        <BigNumber valor={dados.cliques} legenda='Cliques em "Candidatar-se"' detalhe="um por aluno e vaga" />
        <BigNumber valor={dados.cliques_30_dias} legenda="Cliques nos últimos 30 dias" />
        <BigNumber valor={dados.alunos_que_clicaram} legenda="Alunos que abriram vagas" />
        {bussola ? <BigNumber valor={bussola.respondidas} legenda="Bússolas respondidas" detalhe="autoavaliação de interesses" /> : null}
      </div>
      <div className="grade-graficos">
        <GraficoBarras
          titulo="Cliques por área"
          itens={dados.cliques_por_area.map((c) => ({ rotulo: c.area, valor: c.total }))}
          vazio="Nenhum clique registrado ainda."
        />
        <GraficoBarras
          titulo="Vagas mais abertas"
          itens={dados.vagas_mais_clicadas.map((v) => ({ rotulo: v.titulo, valor: v.total }))}
          vazio="Nenhum clique registrado ainda."
        />
        {bussola ? (
          <GraficoBarras
            titulo="Área de maior interesse na Bússola (alunos)"
            itens={bussola.area_preferida.map((a) => ({ rotulo: a.area, valor: a.total }))}
            vazio="Nenhuma Bússola respondida ainda."
          />
        ) : null}
      </div>
      <Link to="/carreiras" className="item-meta">
        Ver as vagas no Carreiras →
      </Link>
    </div>
  )
}
