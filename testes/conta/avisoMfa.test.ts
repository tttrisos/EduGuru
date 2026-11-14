import { describe, expect, it } from 'vitest'
import { dataDeAdiamento, deveMostrarAvisoMfa } from '../../src/funcionalidades/conta/avisoMfa'

const hoje = new Date('2026-11-14T12:00:00Z')

describe('deveMostrarAvisoMfa', () => {
  it('aparece para aluno sem MFA que nunca adiou', () => {
    expect(deveMostrarAvisoMfa(false, false, null, hoje)).toBe(true)
  })

  it('não aparece para quem tem MFA nem para admin', () => {
    expect(deveMostrarAvisoMfa(true, false, null, hoje)).toBe(false)
    expect(deveMostrarAvisoMfa(false, true, null, hoje)).toBe(false)
  })

  it('"Agora não" esconde por 30 dias e depois volta', () => {
    const adiado = dataDeAdiamento(hoje)
    expect(deveMostrarAvisoMfa(false, false, adiado, new Date('2026-12-13T12:00:00Z'))).toBe(false)
    expect(deveMostrarAvisoMfa(false, false, adiado, new Date('2026-12-14T12:00:00Z'))).toBe(true)
  })

  it('valor estragado no navegador mostra o aviso', () => {
    expect(deveMostrarAvisoMfa(false, false, 'abc', hoje)).toBe(true)
  })
})
