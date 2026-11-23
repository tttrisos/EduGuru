import { describe, expect, it } from 'vitest'
import {
  acoesDaCategoria,
  categoriaDaAcao,
  filtrarLogs,
  inicioDoPeriodo,
  totaisPorCategoria,
} from '../../src/compartilhado/utilitarios/filtroLogs'
import type { LogAuditoria } from '../../src/compartilhado/tipos'

const agora = new Date('2026-11-14T12:00:00Z')
const diasAtras = (d: number) => new Date(agora.getTime() - d * 86400000).toISOString()
const log = (id: number, acao: string, dias: number, extra: Partial<LogAuditoria> = {}): LogAuditoria => ({
  id, usuario_id: 'u', usuario_email: 'ana@x.com', acao, tabela: null, registro_id: null, detalhes: null,
  criado_em: diasAtras(dias), ...extra,
})

const lista = [
  log(1, 'login', 0, { detalhes: { aparelho: 'Chrome no Windows' } }),
  log(2, 'login', 10, { detalhes: { aparelho: 'Safari no iPhone' } }),
  log(3, 'senha_alterada', 2),
  log(4, 'editar', 3, { tabela: 'perfis' }),
  log(5, 'quiz_finalizado', 40),
  log(6, 'mfa_ativado', 1),
]

describe('categorias', () => {
  it('cada ação cai na sua categoria', () => {
    expect(categoriaDaAcao('login')).toBe('acessos')
    expect(categoriaDaAcao('mfa_desativado')).toBe('acessos')
    expect(categoriaDaAcao('senha_redefinida')).toBe('senha')
    expect(categoriaDaAcao('excluir')).toBe('alteracoes')
    expect(categoriaDaAcao('inventada')).toBeNull()
    expect(acoesDaCategoria('todos')).toBeNull()
  })

  it('a limpeza dos cadastros não confirmados (script 31) fica em Sistema', () => {
    expect(categoriaDaAcao('limpeza_cadastros')).toBe('sistema')
  })

  it('o download dos próprios dados (script 33) fica em Sistema, junto da exclusão de conta', () => {
    expect(categoriaDaAcao('dados_exportados')).toBe('sistema')
    expect(acoesDaCategoria('sistema')).toContain('conta_excluida')
  })
})

describe('filtrarLogs', () => {
  it('sem filtro (90 dias) traz tudo', () => {
    expect(filtrarLogs(lista, { categoria: 'todos', dias: 90, busca: '' }, agora)).toHaveLength(6)
  })

  it('filtra por categoria', () => {
    expect(filtrarLogs(lista, { categoria: 'acessos', dias: 90, busca: '' }, agora).map((l) => l.id)).toEqual([1, 2, 6])
  })

  it('filtra por período', () => {
    expect(filtrarLogs(lista, { categoria: 'todos', dias: 7, busca: '' }, agora).map((l) => l.id)).toEqual([1, 3, 4, 6])
  })

  it('busca pelo nome da ação, tabela ou aparelho, sem acento', () => {
    expect(filtrarLogs(lista, { categoria: 'todos', dias: 90, busca: 'iphone' }, agora).map((l) => l.id)).toEqual([2])
    expect(filtrarLogs(lista, { categoria: 'todos', dias: 90, busca: 'perfis' }, agora).map((l) => l.id)).toEqual([4])
    expect(filtrarLogs(lista, { categoria: 'todos', dias: 90, busca: 'SENHA ALTERADA' }, agora).map((l) => l.id)).toEqual([3])
  })

  it('combina os filtros', () => {
    expect(filtrarLogs(lista, { categoria: 'acessos', dias: 7, busca: 'chrome' }, agora).map((l) => l.id)).toEqual([1])
  })
})

describe('totais e período', () => {
  it('conta por categoria', () => {
    const t = totaisPorCategoria(lista)
    expect(t).toMatchObject({ todos: 6, acessos: 3, senha: 1, alteracoes: 1, quiz: 1, sistema: 0 })
  })

  it('início do período', () => {
    expect(inicioDoPeriodo(7, agora)).toBe('2026-11-07T12:00:00.000Z')
  })
})
