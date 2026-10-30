import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import { supabase } from '../../supabase'
import {
  LETRAS,
  PONTOS_POR_NIVEL,
  type CorrecaoQuiz,
  type Disciplina,
  type Letra,
  type Material,
  type QuestaoQuiz,
} from '../../types'

// Quiz (RF25, RF26, RF28): escolher disciplina, responder e ver o resultado.
// Sorteio, correção e pontos são feitos no banco (iniciar_quiz e finalizar_quiz).

// Abaixo deste aproveitamento o Guru indica materiais.
const APROVEITAMENTO_MINIMO = 60

type Etapa = 'escolher' | 'responder' | 'resultado'

function textoAlternativa(questao: QuestaoQuiz, letra: Letra) {
  const mapa = {
    A: questao.alternativa_a,
    B: questao.alternativa_b,
    C: questao.alternativa_c,
    D: questao.alternativa_d,
  }
  return mapa[letra]
}

export default function Quiz() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [disciplinaId, setDisciplinaId] = useState('')
  const [etapa, setEtapa] = useState<Etapa>('escolher')
  const [questoes, setQuestoes] = useState<QuestaoQuiz[]>([])
  const [respostas, setRespostas] = useState<Record<number, Letra>>({})
  const [correcao, setCorrecao] = useState<CorrecaoQuiz[]>([])
  const [materiaisGuru, setMateriaisGuru] = useState<Material[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    supabase
      .from('disciplinas')
      .select('*')
      .order('nome')
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setDisciplinas((data as Disciplina[]) ?? [])
      })
  }, [])

  async function comecar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!disciplinaId) {
      setErro('Escolha uma disciplina para começar.')
      return
    }

    setCarregando(true)
    const { data, error } = await supabase.rpc('iniciar_quiz', { p_disciplina_id: Number(disciplinaId) })
    setCarregando(false)

    if (error) {
      setErro(error.message)
      return
    }
    setQuestoes((data as QuestaoQuiz[]) ?? [])
    setRespostas({})
    setEtapa('responder')
  }

  function escolher(perguntaId: number, letra: Letra) {
    setRespostas((atual) => ({ ...atual, [perguntaId]: letra }))
  }

  async function finalizar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const faltando = questoes.filter((q) => !respostas[q.pergunta_id]).length
    if (faltando > 0) {
      setErro(`Falta responder ${faltando} pergunta(s).`)
      return
    }

    setCarregando(true)
    const { data, error } = await supabase.rpc('finalizar_quiz', {
      p_tentativa_id: questoes[0].tentativa_id,
      p_respostas: respostas,
    })

    if (error) {
      setCarregando(false)
      setErro(error.message)
      return
    }

    const resultado = (data as CorrecaoQuiz[]) ?? []
    const acertos = resultado.filter((c) => c.acertou).length
    const aproveitamento = Math.round((acertos / resultado.length) * 100)

    if (aproveitamento < APROVEITAMENTO_MINIMO) {
      const { data: materiais } = await supabase
        .from('materiais')
        .select('*')
        .eq('disciplina_id', Number(disciplinaId))
        .order('titulo')
      setMateriaisGuru((materiais as Material[]) ?? [])
    } else {
      setMateriaisGuru([])
    }

    setCorrecao(resultado)
    setCarregando(false)
    setEtapa('resultado')
  }

  function jogarDeNovo() {
    setEtapa('escolher')
    setQuestoes([])
    setCorrecao([])
    setErro('')
  }

  const nomeDisciplina = disciplinas.find((d) => String(d.id) === disciplinaId)?.nome ?? ''

  // 1) Escolher a disciplina
  if (etapa === 'escolher') {
    return (
      <section className="pagina">
        <header className="pagina-topo">
          <h2>Quiz</h2>
          <p>
            Escolha uma disciplina e responda até 10 perguntas sorteadas. Cada acerto vale pontos
            conforme o nível: Fácil {PONTOS_POR_NIVEL['Fácil']}, Médio {PONTOS_POR_NIVEL['Médio']} e
            Difícil {PONTOS_POR_NIVEL['Difícil']}. A pergunta só pontua na primeira vez que você
            acerta — repetir o quiz serve para revisar.
          </p>
        </header>

        <div className="cartao">
          <form onSubmit={comecar} className="form-linha">
            <select className="campo" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
              <option value="">Escolha a disciplina...</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} ({d.curso})
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primario" disabled={carregando}>
              {carregando ? 'Sorteando...' : 'Começar quiz'}
            </button>
          </form>
          {erro ? <p className="aviso erro">{erro}</p> : null}
        </div>
      </section>
    )
  }

  // 2) Responder
  if (etapa === 'responder') {
    const respondidas = Object.keys(respostas).length
    return (
      <section className="pagina">
        <header className="pagina-topo">
          <h2>Quiz — {nomeDisciplina}</h2>
          <p>
            {respondidas} de {questoes.length} respondidas. Você tem 30 minutos para finalizar.
          </p>
        </header>

        <form onSubmit={finalizar} className="quiz-form">
          {questoes.map((q, i) => (
            <fieldset key={q.pergunta_id} className="cartao quiz-questao">
              <legend>
                {i + 1}. {q.enunciado}
                <span className="selo">{q.nivel}</span>
              </legend>
              {LETRAS.map((letra) => (
                <label
                  key={letra}
                  className={`quiz-alternativa${respostas[q.pergunta_id] === letra ? ' marcada' : ''}`}
                >
                  <input
                    type="radio"
                    name={`pergunta-${q.pergunta_id}`}
                    checked={respostas[q.pergunta_id] === letra}
                    onChange={() => escolher(q.pergunta_id, letra)}
                  />
                  <strong>{letra})</strong> {textoAlternativa(q, letra)}
                </label>
              ))}
            </fieldset>
          ))}

          {erro ? <p className="aviso erro">{erro}</p> : null}
          <button type="submit" className="btn btn-primario btn-grande" disabled={carregando}>
            {carregando ? 'Corrigindo...' : 'Finalizar e ver resultado'}
          </button>
        </form>
      </section>
    )
  }

  // 3) Resultado
  const acertos = correcao.filter((c) => c.acertou).length
  const pontos = correcao.reduce((soma, c) => soma + c.pontos, 0)
  const aproveitamento = Math.round((acertos / correcao.length) * 100)

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Resultado — {nomeDisciplina}</h2>
        <p>
          Você acertou <strong>{acertos}</strong> de {correcao.length} ({aproveitamento}%) e ganhou{' '}
          <strong>{pontos} pontos</strong>.
          {pontos === 0 && acertos > 0 ? ' (Essas perguntas já tinham sido acertadas antes.)' : ''}
        </p>
      </header>

      {aproveitamento < APROVEITAMENTO_MINIMO ? (
        <div className="cartao guru">
          <h3>
            <Lightbulb size={20} color="#8257e5" /> Dica do Guru
          </h3>
          <p>
            Seu aproveitamento ficou abaixo de {APROVEITAMENTO_MINIMO}%. Que tal revisar com estes
            materiais de {nomeDisciplina}?
          </p>
          {materiaisGuru.length === 0 ? (
            <p className="vazio">Ainda não há materiais desta disciplina. Que tal enviar um?</p>
          ) : (
            <ul>
              {materiaisGuru.map((m) => (
                <li key={m.id}>{m.titulo}</li>
              ))}
            </ul>
          )}
          <Link to="/materiais" className="btn btn-secundario">
            Ir para Materiais
          </Link>
        </div>
      ) : null}

      <ul className="lista">
        {correcao.map((c, i) => {
          const questao = questoes.find((q) => q.pergunta_id === c.pergunta_id)
          if (!questao) return null
          return (
            <li key={c.pergunta_id} className={`item-lista quiz-correcao ${c.acertou ? 'acerto' : 'erro'}`}>
              <div>
                <strong>
                  {c.acertou ? '✅' : '❌'} {i + 1}. {questao.enunciado}
                </strong>
                <span className="item-meta">
                  Sua resposta: {c.resposta ? `${c.resposta}) ${textoAlternativa(questao, c.resposta)}` : '—'}
                  {!c.acertou ? ` · Correta: ${c.gabarito}) ${textoAlternativa(questao, c.gabarito)}` : ''}
                  {c.pontos > 0 ? ` · +${c.pontos} pontos` : ''}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="form-linha quiz-acoes">
        <button type="button" className="btn btn-primario" onClick={jogarDeNovo}>
          Jogar de novo
        </button>
        <Link to="/ranking" className="btn btn-secundario">
          Ver ranking
        </Link>
      </div>
    </section>
  )
}
