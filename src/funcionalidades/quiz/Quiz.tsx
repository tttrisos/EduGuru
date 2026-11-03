import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Flame, Lightbulb, X } from 'lucide-react'
import { supabase } from '../../compartilhado/supabase'
import { useAuth } from '../../compartilhado/AuthContext'
import BigNumber from '../../compartilhado/BigNumber'
import TextoRico from '../../compartilhado/TextoRico'
import { gerarLinksArquivos } from '../../compartilhado/arquivos'
import {
  LETRAS,
  PONTOS_POR_NIVEL,
  type CorrecaoQuiz,
  type Disciplina,
  type Letra,
  type Material,
  type QuestaoQuiz,
  type RespostaPergunta,
} from '../../compartilhado/tipos'
import './quiz.css'

// Quiz (RF25, RF26, RF28): uma pergunta por vez, com a correção logo depois de responder.
// Sorteio, correção e pontos são feitos no banco (iniciar_quiz, responder_pergunta e finalizar_quiz).

// Abaixo deste aproveitamento o Guru indica materiais.
const APROVEITAMENTO_MINIMO = 60

const ELOGIOS = ['Mandou bem!', 'Isso aí!', 'Excelente!', 'Na mosca!', 'Muito bom!']
const INCENTIVOS = ['Quase!', 'Não foi dessa vez.', 'Vale revisar esta.', 'Errar também ensina.']

type Etapa = 'escolher' | 'jogar' | 'resultado'
type Feedback = RespostaPergunta & { mensagem: string }

function textoAlternativa(questao: QuestaoQuiz, letra: Letra) {
  const mapa = {
    A: questao.alternativa_a,
    B: questao.alternativa_b,
    C: questao.alternativa_c,
    D: questao.alternativa_d,
  }
  return mapa[letra]
}

function sortear(frases: string[]) {
  return frases[Math.floor(Math.random() * frases.length)]
}

function tituloResultado(aproveitamento: number) {
  if (aproveitamento === 100) return 'Perfeito!'
  if (aproveitamento >= 80) return 'Excelente!'
  if (aproveitamento >= APROVEITAMENTO_MINIMO) return 'Bom trabalho!'
  return 'Continue praticando!'
}

export default function Quiz() {
  const { perfil } = useAuth()
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [perguntasPorDisciplina, setPerguntasPorDisciplina] = useState<Record<number, number>>({})
  const [disciplinaId, setDisciplinaId] = useState<number | null>(null)
  const [etapa, setEtapa] = useState<Etapa>('escolher')
  const [questoes, setQuestoes] = useState<QuestaoQuiz[]>([])
  const [atual, setAtual] = useState(0)
  const [escolhida, setEscolhida] = useState<Letra | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [sequencia, setSequencia] = useState(0)
  const [melhorSequencia, setMelhorSequencia] = useState(0)
  const [imagens, setImagens] = useState<Record<string, string>>({})
  const [explicacoes, setExplicacoes] = useState<Record<number, string>>({})
  const [correcao, setCorrecao] = useState<CorrecaoQuiz[]>([])
  const [materiaisGuru, setMateriaisGuru] = useState<Material[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('disciplinas').select('*').order('nome'),
      supabase.from('perguntas').select('disciplina_id').not('alternativa_a', 'is', null),
    ]).then(([lista, perguntas]) => {
      if (lista.error) {
        setErro(lista.error.message)
        return
      }
      setDisciplinas((lista.data as Disciplina[]) ?? [])
      const contagem: Record<number, number> = {}
      for (const p of perguntas.data ?? []) {
        if (p.disciplina_id) contagem[p.disciplina_id] = (contagem[p.disciplina_id] ?? 0) + 1
      }
      setPerguntasPorDisciplina(contagem)
    })
  }, [])

  // Atalhos: 1 a 4 (ou A a D) escolhem a alternativa; Enter verifica ou continua.
  useEffect(() => {
    if (etapa !== 'jogar') return
    function aoTeclar(e: KeyboardEvent) {
      if (e.target instanceof HTMLButtonElement) return
      const tecla = e.key.toUpperCase()
      const indice = ['1', '2', '3', '4'].indexOf(tecla)
      if (!feedback && (indice >= 0 || LETRAS.includes(tecla as Letra))) {
        setEscolhida(indice >= 0 ? LETRAS[indice] : (tecla as Letra))
      } else if (e.key === 'Enter') {
        if (feedback) continuar()
        else verificar()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  })

  async function comecar(id: number) {
    setErro('')
    setDisciplinaId(id)
    setCarregando(true)
    const { data, error } = await supabase.rpc('iniciar_quiz', { p_disciplina_id: id })
    setCarregando(false)

    if (error) {
      setErro(error.message)
      return
    }
    const sorteadas = (data as QuestaoQuiz[]) ?? []
    const caminhos = sorteadas.map((q) => q.imagem_path).filter((c): c is string => !!c)
    setImagens(await gerarLinksArquivos(caminhos, 'perguntas'))
    setExplicacoes({})
    setQuestoes(sorteadas)
    setAtual(0)
    setEscolhida(null)
    setFeedback(null)
    setSequencia(0)
    setMelhorSequencia(0)
    setCorrecao([])
    setMateriaisGuru([])
    setEtapa('jogar')
  }

  async function verificar() {
    if (!escolhida || feedback || carregando) return
    const questao = questoes[atual]
    setErro('')
    setCarregando(true)
    const { data, error } = await supabase.rpc('responder_pergunta', {
      p_tentativa_id: questao.tentativa_id,
      p_pergunta_id: questao.pergunta_id,
      p_resposta: escolhida,
    })
    setCarregando(false)

    if (error) {
      setErro(error.message)
      return
    }
    const resultado = (data as RespostaPergunta[])[0]
    const novaSequencia = resultado.acertou ? sequencia + 1 : 0
    setSequencia(novaSequencia)
    setMelhorSequencia((melhor) => Math.max(melhor, novaSequencia))
    if (resultado.explicacao) {
      setExplicacoes((atuais) => ({ ...atuais, [questao.pergunta_id]: resultado.explicacao as string }))
    }
    setFeedback({ ...resultado, mensagem: sortear(resultado.acertou ? ELOGIOS : INCENTIVOS) })
  }

  async function continuar() {
    if (carregando) return
    if (atual < questoes.length - 1) {
      setAtual(atual + 1)
      setEscolhida(null)
      setFeedback(null)
      return
    }

    setCarregando(true)
    const { data, error } = await supabase.rpc('finalizar_quiz', {
      p_tentativa_id: questoes[0].tentativa_id,
      p_respostas: {},
    })
    if (error) {
      setCarregando(false)
      setErro(error.message)
      return
    }

    const resultado = (data as CorrecaoQuiz[]) ?? []
    const acertos = resultado.filter((c) => c.acertou).length
    if ((acertos / resultado.length) * 100 < APROVEITAMENTO_MINIMO) {
      const { data: materiais } = await supabase
        .from('materiais')
        .select('*')
        .eq('disciplina_id', disciplinaId)
        .order('titulo')
      setMateriaisGuru((materiais as Material[]) ?? [])
    }

    setCorrecao(resultado)
    setCarregando(false)
    setEtapa('resultado')
  }

  function sair() {
    if (window.confirm('Sair do quiz? O progresso desta rodada será perdido.')) {
      setEtapa('escolher')
      setErro('')
    }
  }

  const nomeDisciplina = disciplinas.find((d) => d.id === disciplinaId)?.nome ?? ''

  // 1) Escolher a disciplina (as do curso do aluno primeiro)
  if (etapa === 'escolher') {
    const ordenadas = [...disciplinas].sort(
      (a, b) => Number(b.curso === perfil?.curso) - Number(a.curso === perfil?.curso),
    )
    return (
      <section className="pagina pagina-larga">
        <header className="pagina-topo">
          <h2>Quiz</h2>
          <p>
            Escolha uma disciplina e responda até 10 perguntas, uma de cada vez. Você vê na hora se
            acertou. Pontos por acerto: Fácil {PONTOS_POR_NIVEL['Fácil']}, Médio {PONTOS_POR_NIVEL['Médio']} e
            Difícil {PONTOS_POR_NIVEL['Difícil']} (só na primeira vez que acerta cada pergunta).
          </p>
        </header>

        {erro ? <p className="aviso erro">{erro}</p> : null}

        <div className="quiz-disciplinas">
          {ordenadas.map((d) => {
            const qtd = perguntasPorDisciplina[d.id] ?? 0
            return (
              <button
                key={d.id}
                type="button"
                className="cartao quiz-disciplina"
                disabled={qtd === 0 || carregando}
                onClick={() => comecar(d.id)}
              >
                <span className="selo">{d.curso}</span>
                <strong>{d.nome}</strong>
                <small>{qtd === 0 ? 'Ainda sem perguntas' : `${qtd} perguntas`}</small>
              </button>
            )
          })}
        </div>
        {carregando ? <p className="status">Sorteando as perguntas...</p> : null}
      </section>
    )
  }

  // 2) Jogar: uma pergunta por vez
  if (etapa === 'jogar') {
    const questao = questoes[atual]
    const respondidas = atual + (feedback ? 1 : 0)
    const ultima = atual === questoes.length - 1

    function estadoDaOpcao(letra: Letra) {
      if (!feedback) return escolhida === letra ? 'marcada' : ''
      if (letra === feedback.gabarito) return 'certa'
      if (letra === escolhida) return 'errada'
      return 'apagada'
    }

    return (
      <section className="pagina quiz-jogo">
        <div className="quiz-topo">
          <button type="button" className="quiz-sair" aria-label="Sair do quiz" onClick={sair}>
            <X size={22} />
          </button>
          <div
            className="quiz-progresso"
            role="progressbar"
            aria-label="Progresso do quiz"
            aria-valuemin={0}
            aria-valuemax={questoes.length}
            aria-valuenow={respondidas}
          >
            <span style={{ width: `${(respondidas / questoes.length) * 100}%` }} />
          </div>
          <span className={`quiz-sequencia${sequencia >= 2 ? ' ativa' : ''}`} title="Acertos seguidos">
            <Flame size={18} /> {sequencia}
          </span>
        </div>

        <div className="quiz-pergunta" key={questao.pergunta_id}>
          <div className="quiz-info">
            <span>
              {nomeDisciplina} · Pergunta {atual + 1} de {questoes.length}
            </span>
            <span className={`quiz-nivel nivel-${questao.nivel === 'Fácil' ? 'facil' : questao.nivel === 'Médio' ? 'medio' : 'dificil'}`}>
              {questao.nivel} · {PONTOS_POR_NIVEL[questao.nivel]} pts
            </span>
          </div>

          <h2 className="quiz-enunciado">
            <TextoRico texto={questao.enunciado} />
          </h2>

          {questao.imagem_path && imagens[questao.imagem_path] ? (
            <img className="quiz-imagem" src={imagens[questao.imagem_path]} alt="Imagem da pergunta" />
          ) : null}

          <div className="quiz-opcoes" role="radiogroup" aria-label="Alternativas">
            {LETRAS.map((letra, i) => (
              <button
                key={letra}
                type="button"
                role="radio"
                aria-checked={escolhida === letra}
                className={`quiz-opcao ${estadoDaOpcao(letra)}`}
                disabled={!!feedback || carregando}
                onClick={() => setEscolhida(letra)}
              >
                <span className="quiz-tecla">{i + 1}</span>
                <span className="quiz-opcao-texto">
                  <TextoRico texto={textoAlternativa(questao, letra)} />
                </span>
                {feedback && letra === feedback.gabarito ? <Check size={20} /> : null}
              </button>
            ))}
          </div>

          {erro ? <p className="aviso erro">{erro}</p> : null}
        </div>

        <footer className={`quiz-rodape${feedback ? (feedback.acertou ? ' certo' : ' errado') : ''}`}>
          <div className="quiz-rodape-conteudo">
            <div className="quiz-feedback" aria-live="polite">
              {feedback ? (
                <>
                  <strong>{feedback.mensagem}</strong>
                  {feedback.acertou ? (
                    <span>
                      {feedback.pontos > 0
                        ? `+${feedback.pontos} pontos`
                        : 'Você já tinha acertado esta antes, então não soma pontos novos.'}
                    </span>
                  ) : (
                    <span>
                      Resposta certa: <strong>{feedback.gabarito})</strong>{' '}
                      <TextoRico texto={textoAlternativa(questao, feedback.gabarito)} />
                    </span>
                  )}
                  {feedback.explicacao ? (
                    <p className="quiz-explicacao">
                      <TextoRico texto={feedback.explicacao} />
                    </p>
                  ) : null}
                </>
              ) : (
                <span className="quiz-dica">Escolha uma alternativa (teclas 1 a 4) e confirme com Enter.</span>
              )}
            </div>

            {feedback ? (
              <button type="button" className="btn btn-grande quiz-botao" onClick={continuar} disabled={carregando}>
                {ultima ? (carregando ? 'Calculando...' : 'Ver resultado') : 'Continuar'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primario btn-grande quiz-botao"
                onClick={verificar}
                disabled={!escolhida || carregando}
              >
                {carregando ? 'Verificando...' : 'Verificar'}
              </button>
            )}
          </div>
        </footer>
      </section>
    )
  }

  // 3) Resultado
  const acertos = correcao.filter((c) => c.acertou).length
  const pontos = correcao.reduce((soma, c) => soma + c.pontos, 0)
  const aproveitamento = Math.round((acertos / correcao.length) * 100)
  const erradas = correcao.filter((c) => !c.acertou)

  return (
    <section className="pagina">
      <header className="pagina-topo quiz-resultado-topo">
        <h2>{tituloResultado(aproveitamento)}</h2>
        <p>Quiz de {nomeDisciplina}</p>
      </header>

      <div className="grade-big-numbers">
        <BigNumber valor={`${aproveitamento}%`} legenda="Acertos" />
        <BigNumber valor={`${acertos}/${correcao.length}`} legenda="Perguntas certas" />
        <BigNumber valor={`+${pontos}`} legenda="Pontos ganhos" />
        <BigNumber valor={melhorSequencia} legenda="Melhor sequência" />
      </div>
      {pontos === 0 && acertos > 0 ? (
        <p className="quiz-obs">Essas perguntas já tinham sido acertadas antes, por isso não somaram pontos.</p>
      ) : null}

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

      {erradas.length > 0 ? (
        <div className="cartao">
          <h3>Revise o que você errou</h3>
          <ul className="quiz-revisao">
            {erradas.map((c) => {
              const questao = questoes.find((q) => q.pergunta_id === c.pergunta_id)
              if (!questao) return null
              return (
                <li key={c.pergunta_id}>
                  <p className="quiz-revisao-pergunta">
                    <TextoRico texto={questao.enunciado} />
                  </p>
                  <p className="quiz-revisao-sua">
                    Sua resposta:{' '}
                    {c.resposta ? <TextoRico texto={`${c.resposta}) ${textoAlternativa(questao, c.resposta)}`} /> : '—'}
                  </p>
                  <p className="quiz-revisao-certa">
                    Certa: <TextoRico texto={`${c.gabarito}) ${textoAlternativa(questao, c.gabarito)}`} />
                  </p>
                  {explicacoes[c.pergunta_id] ? (
                    <p className="quiz-revisao-explicacao">
                      <TextoRico texto={explicacoes[c.pergunta_id]} />
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="quiz-obs">Você acertou todas as perguntas desta rodada!</p>
      )}

      {erro ? <p className="aviso erro">{erro}</p> : null}
      <div className="form-linha quiz-acoes">
        <button
          type="button"
          className="btn btn-primario"
          onClick={() => disciplinaId && comecar(disciplinaId)}
          disabled={carregando}
        >
          Jogar de novo
        </button>
        <button type="button" className="btn btn-secundario" onClick={() => setEtapa('escolher')}>
          Outra disciplina
        </button>
        <Link to="/ranking" className="btn btn-secundario">
          Ver ranking
        </Link>
      </div>
    </section>
  )
}
