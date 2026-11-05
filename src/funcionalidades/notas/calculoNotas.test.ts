import { describe, expect, it } from 'vitest'
import {
  calcularFrequencia,
  calcularM2,
  calcularMD,
  calcularNotas,
  calcularSituacao,
  lerNota,
  validarFaltas,
  type NotasDigitadas,
} from './calculoNotas'

// Testes da regra de notas e faltas (RF20). Rodar com: npm test

function notas(valores: Partial<NotasDigitadas>): NotasDigitadas {
  return { m1: null, nd: null, ni: null, m2: null, ms: null, exame: null, ...valores }
}

describe('validarFaltas', () => {
  it('as faltas vão de 2 em 2 (um módulo)', () => {
    expect(validarFaltas(6)).toBeNull()
    expect(validarFaltas(3)).not.toBeNull()
  })

  it('recusa número negativo ou quebrado', () => {
    expect(validarFaltas(-2)).not.toBeNull()
    expect(validarFaltas(2.5)).not.toBeNull()
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

  it('MD parcial já com a M1, como no portal (M2 que falta conta como 0)', () => {
    expect(calcularMD(6.1, null, null)).toBe(2)
    expect(calcularMD(4.8, null, null)).toBe(1.6)
  })

  it('sem nenhuma nota, ainda não tem MD', () => {
    expect(calcularMD(null, null, null)).toBeNull()
  })
})

describe('calcularSituacao', () => {
  it('sem as notas, fica aguardando', () => {
    expect(calcularSituacao(notas({ m1: 7 }), 0).situacao).toBe('Aguardando notas')
  })

  it('aprova com MD >= 5', () => {
    // M2 = 5×0,7 + 5×0,3 = 5; MD = (5 + 10) / 3 = 5
    const r = calcularSituacao(notas({ m1: 5, nd: 5, ni: 5 }), 0)
    expect(r.m2).toBe(5)
    expect(r.md).toBe(5)
    expect(r.situacao).toBe('Aprovado')
  })

  it('MD abaixo de 5 sem exame fica "Em exame"', () => {
    // M2 = 4,9; MD = (5 + 9,8) / 3 = 4,9
    expect(calcularSituacao(notas({ m1: 5, nd: 5, ni: 4.7 }), 0).situacao).toBe('Em exame')
  })

  it('o 2º bimestre pesa o dobro', () => {
    // M1 alta não compensa um 2º bimestre fraco: (10 + 2×2) / 3 = 4,7 -> exame
    const r = calcularSituacao(notas({ m1: 10, nd: 2, ni: 2 }), 0)
    expect(r.md).toBe(4.7)
    expect(r.situacao).toBe('Em exame')
    // (2 + 7×2) / 3 = 5,3 -> aprovado
    expect(calcularSituacao(notas({ m1: 2, nd: 7, ni: 7 }), 0).situacao).toBe('Aprovado')
  })

  it('aprova no exame quando (MD + Exame) / 2 >= 5', () => {
    const r = calcularSituacao(notas({ m1: 4, nd: 4, ni: 4, exame: 6 }), 0)
    expect(r.mediaFinal).toBe(5)
    expect(r.situacao).toBe('Aprovado no exame')
  })

  it('reprova quando a média com exame fica abaixo de 5', () => {
    expect(calcularSituacao(notas({ m1: 3, nd: 3, ni: 3, exame: 4 }), 0).situacao).toBe('Reprovado')
  })

  it('disciplina com nota única (MS)', () => {
    expect(calcularSituacao(notas({ ms: 7 }), 0).situacao).toBe('Aprovado')
  })

  it('faltas acima do limite reprovam mesmo com nota alta', () => {
    expect(calcularSituacao(notas({ m1: 10, nd: 10, ni: 10 }), 42).situacao).toBe('Reprovado por falta')
  })

  it('no limite exato de faltas ainda não reprova, mas alerta', () => {
    const r = calcularSituacao(notas({ m1: 8, nd: 8, ni: 8 }), 40)
    expect(r.situacao).toBe('Aprovado')
    expect(r.alertaFaltas).toBe(true)
    expect(r.faltasRestantes).toBe(0)
  })

  it('poucas faltas não geram alerta', () => {
    expect(calcularSituacao(notas({ m1: 8, nd: 8, ni: 8 }), 2).alertaFaltas).toBe(false)
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

describe('calcularNotas (1º cálculo: só as notas)', () => {
  it('não depende das faltas', () => {
    expect(calcularNotas(notas({ m1: 8, nd: 8, ni: 8 })).situacao).toBe('Aprovado')
  })

  it('boletim real: M1 6,1 dá MD 2,0 e fica aguardando, sem MF', () => {
    const r = calcularNotas(notas({ m1: 6.1 }))
    expect(r.md).toBe(2)
    expect(r.mediaFinal).toBeNull()
    expect(r.situacao).toBe('Aguardando notas')
  })

  it('aceita a M2 digitada para simular a MF', () => {
    const r = calcularNotas(notas({ m1: 6.1, m2: 7 }))
    expect(r.md).toBe(6.7)
    expect(r.mediaFinal).toBe(6.7)
    expect(r.situacao).toBe('Aprovado')
  })

  it('ND e NI têm prioridade sobre a M2 digitada', () => {
    expect(calcularNotas(notas({ m1: 6, nd: 7, ni: 8, m2: 2 })).m2).toBe(7.3)
  })

  it('com a M2, a MF aparece automaticamente', () => {
    expect(calcularNotas(notas({ m1: 6, nd: 7, ni: 8 })).mediaFinal).toBe(6.9)
  })
})

describe('calcularFrequencia (2º cálculo: só as faltas)', () => {
  it('boletim real: 20 faltas, ainda pode faltar 20 (5 dias inteiros)', () => {
    const r = calcularFrequencia(20)
    expect(r.situacao).toBe('Frequência OK')
    expect(r.faltasRestantes).toBe(20)
    expect(r.diasRestantes).toBe(5)
  })

  it('a partir de 30 faltas (75% do limite): atenção', () => {
    expect(calcularFrequencia(30).situacao).toBe('Atenção às faltas')
  })

  it('no limite de 40 ainda não reprova; acima, reprova por falta', () => {
    expect(calcularFrequencia(40).situacao).toBe('Atenção às faltas')
    expect(calcularFrequencia(42).situacao).toBe('Reprovado por falta')
  })
})
