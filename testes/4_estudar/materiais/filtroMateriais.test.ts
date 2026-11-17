// O filtro em si (sites, termos, dados pessoais) é testado no banco: supabase/22.
import { describe, expect, it } from 'vitest'
import {
  MOTIVO_SITE_NOVO,
  dominioDoLink,
  ehSiteNovo,
  linkCurto,
  semAcento,
} from '../../../src/funcionalidades/4_estudar/materiais/filtroMateriais'

describe('dominioDoLink', () => {
  it('tira o www e o caminho', () => {
    expect(dominioDoLink('https://www.youtube.com/watch?v=abc')).toBe('youtube.com')
    expect(dominioDoLink('https://pt.wikipedia.org/wiki/SQL')).toBe('pt.wikipedia.org')
  })

  it('devolve vazio quando não é https', () => {
    expect(dominioDoLink('http://youtube.com')).toBe('')
  })
})

describe('ehSiteNovo', () => {
  it('reconhece o motivo de site fora da lista', () => {
    expect(ehSiteNovo(MOTIVO_SITE_NOVO)).toBe(true)
    expect(ehSiteNovo('Arquivo aguardando a análise da equipe.')).toBe(false)
    expect(ehSiteNovo(null)).toBe(false)
  })
})

describe('semAcento', () => {
  it('tira acentos e deixa minúsculo', () => {
    expect(semAcento('Programação')).toBe('programacao')
  })
})

describe('linkCurto', () => {
  it('tira www, parâmetros de rastreamento e a barra final', () => {
    const longo =
      'https://pt.khanacademy.org/computing/computer-programming/html-css-js?utm_account=Grant&utm_campaignname=&gad_source=1&gclid=EAIaIQobChMI7cna2fDilw'
    expect(linkCurto(longo)).toBe('pt.khanacademy.org/computing/computer-programming/html-css-js')
    expect(linkCurto('https://www.github.com/')).toBe('github.com')
  })

  it('mantém o vídeo do YouTube', () => {
    expect(linkCurto('https://www.youtube.com/watch?v=abc123&t=30s')).toBe('youtube.com/watch?v=abc123')
  })

  it('corta textos longos com reticências', () => {
    const r = linkCurto(`https://site.com/${'a'.repeat(100)}`)
    expect(r).toHaveLength(70)
    expect(r.endsWith('…')).toBe(true)
  })

  it('link inválido volta como veio', () => {
    expect(linkCurto('nao é link')).toBe('nao é link')
  })
})
