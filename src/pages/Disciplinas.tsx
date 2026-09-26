import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { CURSOS, type Disciplina } from '../types'
import { useAuth } from '../contexts/AuthContext'

export default function Disciplinas() {
  const { ehAdmin } = useAuth()
  const [lista, setLista] = useState<Disciplina[]>([])
  const [nome, setNome] = useState('')
  const [curso, setCurso] = useState('SI')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  async function buscar() {
    try {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('*')
        .order('id', { ascending: false })

      if (error) setErro(error.message)
      else {
        setLista((data as Disciplina[]) ?? [])
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
    if (!nome.trim()) {
      setErro('Digite o nome da disciplina.')
      return
    }

    const { error } = await supabase
      .from('disciplinas')
      .insert([{ nome: nome.trim(), curso }])

    if (error) {
      setErro(error.message)
      return
    }

    setNome('')
    buscar()
  }

  async function excluir(id: number) {
    const { error } = await supabase.from('disciplinas').delete().eq('id', id)
    if (error) setErro(error.message)
    else buscar()
  }

  function nomeCurso(sigla: string) {
    return CURSOS.find((c) => c.valor === sigla)?.label ?? sigla
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Disciplinas</h2>
        <p>
          {ehAdmin
            ? 'Cadastro das matérias de cada curso. Perguntas e materiais vão se ligar a elas na próxima etapa.'
            : 'Lista das matérias cadastradas pela coordenação. Apenas administradores podem adicionar ou remover.'}
        </p>
      </header>

      <div className="cartao">
        {ehAdmin ? (
          <form onSubmit={salvar} className="form-linha">
            <input
              className="campo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da disciplina"
            />
            <select className="campo" value={curso} onChange={(e) => setCurso(e.target.value)}>
              {CURSOS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primario">
              Salvar
            </button>
          </form>
        ) : null}

        {erro ? <p className="aviso erro">{erro}</p> : null}
        {carregando ? <p className="status">Carregando...</p> : null}

        {!carregando && lista.length === 0 ? (
          <p className="vazio">Nenhuma disciplina cadastrada ainda.</p>
        ) : (
          <ul className="lista">
            {lista.map((item) => (
              <li key={item.id} className="item-lista">
                <div>
                  <strong>{item.nome}</strong>
                  <span className="item-meta">{nomeCurso(item.curso)}</span>
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
