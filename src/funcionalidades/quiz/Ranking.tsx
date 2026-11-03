import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { supabase } from '../../compartilhado/supabase'
import type { Disciplina, LinhaRanking } from '../../compartilhado/tipos'
import './quiz.css'

// Ranking (RF27): top 10 geral ou por disciplina, calculado no banco.

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
        <p>
          Soma dos pontos ganhos nos quizzes. Aparecem só o primeiro nome e a inicial do sobrenome;
          se preferir não aparecer, desmarque a opção em <Link to="/minha-conta">Minha conta</Link>.
        </p>
      </header>

      <div className="cartao">
        <div className="form-linha">
          <select className="campo" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
            <option value="">Ranking geral (todas as disciplinas)</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome} ({d.curso})
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
