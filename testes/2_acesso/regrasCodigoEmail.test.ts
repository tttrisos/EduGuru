import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  esquecerTokenAparelho,
  guardarTokenAparelho,
  lerTokenAparelho,
  mensagemCodigoEmail,
  textoVerificacao,
} from '../../src/funcionalidades/2_acesso/regrasCodigoEmail'

function armazenamentoFalso() {
  const dados = new Map<string, string>()
  return {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
    removeItem: (k: string) => void dados.delete(k),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('token do aparelho lembrado', () => {
  it('guarda, lê e esquece um token por conta', () => {
    vi.stubGlobal('localStorage', armazenamentoFalso())
    guardarTokenAparelho('ana', 'token-da-ana')
    guardarTokenAparelho('bia', 'token-da-bia')
    expect(lerTokenAparelho('ana')).toBe('token-da-ana')
    expect(lerTokenAparelho('bia')).toBe('token-da-bia')
    esquecerTokenAparelho('ana')
    expect(lerTokenAparelho('ana')).toBeNull()
    expect(lerTokenAparelho('bia')).toBe('token-da-bia')
  })

  it('navegador sem armazenamento não quebra (só não lembra)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
      removeItem: () => {
        throw new Error('bloqueado')
      },
    })
    expect(() => guardarTokenAparelho('ana', 'x')).not.toThrow()
    expect(lerTokenAparelho('ana')).toBeNull()
    expect(() => esquecerTokenAparelho('ana')).not.toThrow()
  })
})

describe('mensagemCodigoEmail', () => {
  it('mostra as tentativas restantes e o tempo de espera', () => {
    expect(mensagemCodigoEmail('errado', { restantes: 3 })).toContain('3')
    expect(mensagemCodigoEmail('aguarde', { segundos: 42 })).toContain('42 segundos')
  })

  it('explica bloqueio, expiração e limites', () => {
    expect(mensagemCodigoEmail('bloqueado')).toContain('código novo')
    expect(mensagemCodigoEmail('expirado')).toContain('expirou')
    expect(mensagemCodigoEmail('limite_pessoal')).toContain('aplicativo autenticador')
    expect(mensagemCodigoEmail('limite_geral')).toContain('limite diário')
    expect(mensagemCodigoEmail(undefined)).toContain('Tente de novo')
  })
})

describe('textoVerificacao', () => {
  it('descreve como cada login foi verificado', () => {
    expect(textoVerificacao('totp')).toBe('com o código do aplicativo')
    expect(textoVerificacao('email')).toBe('com o código do e-mail')
    expect(textoVerificacao('aparelho')).toBe('em aparelho lembrado')
    expect(textoVerificacao('nao')).toBe('só com a senha')
    expect(textoVerificacao(null)).toBe('só com a senha')
  })
})
