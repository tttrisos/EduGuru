import { describe, expect, it } from 'vitest'
import {
  MOTIVO_DADOS_PESSOAIS,
  MOTIVO_DOMINIO,
  MOTIVO_HTTPS,
  MOTIVO_TERMOS,
  dominioDoLink,
  dominioPermitido,
  linkCurto,
  motivoBloqueio,
  semAcento,
} from '../src/funcionalidades/materiais/filtroMateriais'

describe('dominioDoLink', () => {
  it('tira o www e o caminho', () => {
    expect(dominioDoLink('https://www.youtube.com/watch?v=abc')).toBe('youtube.com')
    expect(dominioDoLink('https://pt.wikipedia.org/wiki/SQL')).toBe('pt.wikipedia.org')
  })

  it('devolve vazio quando não é https', () => {
    expect(dominioDoLink('http://youtube.com')).toBe('')
  })
})

describe('dominioPermitido', () => {
  it('aceita o domínio e os subdomínios da lista', () => {
    expect(dominioPermitido('github.com')).toBe(true)
    expect(dominioPermitido('learn.microsoft.com')).toBe(true)
  })

  it('recusa domínios fora da lista, mesmo parecidos', () => {
    expect(dominioPermitido('site-qualquer.com')).toBe(false)
    expect(dominioPermitido('github.com.golpe.ru')).toBe(false)
    expect(dominioPermitido('fakeyoutube.com')).toBe(false)
  })
})

describe('motivoBloqueio', () => {
  it('libera material de estudo comum', () => {
    expect(motivoBloqueio({ titulo: 'Apostila de SQL', link: 'https://www.youtube.com/watch?v=1' })).toBeNull()
    expect(motivoBloqueio({ titulo: 'Resumo de Redes', arquivoNome: 'resumo_redes.pdf' })).toBeNull()
  })

  it('bloqueia termos impróprios, com ou sem acento', () => {
    expect(motivoBloqueio({ titulo: 'Office crackeado grátis' })).toBe(MOTIVO_TERMOS)
    expect(motivoBloqueio({ titulo: 'Aula', descricao: 'Compre cocaína aqui' })).toBe(MOTIVO_TERMOS)
    expect(motivoBloqueio({ titulo: 'Aula', link: 'https://github.com/x/keygen' })).toBe(MOTIVO_TERMOS)
    expect(motivoBloqueio({ titulo: 'Resumo', arquivoNome: 'resumo_keygen.pdf' })).toBe(MOTIVO_TERMOS)
  })

  it('não confunde palavras parecidas', () => {
    expect(motivoBloqueio({ titulo: 'Cracking the Coding Interview' })).toBeNull()
    expect(motivoBloqueio({ titulo: 'Alphabet e betas do Android' })).toBeNull()
  })

  it('bloqueia dados pessoais (LGPD)', () => {
    expect(motivoBloqueio({ titulo: 'Meu CPF 123.456.789-09' })).toBe(MOTIVO_DADOS_PESSOAIS)
    expect(motivoBloqueio({ titulo: 'Fale comigo', descricao: 'joao@email.com' })).toBe(MOTIVO_DADOS_PESSOAIS)
    expect(motivoBloqueio({ titulo: 'Grupo', descricao: 'zap (11) 98765-4321' })).toBe(MOTIVO_DADOS_PESSOAIS)
  })

  it('exige https e site permitido', () => {
    expect(motivoBloqueio({ titulo: 'Aula', link: 'http://youtube.com' })).toBe(MOTIVO_HTTPS)
    expect(motivoBloqueio({ titulo: 'Aula', link: 'https://encurtador.com/x' })).toBe(MOTIVO_DOMINIO)
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
