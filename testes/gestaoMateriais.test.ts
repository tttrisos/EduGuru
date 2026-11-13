import { describe, expect, it } from 'vitest'
import {
  contarPorStatus,
  filtrarMateriaisAdmin,
  ordenarMateriaisAdmin,
  type MaterialAdmin,
} from '../src/funcionalidades/materiais/gestaoMateriais'

function material(p: Partial<MaterialAdmin>): MaterialAdmin {
  return {
    id: 1,
    titulo: 'Apostila',
    link: null,
    arquivo_path: null,
    arquivo_nome: null,
    arquivo_tamanho: null,
    enviado_por: 'u1',
    disciplina_id: 10,
    descricao: null,
    status: 'aprovado',
    motivo_moderacao: null,
    criado_em: '2026-11-01T10:00:00Z',
    autor_nome: 'Ana Souza',
    autor_email: 'ana@exemplo.com',
    disciplina_nome: 'Banco de Dados',
    denuncias: 0,
    ...p,
  }
}

const lista = [
  material({ id: 1, titulo: 'Resumo de SQL', status: 'aprovado', link: 'https://youtube.com/watch?v=sql' }),
  material({ id: 2, titulo: 'Normalização', status: 'pendente', arquivo_nome: 'normalizacao.pdf', autor_nome: 'Bruno Lima', autor_email: 'bruno@x.com' }),
  material({ id: 3, titulo: 'Lógica básica', status: 'recusado', disciplina_id: null, disciplina_nome: null }),
  material({ id: 4, titulo: 'Joins', status: 'aprovado', disciplina_id: 20, disciplina_nome: 'Programação para Internet' }),
]

describe('contarPorStatus', () => {
  it('conta cada situação e o total', () => {
    expect(contarPorStatus(lista)).toEqual({ aprovado: 2, pendente: 1, recusado: 1, todos: 4 })
  })
})

describe('filtrarMateriaisAdmin', () => {
  const ids = (f: Parameters<typeof filtrarMateriaisAdmin>[1]) => filtrarMateriaisAdmin(lista, f).map((m) => m.id)

  it('por situação', () => {
    expect(ids({ status: 'aprovado', disciplina: '', busca: '' })).toEqual([1, 4])
    expect(ids({ status: 'todos', disciplina: '', busca: '' })).toEqual([1, 2, 3, 4])
  })

  it('por disciplina e sem disciplina', () => {
    expect(ids({ status: 'todos', disciplina: '20', busca: '' })).toEqual([4])
    expect(ids({ status: 'todos', disciplina: 'sem', busca: '' })).toEqual([3])
  })

  it('busca em título, autor, e-mail, link e arquivo, sem acento', () => {
    expect(ids({ status: 'todos', disciplina: '', busca: 'normalizacao' })).toEqual([2])
    expect(ids({ status: 'todos', disciplina: '', busca: 'BRUNO@' })).toEqual([2])
    expect(ids({ status: 'todos', disciplina: '', busca: 'youtube' })).toEqual([1])
    expect(ids({ status: 'todos', disciplina: '', busca: 'logica' })).toEqual([3])
    expect(ids({ status: 'todos', disciplina: '', busca: 'internet' })).toEqual([4])
  })
})

describe('ordenarMateriaisAdmin', () => {
  it('mais denunciados primeiro, depois os mais recentes', () => {
    const ordenados = ordenarMateriaisAdmin([
      material({ id: 1, criado_em: '2026-11-01T00:00:00Z' }),
      material({ id: 2, criado_em: '2026-11-05T00:00:00Z' }),
      material({ id: 3, criado_em: '2026-10-01T00:00:00Z', denuncias: 2 }),
    ])
    expect(ordenados.map((m) => m.id)).toEqual([3, 2, 1])
  })
})
