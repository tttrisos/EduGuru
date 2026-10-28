import { describe, expect, it } from 'vitest'
import { calcularM2, calcularMD, calcularSituacao, lerNota, limiteDeFaltas, type NotasDigitadas } from './notas'

// Testes da regra de notas e faltas (RF29), igual ao boletim da UMC.
// Rodar com: npm test

// Atalho para montar as notas digitadas (o que não for passado fica vazio).
function notas(valores: Partial<NotasDigitadas>): NotasDigitadas {
  return { m1: null, nd: null, ni: null, ms: null, exame: null, ...valores }
}

describe('limiteDeFaltas', () => {
  it('é 25% do total de aulas, arredondado para baixo', () => {
    expect(limiteDeFaltas(80)).toBe(20)
    expect(limiteDeFaltas(30)).toBe(7)
  })
})

describe('calcularM2', () => {
  it('M2 = ND × 70% + NI × 30%', () => {
    expect(calcularM2(8, 6)).toBe(7.4)
    expect(calcularM2(10, 0)).toBe(7)
  })

  it('sem ND ou sem NI, ainda não tem M2', () => {
    expect(calcularM2(8, null)).toBeNull()
    expect(calcularM2(null, 6)).toBeNull()
  })
})

describe('calcularMD', () => {
  it('MD = (M1 + M2 × 2) / 3, com 1 casa decimal', () => {
    expect(calcularMD(6, 7.5, null)).toBe(7)
    expect(calcularMD(6.1, 2, null)).toBe(3.4)
  })

  it('a nota única (MS) substitui a MD', () => {
    expect(calcularMD(null, null, 8.5)).toBe(8.5)
    expect(calcularMD(2, 2, 9)).toBe(9)
  })

  it('sem M1 ou sem M2, ainda não tem MD', () => {
    expect(calcularMD(6.1, null, null)).toBeNull()
  })
})

describe('calcularSituacao', () => {
  it('sem as notas, fica aguardando', () => {
    expect(calcularSituacao(notas({ m1: 7 }), 0, 80).situacao).toBe('Aguardando notas')
  })

  it('aprova com MD >= 5', () => {
    // M2 = 5×0,7 + 5×0,3 = 5; MD = (5 + 10) / 3 = 5
    const r = calcularSituacao(notas({ m1: 5, nd: 5, ni: 5 }), 0, 80)
    expect(r.m2).toBe(5)
    expect(r.md).toBe(5)
    expect(r.situacao).toBe('Aprovado')
  })

  it('MD abaixo de 5 sem exame fica "Em exame"', () => {
    // M2 = 4,9; MD = (5 + 9,8) / 3 = 4,9
    expect(calcularSituacao(notas({ m1: 5, nd: 5, ni: 4.7 }), 0, 80).situacao).toBe('Em exame')
  })

  it('o 2º bimestre pesa o dobro', () => {
    // M1 alta não compensa um 2º bimestre fraco: (10 + 2×2) / 3 = 4,7 -> exame
    const r = calcularSituacao(notas({ m1: 10, nd: 2, ni: 2 }), 0, 80)
    expect(r.md).toBe(4.7)
    expect(r.situacao).toBe('Em exame')
    // (2 + 7×2) / 3 = 5,3 -> aprovado
    expect(calcularSituacao(notas({ m1: 2, nd: 7, ni: 7 }), 0, 80).situacao).toBe('Aprovado')
  })

  it('aprova no exame quando (MD + Exame) / 2 >= 5', () => {
    const r = calcularSituacao(notas({ m1: 4, nd: 4, ni: 4, exame: 6 }), 0, 80)
    expect(r.mediaFinal).toBe(5)
    expect(r.situacao).toBe('Aprovado no exame')
  })

  it('reprova quando a média com exame fica abaixo de 5', () => {
    expect(calcularSituacao(notas({ m1: 3, nd: 3, ni: 3, exame: 4 }), 0, 80).situacao).toBe('Reprovado')
  })

  it('disciplina com nota única (MS)', () => {
    expect(calcularSituacao(notas({ ms: 7 }), 0, 80).situacao).toBe('Aprovado')
  })

  it('faltas acima do limite reprovam mesmo com nota alta', () => {
    expect(calcularSituacao(notas({ m1: 10, nd: 10, ni: 10 }), 21, 80).situacao).toBe('Reprovado por falta')
  })

  it('no limite exato de faltas ainda não reprova, mas alerta', () => {
    const r = calcularSituacao(notas({ m1: 8, nd: 8, ni: 8 }), 20, 80)
    expect(r.situacao).toBe('Aprovado')
    expect(r.alertaFaltas).toBe(true)
    expect(r.faltasRestantes).toBe(0)
  })

  it('poucas faltas não geram alerta', () => {
    expect(calcularSituacao(notas({ m1: 8, nd: 8, ni: 8 }), 2, 80).alertaFaltas).toBe(false)
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
