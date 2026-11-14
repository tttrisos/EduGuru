import { describe, expect, it } from 'vitest'
import { fraseAprender, resumirEvolucao } from '../../src/funcionalidades/painel/evolucao'

const d = (disciplina: string, respondidas: number, acertos: number) => ({
  disciplina_id: disciplina.length,
  disciplina,
  respondidas,
  acertos,
  aproveitamento: respondidas > 0 ? Math.round((acertos / respondidas) * 100) : 0,
})

describe('resumirEvolucao', () => {
  it('separa dominadas (>= 60%), para revisar (< 60%) e em andamento (< 5 respostas)', () => {
    const r = resumirEvolucao([d('Banco de Dados', 10, 8), d('Redes', 6, 2), d('Lógica', 3, 3)])
    expect(r).toEqual({ praticadas: 3, dominadas: 1, paraRevisar: 1, emAndamento: 1, aproveitamentoGeral: 68 })
  })

  it('exatamente 60% conta como dominada', () => {
    expect(resumirEvolucao([d('Dados', 5, 3)]).dominadas).toBe(1)
  })

  it('sem prática', () => {
    expect(resumirEvolucao([])).toEqual({ praticadas: 0, dominadas: 0, paraRevisar: 0, emAndamento: 0, aproveitamentoGeral: null })
  })
})

describe('fraseAprender', () => {
  it('muda conforme o momento do aluno', () => {
    expect(fraseAprender(resumirEvolucao([]))).toMatch(/Comece/)
    expect(fraseAprender(resumirEvolucao([d('Lógica', 2, 2)]))).toMatch(/5 respostas/)
    expect(fraseAprender(resumirEvolucao([d('BD', 10, 8), d('Redes', 6, 2)]))).toBe('Você domina 1 de 2 disciplinas avaliadas.')
  })
})
