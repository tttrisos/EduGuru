// ============================================================
// funcionalidades/4_estudar/ranking/Ranking.tsx
// RANKING (endereço /ranking) — RF18. Geral ou por disciplina: top 10 + a posição do aluno.
// Banco: ranking (supabase/11, recriada no 27). Nome abreviado ou "Aluno anônimo" (opção em Minha
// conta). Só o administrador vê quem é o anônimo: "Aluno anônimo (Nome Completo)".
// ============================================================

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { supabase } from '../../../compartilhado/banco/supabase'
import { cursosDa, type Disciplina, type LinhaRanking } from '../../../compartilhado/tipos'
import './ranking.css'

// Ranking (RF18): top 10 geral ou por disciplina, calculado no banco.

async function consultarRanking(disciplinaId: string) {
  return await supabase.rpc('ranking', {
    p_disciplina_id: disciplinaId ? Number(disciplinaId) : null,
  })
}

export default function Ranking() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [disciplinaId, setDisciplinaId] = useState('')
  const [linhas, setLinhas] = useState<LinhaRanking[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase
      .from('disciplinas')
      .select('*')
      .order('nome')
      .then(({ data }) => setDisciplinas((data as Disciplina[]) ?? []))
  }, [])

  useEffect(() => {
    consultarRanking(disciplinaId).then(({ data, error }) => {
      if (error) setErro(error.message)
      else {
        setErro('')
        setLinhas((data as LinhaRanking[]) ?? [])
      }
      setCarregando(false)
    })
  }, [disciplinaId])

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Ranking</h2>
        <p>Classificação pela soma dos pontos ganhos nos quizzes.</p>
        <p className="pagina-fatos">
          <span>Aparece só o nome abreviado (ex.: Maria S.)</span>
          <span>
            Para não aparecer, desmarque a opção em <Link to="/minha-conta">Meus dados e privacidade</Link>
          </span>
        </p>
      </header>

      <div className="cartao">
        <div className="form-linha">
          <select className="campo" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
            <option value="">Ranking geral (todas as disciplinas)</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome} ({cursosDa(d).join('/')})
              </option>
            ))}
          </select>
        </div>

        {erro ? <p className="aviso erro">{erro}</p> : null}
        {carregando ? <p className="status">Carregando...</p> : null}

        {!carregando && linhas.length === 0 ? (
          <p className="vazio">Ninguém pontuou ainda. Faça um quiz e seja o primeiro!</p>
        ) : (
          <table className="tabela ranking">
            <thead>
              <tr>
                <th>Posição</th>
                <th>Aluno</th>
                <th className="numero">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={i} className={l.eh_voce ? 'voce' : ''}>
                  <td>
                    {l.posicao <= 3 ? <Trophy size={16} color="#8257e5" /> : null} {l.posicao}º
                  </td>
                  <td>
                    {l.nome}
                    {l.eh_voce ? <span className="selo">Você</span> : null}
                  </td>
                  <td className="numero">{l.pontos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
