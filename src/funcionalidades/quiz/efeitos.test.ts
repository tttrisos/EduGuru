import { describe, expect, it } from 'vitest'
import { mensagemSequencia } from './efeitos'

describe('mensagemSequencia', () => {
  it('comemora 3, 5 e 10 acertos seguidos', () => {
    expect(mensagemSequencia(3)).toContain('3 seguidas')
    expect(mensagemSequencia(5)).toContain('5 seguidas')
    expect(mensagemSequencia(10)).toContain('10 seguidas')
  })

  it('não mostra nada nas outras sequências', () => {
    expect(mensagemSequencia(0)).toBe('')
    expect(mensagemSequencia(4)).toBe('')
  })
})
