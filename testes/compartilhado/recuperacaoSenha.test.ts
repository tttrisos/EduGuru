// Testes da trava da tela "Criar nova senha" (RF24-RN06): só quem chegou pelo link de recuperação
// desta mesma conta pode trocar a senha por ali. Regra em src/compartilhado/sessao/recuperacaoSenha.ts.
import { describe, expect, it } from 'vitest'
import { podeRedefinirSenha } from '../../src/compartilhado/sessao/recuperacaoSenha'

describe('podeRedefinirSenha', () => {
  it('libera quando o link de recuperação foi aberto pela conta que está logada', () => {
    expect(podeRedefinirSenha('aluno-1', 'aluno-1')).toBe(true)
  })

  it('recusa quem está logado mas não veio do link (ex.: digitou #/redefinir-senha)', () => {
    expect(podeRedefinirSenha(null, 'aluno-1')).toBe(false)
  })

  it('recusa quando o link foi de outra conta (ex.: duas contas no mesmo navegador)', () => {
    expect(podeRedefinirSenha('aluno-2', 'aluno-1')).toBe(false)
  })

  it('recusa sem ninguém logado (link expirado ou aberto em outro navegador)', () => {
    expect(podeRedefinirSenha('aluno-1', null)).toBe(false)
    expect(podeRedefinirSenha('aluno-1', undefined)).toBe(false)
  })
})
