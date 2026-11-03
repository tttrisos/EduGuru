import { describe, expect, it } from 'vitest'
import { partesDoTexto } from './texto'

// Testes do negrito nas perguntas (**texto**).

describe('partesDoTexto', () => {
  it('texto sem marcação fica igual', () => {
    expect(partesDoTexto('Qual o resultado?')).toEqual([{ texto: 'Qual o resultado?', negrito: false }])
  })

  it('o que está entre ** vira negrito', () => {
    expect(partesDoTexto('Qual estrutura segue a regra **LIFO**?')).toEqual([
      { texto: 'Qual estrutura segue a regra ', negrito: false },
      { texto: 'LIFO', negrito: true },
      { texto: '?', negrito: false },
    ])
  })

  it('aceita mais de um trecho em negrito', () => {
    const partes = partesDoTexto('**TCP** ou **UDP**')
    expect(partes.filter((p) => p.negrito).map((p) => p.texto)).toEqual(['TCP', 'UDP'])
  })
})
