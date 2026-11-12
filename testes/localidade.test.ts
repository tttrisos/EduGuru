import { describe, expect, it } from 'vitest'
import { localDaVaga, trechoDeLocal, vagaNoLocal } from '../src/funcionalidades/carreiras/localidade'

const v = (titulo: string, etiquetas: string[] = []) => ({ titulo, etiquetas })

describe('trechoDeLocal', () => {
  it('pega o texto entre colchetes do começo do título', () => {
    expect(trechoDeLocal('[Híbrido / São Paulo, Brasil] Dev')).toBe('Híbrido / São Paulo, Brasil')
    expect(trechoDeLocal('Dev sem local')).toBe('')
  })
})

describe('localDaVaga (títulos reais das vagas)', () => {
  it('remoto', () => {
    expect(localDaVaga(v('[Remoto] Dev Java Júnior', ['Remoto']))).toMatchObject({ remoto: true, sp: false, rotulo: 'Remoto' })
    expect(localDaVaga(v('[Remote] Embedded Engineer')).remoto).toBe(true)
    expect(localDaVaga(v('[Home Office - Tempo Determinado/5 meses] Dev')).remoto).toBe(true)
  })

  it('estado de SP', () => {
    expect(localDaVaga(v('[Híbrido em SP] Fullstack'))).toMatchObject({ sp: true, rotulo: 'São Paulo/SP' })
    expect(localDaVaga(v('[Híbrido / São Paulo, Brasil] Backend')).sp).toBe(true)
    expect(localDaVaga(v('[Campinas] Dev')).rotulo).toBe('Campinas/SP')
    expect(localDaVaga(v('Dev React', ['São Paulo', 'Híbrido'])).sp).toBe(true)
  })

  it('perto da UMC (Alto Tietê)', () => {
    expect(localDaVaga(v('[Mogi das Cruzes/SP] Estágio em TI'))).toMatchObject({ sp: true, pertoDaUmc: true, rotulo: 'Mogi das Cruzes/SP' })
    expect(localDaVaga(v('[Presencial - Suzano] Suporte')).pertoDaUmc).toBe(true)
    expect(localDaVaga(v('[Mogi Mirim/SP] Dev')).pertoDaUmc).toBe(false)
  })

  it('outros estados e exterior', () => {
    expect(localDaVaga(v('[Joinville/SC] Back-end', ['Híbrido']))).toMatchObject({ sp: false, outroLugar: true, rotulo: 'Joinville/SC' })
    expect(localDaVaga(v('[Cidade do México, México] Engineer')).outroLugar).toBe(true)
    expect(localDaVaga(v('[Belo Horizonte, Brasil] Engineer')).outroLugar).toBe(true)
    expect(localDaVaga(v('[Híbrido/Curitiba] Front-end')).rotulo).toBe('Curitiba')
  })

  it('etiqueta "Go" (linguagem) não vira Goiás', () => {
    expect(localDaVaga(v('[Híbrido] Sr Software Engineer', ['Sênior', 'Go', 'Híbrido']))).toMatchObject({
      outroLugar: false,
      rotulo: 'Local não informado',
    })
  })

  it('SP ou outra cidade conta como SP', () => {
    const l = localDaVaga(v('[Belo Horizonte ou São Paulo, Brasil] Software Engineer'))
    expect(l.sp && l.outroLugar).toBe(true)
    expect(l.rotulo).toBe('São Paulo/SP')
  })
})

describe('vagaNoLocal', () => {
  const remota = v('[Remoto] Dev')
  const sp = v('[Híbrido em SP] Dev')
  const fora = v('[Joinville/SC] Dev')
  const semLocal = v('[Híbrido] Dev')

  it('padrão: remotas e no estado de SP', () => {
    expect([remota, sp, fora, semLocal].map((x) => vagaNoLocal(x, 'sp-remoto'))).toEqual([true, true, false, false])
  })

  it('só remotas, só SP e todas', () => {
    expect([remota, sp, fora].map((x) => vagaNoLocal(x, 'remoto'))).toEqual([true, false, false])
    expect([remota, sp, fora].map((x) => vagaNoLocal(x, 'sp'))).toEqual([false, true, false])
    expect([remota, sp, fora, semLocal].every((x) => vagaNoLocal(x, 'todas'))).toBe(true)
  })
})
