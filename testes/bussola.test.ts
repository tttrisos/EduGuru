import { describe, expect, it } from 'vitest'
import {
  combinarSugestoes,
  completas,
  destaques,
  motivoSugestao,
  progresso,
  proximaSemResposta,
  respondidas,
  type AfinidadeBussola,
  type Afirmacao,
} from '../src/funcionalidades/carreiras/afinidadeBussola'

const afs: Afirmacao[] = [1, 2, 3, 4].map((id) => ({ id, texto: `Frase ${id}`, area_id: id, ordem: id }))

describe('progresso das respostas', () => {
  it('conta só respostas de 1 a 5', () => {
    expect(respondidas(afs, { 1: 5, 2: 0, 3: 6, 99: 3 })).toBe(1)
  })

  it('porcentagem e lista vazia', () => {
    expect(progresso(afs, { 1: 3, 2: 4 })).toBe(50)
    expect(progresso([], {})).toBe(0)
  })

  it('completas só com todas respondidas', () => {
    expect(completas(afs, { 1: 1, 2: 2, 3: 3 })).toBe(false)
    expect(completas(afs, { 1: 1, 2: 2, 3: 3, 4: 4 })).toBe(true)
    expect(completas([], {})).toBe(false)
  })

  it('próxima sem resposta (ou a última, se todas respondidas)', () => {
    expect(proximaSemResposta(afs, { 1: 3, 3: 3 })).toBe(1)
    expect(proximaSemResposta(afs, { 1: 1, 2: 2, 3: 3, 4: 4 })).toBe(3)
  })
})

const r = (area_id: number, area: string, afinidade: number): AfinidadeBussola => ({ area_id, area, afinidade })

describe('destaques', () => {
  it('até 3 áreas com 60% ou mais, da maior para a menor', () => {
    const lista = [r(1, 'Back-end', 75), r(2, 'Dados', 100), r(3, 'Front-end', 60), r(4, 'IA', 88), r(5, 'QA', 20)]
    expect(destaques(lista).map((d) => d.area)).toEqual(['Dados', 'IA', 'Back-end'])
  })

  it('nenhuma com 60%: mostra só a maior', () => {
    expect(destaques([r(1, 'Back-end', 25), r(2, 'Dados', 50)]).map((d) => d.area)).toEqual(['Dados'])
  })

  it('tudo 0% ou sem resultado: nenhum destaque', () => {
    expect(destaques([r(1, 'Back-end', 0)])).toEqual([])
    expect(destaques([])).toEqual([])
  })
})

describe('combinarSugestoes (quiz + Bússola)', () => {
  const quiz = [
    { area_id: 1, area: 'Back-end', aproveitamento: 80, disciplinas: ['Banco de Dados'] },
    { area_id: 4, area: 'Dados', aproveitamento: 70, disciplinas: ['Banco de Dados', 'Inteligência de Negócios'] },
  ]

  it('junta as duas fontes; quem aparece nas duas vem primeiro', () => {
    const s = combinarSugestoes(quiz, [r(4, 'Dados', 90), r(2, 'Front-end', 65), r(1, 'Back-end', 10)])
    expect(s.map((x) => x.area)).toEqual(['Dados', 'Back-end', 'Front-end'])
    expect(s[0]).toMatchObject({ aproveitamento: 70, afinidade: 90 })
    expect(s[2]).toMatchObject({ aproveitamento: null, afinidade: 65, disciplinas: [] })
  })

  it('só quiz ou só Bússola', () => {
    expect(combinarSugestoes(quiz, []).map((x) => x.afinidade)).toEqual([null, null])
    expect(combinarSugestoes([], [r(3, 'IA', 70)])).toEqual([
      { area_id: 3, area: 'IA', aproveitamento: null, disciplinas: [], afinidade: 70 },
    ])
  })

  it('motivo do selo da vaga', () => {
    const [dados, backend, front] = combinarSugestoes(quiz, [r(4, 'Dados', 90), r(2, 'Front-end', 65)])
    expect(motivoSugestao(dados)).toBe('Dados: você acerta 70% em Banco de Dados e Inteligência de Negócios e 90% de afinidade na Bússola')
    expect(motivoSugestao(backend)).toBe('Back-end: você acerta 80% em Banco de Dados')
    expect(motivoSugestao(front)).toBe('Front-end: 65% de afinidade na Bússola')
  })
})

describe('iconeDaArea', () => {
  it('ícone próprio para as áreas iniciais e a bússola para áreas novas', async () => {
    const { iconeDaArea } = await import('../src/funcionalidades/carreiras/iconesAreas')
    const { Bug, Compass, Database, Server, ShieldCheck } = await import('lucide-react')
    expect(iconeDaArea('Qualidade e Testes')).toBe(Bug)
    expect(iconeDaArea('BACK-END')).toBe(Server)
    expect(iconeDaArea('Dados')).toBe(Database)
    expect(iconeDaArea('Infraestrutura e Segurança')).toBe(ShieldCheck)
    expect(iconeDaArea('Mobile')).toBe(Compass)
  })
})
