import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { LETRAS, NIVEIS, type Disciplina, type Letra, type Nivel, type Pergunta } from '../../types'

// Banco de perguntas do quiz (só admin). O gabarito fica na tabela "gabaritos".

type Gabarito = { pergunta_id: number; correta: Letra }

async function consultarDados() {
  const [perguntas, gabaritos, disciplinas] = await Promise.all([
    supabase.from('perguntas').select('*').order('id', { ascending: false }),
    supabase.from('gabaritos').select('*'),
    supabase.from('disciplinas').select('*').order('nome'),
  ])
  const mapaGabaritos: Record<number, Letra> = {}
  for (const g of (gabaritos.data as Gabarito[]) ?? []) mapaGabaritos[g.pergunta_id] = g.correta

  return {
    perguntas: (perguntas.data as Pergunta[]) ?? [],
    gabaritos: mapaGabaritos,
    disciplinas: (disciplinas.data as Disciplina[]) ?? [],
    erro: perguntas.error?.message ?? disciplinas.error?.message ?? '',
  }
}

const ALTERNATIVAS_VAZIAS: Record<Letra, string> = { A: '', B: '', C: '', D: '' }

export default function Perguntas() {
  const [lista, setLista] = useState<Pergunta[]>([])
  const [gabaritos, setGabaritos] = useState<Record<number, Letra>>({})
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(true)

  const [enunciado, setEnunciado] = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [nivel, setNivel] = useState<Nivel>('Fácil')
  const [alternativas, setAlternativas] = useState(ALTERNATIVAS_VAZIAS)
  const [correta, setCorreta] = useState<Letra | ''>('')

  async function buscar() {
    const dados = await consultarDados()
    setLista(dados.perguntas)
    setGabaritos(dados.gabaritos)
    setDisciplinas(dados.disciplinas)
    setErro(dados.erro)
  }

  useEffect(() => {
    consultarDados().then((dados) => {
      setLista(dados.perguntas)
      setGabaritos(dados.gabaritos)
      setDisciplinas(dados.disciplinas)
      setErro(dados.erro)
      setCarregando(false)
    })
  }, [])

  function mudarAlternativa(letra: Letra, texto: string) {
    setAlternativas((atual) => ({ ...atual, [letra]: texto }))
  }

  function validar(): string | null {
    if (enunciado.trim().length < 10) return 'O enunciado precisa ter pelo menos 10 caracteres.'
    if (enunciado.length > 500) return 'O enunciado pode ter no máximo 500 caracteres.'
    if (!disciplinaId) return 'Escolha a disciplina.'
    const textos = LETRAS.map((l) => alternativas[l].trim())
    if (textos.some((t) => t === '')) return 'Preencha as quatro alternativas.'
    if (new Set(textos.map((t) => t.toLowerCase())).size < 4) return 'As quatro alternativas precisam ser diferentes.'
    if (!correta) return 'Marque qual alternativa é a correta.'
    return null
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setMensagem('')

    const problema = validar()
    if (problema) {
      setErro(problema)
      return
    }

    const { error } = await supabase.rpc('criar_pergunta', {
      p_enunciado: enunciado.trim(),
      p_disciplina_id: Number(disciplinaId),
      p_nivel: nivel,
      p_alternativa_a: alternativas.A.trim(),
      p_alternativa_b: alternativas.B.trim(),
      p_alternativa_c: alternativas.C.trim(),
      p_alternativa_d: alternativas.D.trim(),
      p_correta: correta,
    })

    if (error) {
      setErro(error.message)
      return
    }

    setEnunciado('')
    setAlternativas(ALTERNATIVAS_VAZIAS)
    setCorreta('')
    setMensagem('Pergunta cadastrada.')
    buscar()
  }

  async function excluir(id: number) {
    if (!window.confirm('Excluir esta pergunta? Ela sai do quiz e do histórico de respostas.')) return
    const { error } = await supabase.from('perguntas').delete().eq('id', id)
    if (error) setErro(error.message)
    else buscar()
  }

  function nomeDisciplina(id: number | null) {
    return disciplinas.find((d) => d.id === id)?.nome ?? null
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Perguntas</h2>
        <p>
          Banco de questões do quiz. Cada pergunta tem 4 alternativas e uma correta. Os alunos nunca
          veem o gabarito: a correção é feita no banco de dados.
        </p>
      </header>

      <div className="cartao">
        <form onSubmit={salvar} className="pergunta-form">
          <textarea
            className="campo campo-texto"
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            placeholder="Enunciado da pergunta"
            maxLength={500}
          />
          <div className="form-linha">
            <select className="campo" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
              <option value="">Disciplina...</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} ({d.curso})
                </option>
              ))}
            </select>
            <select className="campo" value={nivel} onChange={(e) => setNivel(e.target.value as Nivel)}>
              {NIVEIS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {LETRAS.map((letra) => (
            <label key={letra} className="pergunta-alternativa">
              <input
                type="radio"
                name="correta"
                checked={correta === letra}
                onChange={() => setCorreta(letra)}
                title="Marcar como correta"
              />
              <strong>{letra})</strong>
              <input
                className="campo"
                value={alternativas[letra]}
                onChange={(e) => mudarAlternativa(letra, e.target.value)}
                placeholder={`Alternativa ${letra}`}
              />
            </label>
          ))}
          <p className="item-meta">Marque a bolinha da alternativa correta.</p>

          <button type="submit" className="btn btn-primario">
            Adicionar pergunta
          </button>
        </form>

        {erro ? <p className="aviso erro">{erro}</p> : null}
        {mensagem ? <p className="aviso sucesso">{mensagem}</p> : null}
        {carregando ? <p className="status">Carregando...</p> : null}

        {!carregando && lista.length === 0 ? (
          <p className="vazio">Nenhuma pergunta cadastrada ainda.</p>
        ) : (
          <ul className="lista">
            {lista.map((item) => {
              const gabarito = gabaritos[item.id]
              const completa = !!gabarito && item.disciplina_id !== null
              return (
                <li key={item.id} className="item-lista">
                  <div>
                    <strong>{item.enunciado}</strong>
                    <span className="item-meta">
                      {nomeDisciplina(item.disciplina_id) ?? 'Sem disciplina'}
                      <span className="selo">{item.nivel}</span>
                      {completa ? (
                        <span className="selo">Correta: {gabarito}</span>
                      ) : (
                        <span className="selo selo-alerta">Incompleta — não entra no quiz</span>
                      )}
                    </span>
                  </div>
                  <button type="button" className="btn btn-perigo" onClick={() => excluir(item.id)}>
                    Excluir
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
