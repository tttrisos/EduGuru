export type Disciplina = {
  id: number
  nome: string
  curso: string
  // Base do limite de faltas (25% das aulas). Ver src/lib/notas.ts.
  total_aulas: number
}

// A resposta certa NÃO fica aqui: está na tabela "gabaritos", que só o
// admin lê (supabase_atualizacao_11.sql).
export type Pergunta = {
  id: number
  enunciado: string
  disciplina_id: number | null
  nivel: Nivel
  alternativa_a: string | null
  alternativa_b: string | null
  alternativa_c: string | null
  alternativa_d: string | null
}

export type Nivel = 'Fácil' | 'Médio' | 'Difícil'
export const NIVEIS: Nivel[] = ['Fácil', 'Médio', 'Difícil']

// Mesma tabela de pontos usada na função finalizar_quiz do banco.
export const PONTOS_POR_NIVEL: Record<Nivel, number> = { Fácil: 10, Médio: 20, Difícil: 30 }

export type Letra = 'A' | 'B' | 'C' | 'D'
export const LETRAS: Letra[] = ['A', 'B', 'C', 'D']

export type Material = {
  id: number
  titulo: string
  link: string | null
  arquivo_path: string | null
  arquivo_nome: string | null
  arquivo_tamanho: number | null
  enviado_por: string | null
  disciplina_id: number | null
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
  consentimento_aceito: boolean
  consentimento_em: string | null
  versao_termos: string | null
  aparecer_no_ranking: boolean
  criado_em: string
}

// Versão vigente do Termo de Aceite + Política de Privacidade. Gravada no
// perfil no momento do aceite (cadastro). Mudar aqui quando os documentos
// mudarem de versão — quem aceitou a versão antiga vê a tela de novo aceite.
export const VERSAO_TERMOS = '1.2'

// Linha devolvida pela função listar_usuarios_admin() (só admin).
export type UsuarioAdmin = {
  id: string
  nome: string
  email: string
  curso: string | null
  papel: Papel
  criado_em: string
  mfa_ativo: boolean
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

// ---------- Quiz, ranking e Guru (supabase_atualizacao_11.sql) ----------

// Linha devolvida por iniciar_quiz(): pergunta sorteada, sem gabarito.
export type QuestaoQuiz = {
  tentativa_id: number
  pergunta_id: number
  enunciado: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  nivel: Nivel
}

// Linha devolvida por finalizar_quiz(): correção de uma pergunta.
export type CorrecaoQuiz = {
  pergunta_id: number
  resposta: Letra | null
  gabarito: Letra
  acertou: boolean
  pontos: number
}

// Uma rodada já jogada (tabela tentativas_quiz; o aluno lê só as dele).
export type TentativaQuiz = {
  id: number
  disciplina_id: number | null
  iniciada_em: string
  finalizada_em: string | null
  total_perguntas: number
  acertos: number
  pontos: number
}

export type LinhaRanking = {
  posicao: number
  nome: string
  pontos: number
  eh_voce: boolean
}

export type DesempenhoDisciplina = {
  disciplina_id: number
  disciplina: string
  respondidas: number
  acertos: number
  aproveitamento: number
}

export type RecomendacaoGuru = {
  disciplina_id: number
  disciplina: string
  aproveitamento: number
  material_id: number | null
  titulo: string | null
  link: string | null
  arquivo_path: string | null
  arquivo_nome: string | null
}

// ---------- Notas e faltas (supabase_atualizacao_12.sql) ----------

export type Nota = {
  id: number
  disciplina_id: number
  m1: number | null
  nd: number | null
  ni: number | null
  ms: number | null
  exame: number | null
  faltas: number
  atualizado_em: string
}

export type EstatisticasAdmin = {
  alunos: number
  disciplinas: number
  perguntas_prontas: number
  materiais: number
  quizzes: number
  aproveitamento_geral: number
  quizzes_por_dia: { dia: string; total: number }[]
  aproveitamento_por_disciplina: { disciplina: string; aproveitamento: number }[]
}
