import { useEffect, useState } from 'react'
import { supabase } from '../../compartilhado/supabase'
import { CURSOS, type Disciplina } from '../../compartilhado/tipos'
import { useAuth } from '../../compartilhado/AuthContext'

async function consultarDisciplinas() {
  return await supabase.from('disciplinas').select('*').order('nome')
}

export default function Disciplinas() {
  const { ehAdmin, perfil } = useAuth()
  const [lista, setLista] = useState<Disciplina[]>([])
  const [nome, setNome] = useState('')
  const [curso, setCurso] = useState('SI')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  // Filtro por curso: o aluno começa vendo as disciplinas do próprio curso.
  const [filtro, setFiltro] = useState(!ehAdmin && perfil?.curso ? perfil.curso : 'todos')

  async function buscar() {
    try {
      const { data, error } = await consultarDisciplinas()

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
    consultarDisciplinas()
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setLista((data as Disciplina[]) ?? [])
      })
      .catch(() => setErro('Não foi possível conectar ao banco.'))
      .finally(() => setCarregando(false))
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setErro('Digite o nome da disciplina.')
      return
    }
    if (lista.some((d) => d.curso === curso && d.nome.trim().toLowerCase() === nome.trim().toLowerCase())) {
      setErro('Já existe uma disciplina com esse nome neste curso.')
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
    if (!window.confirm('Excluir esta disciplina? As perguntas e as notas ligadas a ela também serão apagadas.')) return
    const { error } = await supabase.from('disciplinas').delete().eq('id', id)
    if (error) setErro(error.message)
    else buscar()
  }

  function nomeCurso(sigla: string) {
    return CURSOS.find((c) => c.valor === sigla)?.label ?? sigla
  }

  const filtradas = filtro === 'todos' ? lista : lista.filter((d) => d.curso === filtro)
  const opcoesFiltro = [
    { valor: 'todos', label: 'Todos os cursos', total: lista.length },
    ...CURSOS.map((c) => ({ ...c, total: lista.filter((d) => d.curso === c.valor).length })),
  ]

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Disciplinas</h2>
        <p>
          {ehAdmin
            ? 'Cadastro das matérias de cada curso. Perguntas, materiais, notas e o quiz são ligados a elas.'
            : 'Lista das matérias cadastradas pela coordenação. Apenas administradores podem adicionar ou remover.'}
        </p>
      </header>

      <div className="abas" role="tablist" aria-label="Filtrar por curso">
        {opcoesFiltro.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            role="tab"
            aria-selected={filtro === opcao.valor}
            className={`aba${filtro === opcao.valor ? ' ativa' : ''}`}
            onClick={() => setFiltro(opcao.valor)}
          >
            {opcao.label} ({opcao.total})
          </button>
        ))}
      </div>

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

        {!carregando && filtradas.length === 0 ? (
          <p className="vazio">
            {lista.length === 0 ? 'Nenhuma disciplina cadastrada ainda.' : 'Nenhuma disciplina neste curso.'}
          </p>
        ) : (
          <ul className="lista">
            {filtradas.map((item) => (
              <li key={item.id} className="item-lista">
                <div>
                  <strong>{item.nome}</strong>
                  <span className="item-meta">
                    {nomeCurso(item.curso)}
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
