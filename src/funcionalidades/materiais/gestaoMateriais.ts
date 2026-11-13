// Gestão de todos os materiais pelo admin: filtros da lista "Todos os materiais".
import type { Material, StatusMaterial } from '../../compartilhado/tipos'
import { semAcento } from './filtroMateriais'

export type FiltroStatus = 'aprovado' | 'pendente' | 'recusado' | 'todos'

export const OPCOES_STATUS: { valor: FiltroStatus; label: string }[] = [
  { valor: 'aprovado', label: 'Publicados' },
  { valor: 'pendente', label: 'Em análise' },
  { valor: 'recusado', label: 'Recusados' },
  { valor: 'todos', label: 'Todos' },
]

export const ROTULO_STATUS: Record<StatusMaterial, string> = {
  aprovado: 'Publicado',
  pendente: 'Em análise',
  recusado: 'Recusado',
}

// Material com o que a tela do admin precisa: autor, disciplina e denúncias.
export type MaterialAdmin = Material & {
  autor_nome: string
  autor_email: string
  disciplina_nome: string | null
  denuncias: number
}

export function contarPorStatus(lista: Pick<Material, 'status'>[]): Record<FiltroStatus, number> {
  return {
    aprovado: lista.filter((m) => m.status === 'aprovado').length,
    pendente: lista.filter((m) => m.status === 'pendente').length,
    recusado: lista.filter((m) => m.status === 'recusado').length,
    todos: lista.length,
  }
}

// Filtra por situação, disciplina ('' = todas, 'sem' = sem disciplina) e busca livre
// (título, descrição, autor, e-mail, disciplina, link ou nome do arquivo), sem diferenciar acentos.
export function filtrarMateriaisAdmin(
  lista: MaterialAdmin[],
  filtro: { status: FiltroStatus; disciplina: string; busca: string },
) {
  const busca = semAcento(filtro.busca.trim())
  return lista.filter((m) => {
    if (filtro.status !== 'todos' && m.status !== filtro.status) return false
    if (filtro.disciplina === 'sem' && m.disciplina_id !== null) return false
    if (filtro.disciplina && filtro.disciplina !== 'sem' && String(m.disciplina_id) !== filtro.disciplina) return false
    if (busca) {
      const texto = semAcento(
        [m.titulo, m.descricao, m.autor_nome, m.autor_email, m.disciplina_nome, m.link, m.arquivo_nome].filter(Boolean).join(' '),
      )
      if (!texto.includes(busca)) return false
    }
    return true
  })
}

// Mais denunciados primeiro; depois os mais recentes.
export function ordenarMateriaisAdmin(lista: MaterialAdmin[]) {
  return [...lista].sort((a, b) => b.denuncias - a.denuncias || b.criado_em.localeCompare(a.criado_em))
}
