import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { CURSOS, type Pergunta } from '../types'
import { useAuth } from '../contexts/AuthContext'

const NIVEIS = ['Fácil', 'Médio', 'Difícil']

export default function Perguntas() {
  const { ehAdmin } = useAuth()
  const [lista, setLista] = useState<Pergunta[]>([])
  const [enunciado, setEnunciado] = useState('')
  const [disciplina, setDisciplina] = useState('SI')
  const [nivel, setNivel] = useState('Fácil')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  async function buscar() {
    try {
      const { data, error } = await supabase
        .from('perguntas')
        .select('*')
        .order('id', { ascending: false })

      if (error) setErro(error.message)
      else {
        setLista((data as Pergunta[]) ?? [])
        setErro('')
      }
    } catch {
      setErro('Não foi possível conectar ao banco.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!enunciado.trim()) {
      setErro('Digite o enunciado da pergunta.')
      return
    }

    const { error } = await supabase
      .from('perguntas')
      .insert([{ enunciado: enunciado.trim(), disciplina, nivel }])

    if (error) {
      setErro(error.message)
      return
    }

    setEnunciado('')
    buscar()
  }

  async function excluir(id: number) {
    const { error } = await supabase.from('perguntas').delete().eq('id', id)
    if (error) setErro(error.message)
    else buscar()
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Perguntas</h2>
        <p>
          {ehAdmin
            ? 'Banco de questões do quiz. O campo de curso ainda é um texto — vira FK de disciplina depois.'
            : 'Banco de questões do quiz. Somente administradores cadastram novas perguntas.'}
        </p>
      </header>

      <div className="cartao">
        {ehAdmin ? (
          <form onSubmit={salvar} className="form-linha">
            <input
              className="campo"
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              placeholder="Enunciado da pergunta"
            />
            <select
              className="campo"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
            >
              {CURSOS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.label}
                </option>
              ))}
            </select>
            <select className="campo" value={nivel} onChange={(e) => setNivel(e.target.value)}>
              {NIVEIS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primario">
              Adicionar
            </button>
          </form>
        ) : null}

        {erro ? <p className="aviso erro">{erro}</p> : null}
        {carregando ? <p className="status">Carregando...</p> : null}

        {!carregando && lista.length === 0 ? (
          <p className="vazio">Nenhuma pergunta cadastrada ainda.</p>
        ) : (
          <ul className="lista">
            {lista.map((item) => (
              <li key={item.id} className="item-lista">
                <div>
                  <strong>{item.enunciado}</strong>
                  <span className="item-meta">
                    {item.disciplina}
                    <span className="selo">{item.nivel}</span>
                  </span>
                </div>
                {ehAdmin ? (
                  <button type="button" className="btn btn-perigo" onClick={() => excluir(item.id)}>
                    Excluir
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
