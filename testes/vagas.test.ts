import { describe, expect, it, vi } from 'vitest'
import {
  CHAVE_CACHE,
  ErroVagas,
  MSG_SEM_CONEXAO,
  VALIDADE_CACHE_MS,
  buscarVagas,
  contemTermo,
  converterIssue,
  filtrarVagas,
  lerCache,
  mensagemDeErro,
  modalidadeDaVaga,
  nivelDaVaga,
  normalizar,
  ordenarVagas,
  salvarCache,
  termosEncontrados,
  urlDaFonte,
  vagaDaArea,
  type IssueGitHub,
  type Vaga,
} from '../src/funcionalidades/carreiras/vagas'
import { separarPalavras, validarArea } from '../src/funcionalidades/carreiras/areas'

const AGORA = Date.parse('2026-11-10T12:00:00Z')

function issue(parcial: Partial<IssueGitHub> = {}): IssueGitHub {
  return {
    number: 1,
    title: '[Remoto] Desenvolvedor(a) Back-end Júnior - Node.js',
    html_url: 'https://github.com/backend-br/vagas/issues/1',
    created_at: '2026-11-01T10:00:00Z',
    labels: [{ name: 'Júnior' }, { name: 'Node.js' }, { name: 'Remoto' }],
    ...parcial,
  }
}

function vaga(parcial: Partial<Vaga> = {}): Vaga {
  return {
    fonte: 'backend-br/vagas',
    numero: 1,
    titulo: 'Dev Back-end',
    url: 'https://github.com/backend-br/vagas/issues/1',
    etiquetas: [],
    publicadaEm: '2026-11-01T10:00:00.000Z',
    nivel: null,
    modalidade: null,
    ...parcial,
  }
}

const backend = { id: 1, nome: 'Back-end', palavras_chave: ['back-end', 'java', 'node.js', 'c#', '.net'] }
const frontend = { id: 2, nome: 'Front-end', palavras_chave: ['front-end', 'react', 'javascript'] }

// Armazenamento falso (no lugar do localStorage).
function memoria(inicial: Record<string, string> = {}) {
  const dados = { ...inicial }
  return {
    dados,
    getItem: (k: string) => dados[k] ?? null,
    setItem: (k: string, v: string) => {
      dados[k] = v
    },
  }
}

function respostaJson(corpo: unknown, status = 200, cabecalhos: Record<string, string> = {}) {
  return new Response(JSON.stringify(corpo), { status, headers: cabecalhos })
}

describe('normalizar e contemTermo', () => {
  it('tira acento, deixa minúsculo e junta espaços', () => {
    expect(normalizar('  Híbrido   SÊNIOR ')).toBe('hibrido senior')
  })

  it('casa só o termo inteiro', () => {
    expect(contemTermo('Vaga Java Pleno', 'java')).toBe(true)
    expect(contemTermo('Vaga JavaScript', 'java')).toBe(false)
    expect(contemTermo('Dev React/Node', 'react')).toBe(true)
  })

  it('aceita termos com símbolos (c#, .net, node.js)', () => {
    expect(contemTermo('Dev C# .NET', 'c#')).toBe(true)
    expect(contemTermo('Dev C# .NET', '.net')).toBe(true)
    expect(contemTermo('Back-end Node.js', 'node.js')).toBe(true)
    expect(contemTermo('Dev internet', '.net')).toBe(false)
  })

  it('termo vazio não casa nada', () => {
    expect(contemTermo('qualquer coisa', '  ')).toBe(false)
  })

  it('procura de novo quando a primeira ocorrência é parte de outra palavra', () => {
    expect(contemTermo('javascript e java', 'java')).toBe(true)
  })
})

describe('áreas', () => {
  it('encontra os termos da área no título e nas etiquetas', () => {
    const v = vaga({ titulo: 'Dev Java', etiquetas: ['C#'] })
    expect(termosEncontrados(v, backend)).toEqual(['java', 'c#'])
    expect(vagaDaArea(v, backend)).toBe(true)
    expect(vagaDaArea(v, frontend)).toBe(false)
  })
})

describe('nível e modalidade', () => {
  it('prefere as etiquetas ao título', () => {
    expect(nivelDaVaga('Dev Sênior', ['Júnior'])).toBe('Júnior')
  })

  it('usa o título quando não há etiqueta de nível', () => {
    expect(nivelDaVaga('Estágio em desenvolvimento', [])).toBe('Estágio')
    expect(nivelDaVaga('Sr Software Engineer', [])).toBe('Sênior')
    expect(nivelDaVaga('Desenvolvedor', [])).toBeNull()
  })

  it('identifica a modalidade', () => {
    expect(modalidadeDaVaga('[Híbrido/Curitiba] Dev', [])).toBe('Híbrido')
    expect(modalidadeDaVaga('Dev', ['Remoto'])).toBe('Remoto')
    expect(modalidadeDaVaga('Dev', ['Alocado'])).toBe('Presencial')
    expect(modalidadeDaVaga('Dev', [])).toBeNull()
  })
})

describe('converterIssue', () => {
  it('guarda só os campos usados, com nível e modalidade', () => {
    const v = converterIssue({ ...issue(), body: 'contato: fulano@empresa.com' } as IssueGitHub, 'backend-br/vagas', AGORA)
    expect(v).toEqual({
      fonte: 'backend-br/vagas',
      numero: 1,
      titulo: '[Remoto] Desenvolvedor(a) Back-end Júnior - Node.js',
      url: 'https://github.com/backend-br/vagas/issues/1',
      etiquetas: ['Júnior', 'Node.js', 'Remoto'],
      publicadaEm: '2026-11-01T10:00:00.000Z',
      nivel: 'Júnior',
      modalidade: 'Remoto',
    })
    expect(JSON.stringify(v)).not.toContain('fulano')
  })

  it('aceita etiquetas como texto', () => {
    expect(converterIssue(issue({ labels: ['Pleno'] }), 'backend-br/vagas', AGORA)?.nivel).toBe('Pleno')
  })

  it('descarta pull requests, avisos, vagas paradas e links estranhos', () => {
    expect(converterIssue(issue({ pull_request: {} }), 'backend-br/vagas', AGORA)).toBeNull()
    expect(converterIssue(issue({ labels: [{ name: '⚠️ Avisos' }] }), 'frontendbr/vagas', AGORA)).toBeNull()
    expect(converterIssue(issue({ labels: [{ name: 'Stale' }] }), 'frontendbr/vagas', AGORA)).toBeNull()
    expect(converterIssue(issue({ html_url: 'https://site-falso.com/x' }), 'backend-br/vagas', AGORA)).toBeNull()
    expect(converterIssue(issue({ title: 1 as unknown as string }), 'backend-br/vagas', AGORA)).toBeNull()
  })

  it('descarta vagas com mais de 90 dias ou data inválida', () => {
    expect(converterIssue(issue({ created_at: '2026-07-01T00:00:00Z' }), 'backend-br/vagas', AGORA)).toBeNull()
    expect(converterIssue(issue({ created_at: 'ontem' }), 'backend-br/vagas', AGORA)).toBeNull()
  })
})

describe('ordenar e filtrar', () => {
  const lista = [
    vaga({ numero: 1, titulo: 'Dev Java', nivel: 'Júnior', publicadaEm: '2026-11-01T00:00:00.000Z' }),
    vaga({ numero: 2, titulo: 'Dev React em São Paulo', nivel: 'Sênior', publicadaEm: '2026-11-05T00:00:00.000Z' }),
    vaga({ numero: 3, titulo: 'Estágio Front-end', nivel: 'Estágio', publicadaEm: '2026-11-03T00:00:00.000Z' }),
  ]

  it('ordena das mais novas para as mais antigas', () => {
    expect(ordenarVagas(lista).map((v) => v.numero)).toEqual([2, 3, 1])
  })

  it('filtra por área', () => {
    expect(filtrarVagas(lista, { areas: [frontend], nivel: 'todos', busca: '' }).map((v) => v.numero)).toEqual([2, 3])
    expect(filtrarVagas(lista, { areas: [], nivel: 'todos', busca: '' })).toHaveLength(3)
  })

  it('filtra por nível ("inicio" = estágio e júnior)', () => {
    expect(filtrarVagas(lista, { areas: [], nivel: 'inicio', busca: '' }).map((v) => v.numero)).toEqual([1, 3])
    expect(filtrarVagas(lista, { areas: [], nivel: 'Sênior', busca: '' }).map((v) => v.numero)).toEqual([2])
  })

  it('busca sem diferenciar acento e maiúscula', () => {
    expect(filtrarVagas(lista, { areas: [], nivel: 'todos', busca: 'sao paulo' }).map((v) => v.numero)).toEqual([2])
  })
})

describe('cache', () => {
  it('salva e lê de volta', () => {
    const m = memoria()
    salvarCache(m, { salvoEm: AGORA, vagas: [vaga()] })
    expect(lerCache(m)).toEqual({ salvoEm: AGORA, vagas: [vaga()] })
  })

  it('ignora cache ausente, quebrado ou com vaga adulterada', () => {
    expect(lerCache(null)).toBeNull()
    expect(lerCache(memoria())).toBeNull()
    expect(lerCache(memoria({ [CHAVE_CACHE]: '{quebrado' }))).toBeNull()
    expect(lerCache(memoria({ [CHAVE_CACHE]: '{"vagas":[]}' }))).toBeNull()
    const adulterada = vaga({ url: 'javascript:alert(1)' })
    const m = memoria({ [CHAVE_CACHE]: JSON.stringify({ salvoEm: AGORA, vagas: [adulterada, vaga({ numero: 2 })] }) })
    expect(lerCache(m)?.vagas.map((v) => v.numero)).toEqual([2])
  })

  it('não quebra quando o navegador bloqueia o armazenamento', () => {
    const bloqueado = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('cheio')
      },
    }
    expect(lerCache(bloqueado)).toBeNull()
    expect(() => salvarCache(bloqueado, { salvoEm: AGORA, vagas: [] })).not.toThrow()
    expect(() => salvarCache(null, { salvoEm: AGORA, vagas: [] })).not.toThrow()
  })
})

describe('mensagemDeErro', () => {
  it('explica o limite de consultas, com o horário quando o GitHub informa', () => {
    const cab = new Headers({ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(AGORA / 1000) })
    expect(mensagemDeErro(403, cab)).toMatch(/depois das \d{2}:\d{2}/)
    expect(mensagemDeErro(429)).toMatch(/em alguns minutos/)
  })

  it('servidor fora do ar e falha de rede', () => {
    expect(mensagemDeErro(503)).toMatch(/fora do ar/)
    expect(mensagemDeErro(null)).toBe(MSG_SEM_CONEXAO)
    expect(mensagemDeErro(404)).toBe(MSG_SEM_CONEXAO)
  })
})

describe('buscarVagas', () => {
  const issueBackend = issue()
  const issueFrontend = issue({
    number: 9,
    title: '[Remoto] Front-end React Pleno',
    html_url: 'https://github.com/frontendbr/vagas/issues/9',
    created_at: '2026-11-08T10:00:00Z',
    labels: [],
  })

  function fetchFalso(porFonte: Record<string, () => Promise<Response>>) {
    return vi.fn((url: string) => {
      const fonte = Object.keys(porFonte).find((f) => url === urlDaFonte(f as never))
      return fonte ? porFonte[fonte]() : Promise.reject(new Error('url inesperada'))
    }) as unknown as typeof fetch
  }

  it('busca as duas fontes, ordena e salva no cache', async () => {
    const m = memoria()
    const fetchFn = fetchFalso({
      'backend-br/vagas': async () => respostaJson([issueBackend]),
      'frontendbr/vagas': async () => respostaJson([issueFrontend]),
    })
    const r = await buscarVagas({ fetchFn, armazenamento: m, agora: AGORA })
    expect(r.origem).toBe('api')
    expect(r.aviso).toBe('')
    expect(r.vagas.map((v) => v.numero)).toEqual([9, 1])
    expect(lerCache(m)?.vagas).toHaveLength(2)
  })

  it('usa o cache recente sem chamar o GitHub', async () => {
    const m = memoria()
    salvarCache(m, { salvoEm: AGORA - 60_000, vagas: [vaga()] })
    const fetchFn = vi.fn() as unknown as typeof fetch
    const r = await buscarVagas({ fetchFn, armazenamento: m, agora: AGORA })
    expect(r.origem).toBe('cache')
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('"Atualizar" ignora o cache recente', async () => {
    const m = memoria()
    salvarCache(m, { salvoEm: AGORA - 60_000, vagas: [] })
    const fetchFn = fetchFalso({
      'backend-br/vagas': async () => respostaJson([issueBackend]),
      'frontendbr/vagas': async () => respostaJson([]),
    })
    const r = await buscarVagas({ forcar: true, fetchFn, armazenamento: m, agora: AGORA })
    expect(r.origem).toBe('api')
    expect(r.vagas).toHaveLength(1)
  })

  it('GitHub fora do ar: mostra o cache antigo com aviso', async () => {
    const m = memoria()
    salvarCache(m, { salvoEm: AGORA - VALIDADE_CACHE_MS - 1, vagas: [vaga()] })
    const fetchFn = fetchFalso({
      'backend-br/vagas': async () => respostaJson({}, 503),
      'frontendbr/vagas': () => Promise.reject(new TypeError('Failed to fetch')),
    })
    const r = await buscarVagas({ fetchFn, armazenamento: m, agora: AGORA })
    expect(r.origem).toBe('cache-antigo')
    expect(r.aviso).toMatch(/fora do ar.*Mostrando as vagas salvas/)
  })

  it('GitHub fora do ar e sem cache: erro amigável', async () => {
    const fetchFn = fetchFalso({
      'backend-br/vagas': async () => respostaJson({ message: 'rate limit' }, 403, { 'x-ratelimit-remaining': '0' }),
      'frontendbr/vagas': async () => respostaJson({ message: 'rate limit' }, 403),
    })
    const promessa = buscarVagas({ fetchFn, armazenamento: memoria(), agora: AGORA })
    await expect(promessa).rejects.toBeInstanceOf(ErroVagas)
    await expect(promessa).rejects.toThrow(/limitou as consultas/)
  })

  it('uma fonte falha: usa a cópia antiga só dela e avisa', async () => {
    const m = memoria()
    const antiga = vaga({ fonte: 'frontendbr/vagas', numero: 50, url: 'https://github.com/frontendbr/vagas/issues/50' })
    salvarCache(m, { salvoEm: AGORA - VALIDADE_CACHE_MS - 1, vagas: [antiga, vaga({ numero: 77 })] })
    const fetchFn = fetchFalso({
      'backend-br/vagas': async () => respostaJson([issueBackend]),
      'frontendbr/vagas': async () => new Response('não é json', { status: 200 }),
    })
    const r = await buscarVagas({ fetchFn, armazenamento: m, agora: AGORA })
    expect(r.origem).toBe('api')
    expect(r.vagas.map((v) => v.numero).sort()).toEqual([1, 50])
    expect(r.aviso).toMatch(/frontendbr\/vagas/)
  })

  it('resposta que não é lista conta como falha', async () => {
    const fetchFn = fetchFalso({
      'backend-br/vagas': async () => respostaJson({ message: 'Not Found' }),
      'frontendbr/vagas': async () => respostaJson({ message: 'Not Found' }),
    })
    await expect(buscarVagas({ fetchFn, armazenamento: null, agora: AGORA })).rejects.toThrow(MSG_SEM_CONEXAO)
  })
})

describe('formulário de áreas', () => {
  it('separa, normaliza e tira repetidas as palavras-chave', () => {
    expect(separarPalavras('React, front-end ,, CSS, react, Segurança')).toEqual(['css', 'front-end', 'react', 'seguranca'])
  })

  const existentes = [{ id: 1, nome: 'Back-end' }]
  const ok = { nome: 'Dados', descricao: '', palavras: 'sql, bi' }

  it('aceita uma área válida', () => {
    expect(validarArea(ok, existentes, null)).toBe('')
  })

  it('recusa nome curto, longo ou repetido', () => {
    expect(validarArea({ ...ok, nome: ' a ' }, existentes, null)).toMatch(/nome da área/)
    expect(validarArea({ ...ok, nome: 'x'.repeat(61) }, existentes, null)).toMatch(/60 letras/)
    expect(validarArea({ ...ok, nome: 'BACK-END' }, existentes, null)).toMatch(/Já existe/)
    expect(validarArea({ ...ok, nome: 'Back-end' }, existentes, 1)).toBe('')
  })

  it('recusa descrição longa e palavras-chave inválidas', () => {
    expect(validarArea({ ...ok, descricao: 'x'.repeat(301) }, existentes, null)).toMatch(/300/)
    expect(validarArea({ ...ok, palavras: ' , ' }, existentes, null)).toMatch(/pelo menos uma/)
    const muitas = Array.from({ length: 41 }, (_, i) => `p${i}`).join(',')
    expect(validarArea({ ...ok, palavras: muitas }, existentes, null)).toMatch(/40 palavras/)
    expect(validarArea({ ...ok, palavras: 'x'.repeat(41) }, existentes, null)).toMatch(/40 letras/)
  })
})
