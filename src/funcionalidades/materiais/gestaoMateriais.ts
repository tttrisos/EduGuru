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

// Ações em massa de cada situação (valem para todos os materiais da lista filtrada, não só a página).
export type AcaoMassa = 'publicar' | 'retirar' | 'excluir'

export const ACOES_POR_STATUS: Record<FiltroStatus, AcaoMassa[]> = {
  aprovado: ['retirar', 'excluir'],
  pendente: ['publicar', 'excluir'],
  recusado: ['publicar', 'excluir'],
  todos: ['excluir'],
}

export const ROTULO_ACAO: Record<AcaoMassa, string> = {
  publicar: 'Publicar todos',
  retirar: 'Retirar todos do ar',
  excluir: 'Excluir todos',
}

// Texto exato que o admin precisa digitar para confirmar (ex.: "EXCLUIR 5").
export function textoConfirmacao(acao: AcaoMassa, quantidade: number) {
  return `${acao === 'excluir' ? 'EXCLUIR' : acao === 'publicar' ? 'PUBLICAR' : 'RETIRAR'} ${quantidade}`
}

// Resumo do que a ação em massa vai atingir, para o aviso ao admin.
export function resumoAlvo(
  lista: MaterialAdmin[],
  filtro: { status: FiltroStatus; disciplina: string; busca: string },
  nomeDisciplina: (id: string) => string,
) {
  const situacao = OPCOES_STATUS.find((o) => o.valor === filtro.status)?.label ?? 'Todos'
  const filtros: string[] = []
  if (filtro.disciplina === 'sem') filtros.push('sem disciplina')
  else if (filtro.disciplina) filtros.push(`disciplina "${nomeDisciplina(filtro.disciplina)}"`)
  if (filtro.busca.trim()) filtros.push(`busca "${filtro.busca.trim()}"`)
  return {
    quantidade: lista.length,
    situacao,
    filtros: filtros.length > 0 ? filtros.join(' e ') : 'nenhum',
    comArquivo: lista.filter((m) => m.arquivo_path).length,
    denunciados: lista.filter((m) => m.denuncias > 0).length,
    autores: new Set(lista.map((m) => m.enviado_por ?? m.autor_nome)).size,
  }
}
