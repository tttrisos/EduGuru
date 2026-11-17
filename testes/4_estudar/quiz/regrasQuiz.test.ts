import { describe, expect, it } from 'vitest'
import { PERGUNTAS_POR_RODADA, textoPerguntasDoCartao } from '../../../src/funcionalidades/4_estudar/quiz/regrasQuiz'

describe('textoPerguntasDoCartao', () => {
  it('a rodada tem no máximo 10 perguntas', () => {
    expect(PERGUNTAS_POR_RODADA).toBe(10)
  })

  it('disciplina sem perguntas fica sem rodada', () => {
    expect(textoPerguntasDoCartao(0)).toBe('Ainda sem perguntas')
  })

  it('com até 10 perguntas, a rodada usa todas', () => {
    expect(textoPerguntasDoCartao(1)).toBe('Rodada de 1 pergunta')
    expect(textoPerguntasDoCartao(7)).toBe('Rodada de 7 perguntas')
    expect(textoPerguntasDoCartao(10)).toBe('Rodada de 10 perguntas')
  })

  it('com mais de 10 perguntas, mostra 10 na rodada e o total do banco à parte', () => {
    expect(textoPerguntasDoCartao(15)).toBe('Rodada de 10 perguntas (de 15 no banco)')
  })
})
