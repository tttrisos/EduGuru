export type Disciplina = {
  id: number
  nome: string
  curso: string
}

export type Pergunta = {
  id: number
  enunciado: string
  disciplina: string
  nivel: string
}

export type Material = {
  id: number
  titulo: string
  link: string | null
  arquivo_path: string | null
  arquivo_nome: string | null
  arquivo_tamanho: number | null
}

export const CURSOS = [
  { valor: 'SI', label: 'Sistemas de Informação' },
  { valor: 'ADS', label: 'Análise e Desenvolvimento de Sistemas' },
  { valor: 'ES', label: 'Engenharia de Software' },
]

// 'admin' cadastra perguntas/disciplinas e gerencia contas; 'aluno' só visualiza.
export type Papel = 'aluno' | 'admin'

export type Perfil = {
  id: string
  nome: string
  papel: Papel
  curso: string | null
  cidade: string | null
  estado: string | null
  criado_em: string
}

export type LogAuditoria = {
  id: number
  usuario_id: string | null
  usuario_email: string | null
  acao: string
  tabela: string | null
  registro_id: string | null
  detalhes: Record<string, unknown> | null
  criado_em: string
}
