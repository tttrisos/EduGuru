// Testes da sessão expirada por inatividade (src/compartilhado/sessao/inatividade.ts).
import { describe, expect, it } from 'vitest'
import {
  INTERVALO_GRAVACAO_MS,
  LIMITE_INATIVIDADE_MS,
  interpretarRegistro,
  precisaGravar,
  sessaoExpirou,
} from '../../src/compartilhado/sessao/inatividade'

const MINUTO = 60 * 1000
const AGORA = 1_800_000_000_000

describe('sessaoExpirou', () => {
  it('o limite é de 30 minutos', () => {
    expect(LIMITE_INATIVIDADE_MS).toBe(30 * MINUTO)
  })

  it('não expira com 29 minutos sem uso', () => {
    expect(sessaoExpirou(AGORA - 29 * MINUTO, AGORA)).toBe(false)
  })

  it('expira com exatamente 30 minutos sem uso', () => {
    expect(sessaoExpirou(AGORA - 30 * MINUTO, AGORA)).toBe(true)
  })

  it('expira quando o aluno fecha o navegador e volta no outro dia', () => {
    expect(sessaoExpirou(AGORA - 24 * 60 * MINUTO, AGORA)).toBe(true)
  })

  it('sem registro do último uso, não expira (não desloga por engano)', () => {
    expect(sessaoExpirou(null, AGORA)).toBe(false)
    expect(sessaoExpirou(Number.NaN, AGORA)).toBe(false)
  })
})

describe('precisaGravar', () => {
  it('só grava o último uso a cada 15 segundos', () => {
    expect(INTERVALO_GRAVACAO_MS).toBe(15 * 1000)
    expect(precisaGravar(AGORA - 5 * 1000, AGORA)).toBe(false)
    expect(precisaGravar(AGORA - 15 * 1000, AGORA)).toBe(true)
  })
})

describe('interpretarRegistro', () => {
  it('lê o número guardado no navegador', () => {
    expect(interpretarRegistro(String(AGORA))).toBe(AGORA)
  })

  it('valor vazio ou estragado vira null', () => {
    expect(interpretarRegistro(null)).toBeNull()
    expect(interpretarRegistro('')).toBeNull()
    expect(interpretarRegistro('abc')).toBeNull()
    expect(interpretarRegistro('-5')).toBeNull()
  })
})
