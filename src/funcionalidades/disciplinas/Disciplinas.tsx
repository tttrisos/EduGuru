import { useEffect, useState } from 'react'
import { useDialogo } from '../../compartilhado/Dialogo'
import { supabase } from '../../compartilhado/supabase'
import { CURSOS, cursosDa, type Disciplina } from '../../compartilhado/tipos'
import { useAuth } from '../../compartilhado/AuthContext'

async function consultarDisciplinas() {
  return await supabase.from('disciplinas').select('*').order('nome')
}

export default function Disciplinas() {
  const { confirmar } = useDialogo()
  const { ehAdmin, perfil } = useAuth()
  const [lista, setLista] = useState<Disciplina[]>([])
  const [nome, setNome] = useState('')
  // Cursos que têm a disciplina na grade (pode ser mais de um).
  const [cursos, setCursos] = useState<string[]>(['SI'])
  const [erro, setErro] = useState('')
  // Id da disciplina em edição (null = cadastrando uma nova).
  const [editandoId, setEditandoId] = useState<number | null>(null)
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
    if (cursos.length === 0) {
      setErro('Marque pelo menos um curso.')
      return
    }
    // A disciplina é cadastrada uma vez só, mesmo quando é de mais de um curso.
    const repetida = lista.some(
      (d) => d.id !== editandoId && d.nome.trim().toLowerCase() === nome.trim().toLowerCase(),
    )
    if (repetida) {
      setErro('Já existe uma disciplina com esse nome. Para incluí-la em outro curso, edite-a e marque o curso.')
      return
    }
    // Mantém a ordem SI, ADS, ES; o primeiro vira o "curso" principal.
    const ordenados = CURSOS.map((c) => c.valor).filter((c) => cursos.includes(c))
    const dados = { nome: nome.trim(), curso: ordenados[0], cursos: ordenados }
    const { error } = editandoId
      ? await supabase.from('disciplinas').update(dados).eq('id', editandoId)
      : await supabase.from('disciplinas').insert([dados])

    if (error) {
      setErro(error.message)
      return
    }

    cancelarEdicao()
    buscar()
  }

  function editar(item: Disciplina) {
    setEditandoId(item.id)
    setNome(item.nome)
    setCursos(cursosDa(item))
    setErro('')
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setNome('')
    setCursos(['SI'])
  }

  async function excluir(item: Disciplina) {
    const ok = await confirmar({
      titulo: `Excluir a disciplina "${item.nome}"?`,
      mensagem: 'As perguntas e as notas ligadas a ela também serão apagadas. Isso não pode ser desfeito.',
      textoConfirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    const { error } = await supabase.from('disciplinas').delete().eq('id', item.id)
    if (error) setErro(error.message)
    else buscar()
  }

  function nomeCurso(sigla: string) {
    return CURSOS.find((c) => c.valor === sigla)?.label ?? sigla
  }

  function marcarCurso(sigla: string) {
    setCursos((atual) => (atual.includes(sigla) ? atual.filter((c) => c !== sigla) : [...atual, sigla]))
  }

  const filtradas = filtro === 'todos' ? lista : lista.filter((d) => cursosDa(d).includes(filtro))
  const opcoesFiltro = [
    { valor: 'todos', label: 'Todos os cursos', total: lista.length },
    ...CURSOS.map((c) => ({ ...c, total: lista.filter((d) => cursosDa(d).includes(c.valor)).length })),
  ]

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Disciplinas</h2>
        <p>
          {ehAdmin
            ? 'Cadastro das matérias de cada curso. Perguntas, materiais, notas e o quiz são ligados a elas.'
            : 'Lista das matérias cadastradas pela coordenação. Apenas administradores podem adicionar, editar ou remover.'}
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
            <fieldset className="cursos-disciplina">
              <legend>Cursos que têm esta disciplina</legend>
              {CURSOS.map((c) => (
                <label key={c.valor} title={c.label}>
                  <input type="checkbox" checked={cursos.includes(c.valor)} onChange={() => marcarCurso(c.valor)} />{' '}
                  {c.valor}
                </label>
              ))}
            </fieldset>
            <button type="submit" className="btn btn-primario">
              {editandoId ? 'Salvar alterações' : 'Salvar'}
            </button>
            {editandoId ? (
              <button type="button" className="btn btn-secundario" onClick={cancelarEdicao}>
                Cancelar
              </button>
            ) : null}
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
                    {cursosDa(item).map(nomeCurso).join(' · ')}
                  </span>
                </div>
                {ehAdmin ? (
                  <div className="acoes-item">
                    <button type="button" className="btn btn-secundario" onClick={() => editar(item)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-perigo" onClick={() => excluir(item)}>
                      Excluir
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
