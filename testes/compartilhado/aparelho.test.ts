import { describe, expect, it } from 'vitest'
import { descreverAparelho } from '../../src/compartilhado/utilitarios/aparelho'

const UA = {
  chromeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  edgeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
}

describe('descreverAparelho', () => {
  it('reconhece navegador e sistema mais comuns', () => {
    expect(descreverAparelho(UA.chromeWindows)).toBe('Chrome no Windows')
    expect(descreverAparelho(UA.edgeWindows)).toBe('Edge no Windows')
    expect(descreverAparelho(UA.chromeAndroid)).toBe('Chrome no Android')
    expect(descreverAparelho(UA.samsung)).toBe('Samsung Internet no Android')
    expect(descreverAparelho(UA.safariIphone)).toBe('Safari no iPhone')
    expect(descreverAparelho(UA.chromeIphone)).toBe('Chrome no iPhone')
    expect(descreverAparelho(UA.firefoxLinux)).toBe('Firefox no Linux')
    expect(descreverAparelho(UA.safariMac)).toBe('Safari no Mac')
  })

  it('não guarda versão nem detalhes do aparelho', () => {
    expect(descreverAparelho(UA.chromeAndroid)).not.toMatch(/\d|SM-/)
  })

  it('texto estranho vira "Navegador desconhecido"', () => {
    expect(descreverAparelho('')).toBe('Navegador desconhecido')
    expect(descreverAparelho('curl/8.0')).toBe('Navegador desconhecido')
  })
})
