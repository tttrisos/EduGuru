import { describe, expect, it } from 'vitest'
import { calcularSituacao, lerNota, limiteDeFaltas } from './notas'

// Testes da regra de notas e faltas (RF29). Rodar com: npm test

describe('limiteDeFaltas', () => {
  it('é 25% do total de aulas, arredondado para baixo', () => {
    expect(limiteDeFaltas(80)).toBe(20)
    expect(limiteDeFaltas(30)).toBe(7)
  })
})

describe('calcularSituacao', () => {
  it('sem as duas notas, fica aguardando', () => {
    expect(calcularSituacao(7, null, null, 0, 80).situacao).toBe('Aguardando notas')
  })

  it('ND = (M1 + M2) / 2 e aprova com ND >= 6', () => {
    const r = calcularSituacao(7, 5, null, 0, 80)
    expect(r.nd).toBe(6)
    expect(r.situacao).toBe('Aprovado')
  })

  it('ND abaixo de 6 sem exame fica "Em exame"', () => {
    expect(calcularSituacao(5, 4, null, 0, 80).situacao).toBe('Em exame')
  })

  it('aprova no exame quando (ND + Exame) / 2 >= 5', () => {
    const r = calcularSituacao(4, 4, 6, 0, 80)
    expect(r.mediaFinal).toBe(5)
    expect(r.situacao).toBe('Aprovado no exame')
  })

  it('reprova quando a média com exame fica abaixo de 5', () => {
    expect(calcularSituacao(3, 3, 4, 0, 80).situacao).toBe('Reprovado')
  })

  it('faltas acima do limite reprovam mesmo com nota alta', () => {
    expect(calcularSituacao(10, 10, null, 21, 80).situacao).toBe('Reprovado por falta')
  })

  it('no limite exato de faltas ainda não reprova, mas alerta', () => {
    const r = calcularSituacao(8, 8, null, 20, 80)
    expect(r.situacao).toBe('Aprovado')
    expect(r.alertaFaltas).toBe(true)
    expect(r.faltasRestantes).toBe(0)
  })

  it('poucas faltas não geram alerta', () => {
    expect(calcularSituacao(8, 8, null, 2, 80).alertaFaltas).toBe(false)
  })
})

describe('lerNota', () => {
  it('campo vazio vira null (nota ainda não saiu)', () => {
    expect(lerNota('  ')).toEqual({ valor: null, erro: null })
  })

  it('aceita vírgula e ponto', () => {
    expect(lerNota('7,5').valor).toBe(7.5)
    expect(lerNota('8.25').valor).toBe(8.25)
  })

  it('recusa texto e valores fora de 0 a 10', () => {
    expect(lerNota('abc').erro).not.toBeNull()
    expect(lerNota('-1').erro).not.toBeNull()
    expect(lerNota('10.5').erro).not.toBeNull()
  })
})
