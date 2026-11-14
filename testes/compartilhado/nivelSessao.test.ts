import { describe, expect, it } from 'vitest'
import { situacaoDaSessao } from '../../src/compartilhado/sessao/nivelSessao'

describe('situacaoDaSessao', () => {
  it('aluno sem MFA entra só com a senha', () => {
    expect(situacaoDaSessao('aal1', 'aal1', 'aluno')).toEqual({ liberada: true, temMfa: false, falta: null })
  })

  it('quem ativou o MFA precisa do código', () => {
    expect(situacaoDaSessao('aal1', 'aal2', 'aluno')).toEqual({ liberada: false, temMfa: true, falta: 'codigo' })
    // antes de ler o perfil (papel ainda desconhecido) a regra é a mesma
    expect(situacaoDaSessao('aal1', 'aal2', null).falta).toBe('codigo')
  })

  it('com o código, libera', () => {
    expect(situacaoDaSessao('aal2', 'aal2', 'aluno')).toEqual({ liberada: true, temMfa: true, falta: null })
  })

  it('administrador sem MFA precisa cadastrar', () => {
    expect(situacaoDaSessao('aal1', 'aal1', 'admin')).toEqual({ liberada: false, temMfa: false, falta: 'cadastrar' })
  })

  it('administrador com MFA: precisa do código e depois libera', () => {
    expect(situacaoDaSessao('aal1', 'aal2', 'admin').falta).toBe('codigo')
    expect(situacaoDaSessao('aal2', 'aal2', 'admin').liberada).toBe(true)
  })

  it('sem informação do Supabase não inventa MFA', () => {
    expect(situacaoDaSessao(undefined, undefined, 'aluno').liberada).toBe(true)
  })
})
