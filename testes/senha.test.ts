import { describe, expect, it } from 'vitest'
import { REGRAS_SENHA, senhaAtendeTodasRegras } from '../src/funcionalidades/acesso/senha'

// Testes das regras de senha do cadastro (RF02).

function regra(chave: string) {
  const encontrada = REGRAS_SENHA.find((r) => r.chave === chave)
  if (!encontrada) throw new Error(`Regra ${chave} não existe`)
  return encontrada
}

describe('regras de senha', () => {
  it('exige pelo menos 8 caracteres', () => {
    expect(regra('tamanho').testar('Ab1!')).toBe(false)
    expect(regra('tamanho').testar('Abcdef1!')).toBe(true)
  })

  it('exige maiúscula, minúscula, número e caractere especial', () => {
    expect(regra('maiuscula').testar('abc')).toBe(false)
    expect(regra('minuscula').testar('ABC')).toBe(false)
    expect(regra('numero').testar('Abc')).toBe(false)
    expect(regra('especial').testar('Abc1')).toBe(false)
  })

  it('senha forte atende todas as regras', () => {
    expect(senhaAtendeTodasRegras('Eduguru@2026')).toBe(true)
  })

  it('senha fraca não atende', () => {
    expect(senhaAtendeTodasRegras('eduguru2026')).toBe(false)
  })
})
