// "cursos" lista todos os cursos que têm a disciplina na grade (ex.: Banco de Dados é de
// SI, ADS e ES); "curso" é o primeiro deles.
export type Disciplina = {
  id: number
  nome: string
  curso: string
  cursos: string[] | null
}

// Cursos da disciplina (antes do script 13 atualizado, só existe "curso").
export function cursosDa(d: Disciplina) {
  return d.cursos?.length ? d.cursos : [d.curso]
}

// A resposta certa fica na tabela "gabaritos", que só o admin lê.
export type Pergunta = {
  id: number
  enunciado: string
  disciplina_id: number | null
  nivel: Nivel
  alternativa_a: string | null
  alternativa_b: string | null
  alternativa_c: string | null
  alternativa_d: string | null
  imagem_path: string | null
}

export type Nivel = 'Fácil' | 'Médio' | 'Difícil'
export const NIVEIS: Nivel[] = ['Fácil', 'Médio', 'Difícil']

// Mesmos pontos da função finalizar_quiz do banco.
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
  descricao: string | null
  status: StatusMaterial
  motivo_moderacao: string | null
  criado_em: string
}

// Aprovado: aparece para todos. Pendente: aguardando o admin. Recusado: só o autor vê.
export type StatusMaterial = 'pendente' | 'aprovado' | 'recusado'

// Linha devolvida por materiais_da_comunidade(): só aprovados, com o autor.
export type MaterialComunidade = {
  id: number
  titulo: string
  descricao: string | null
  link: string | null
  arquivo_path: string | null
  arquivo_nome: string | null
  arquivo_tamanho: number | null
  disciplina_id: number | null
  disciplina: string | null
  autor_id: string
  autor_nome: string
  autor_curso: string | null
  criado_em: string
}

// Linha devolvida por materiais_em_moderacao() (só admin).
export type MaterialModeracao = {
  id: number
  titulo: string
  descricao: string | null
  link: string | null
  arquivo_path: string | null
  arquivo_nome: string | null
  arquivo_tamanho: number | null
  disciplina_id: number | null
  status: StatusMaterial
  motivo_moderacao: string | null
  autor_nome: string
  denuncias: number
  motivos_denuncias: string | null
}

// Devolvido por perfil_publico(): só nome abreviado e curso.
export type PerfilPublico = {
  nome: string
  curso: string | null
  equipe: boolean
  materiais: number
}

export const CURSOS = [
  { valor: 'SI', label: 'Sistemas de Informação' },
  { valor: 'ADS', label: 'Análise e Desenvolvimento de Sistemas' },
  { valor: 'ES', label: 'Engenharia de Software' },
]

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

// Versão vigente do Termo e da Política. Ao mudar, todos aceitam de novo.
export const VERSAO_TERMOS = '1.4'

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

// Quiz, ranking e Guru

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
  imagem_path: string | null
}

// Devolvido por responder_pergunta(): correção na hora, pergunta por pergunta.
export type RespostaPergunta = {
  gabarito: Letra
  acertou: boolean
  pontos: number
  explicacao: string | null
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

// Notas e faltas

export type Nota = {
  id: number
  disciplina_id: number
  m1: number | null
  nd: number | null
  ni: number | null
  m2: number | null
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

// EduGuru Carreiras

// Área de carreira (tabela areas_carreira); as palavras-chave filtram as vagas.
export type AreaCarreira = {
  id: number
  nome: string
  descricao: string | null
  palavras_chave: string[]
}

// Ligação disciplina → área (tabela disciplinas_areas).
export type DisciplinaArea = {
  disciplina_id: number
  area_id: number
}

// Linha devolvida por minhas_areas_carreira(): áreas em que o aluno vai bem no quiz.
export type AreaSugerida = {
  area_id: number
  area: string
  aproveitamento: number
  disciplinas: string[]
}

// Devolvido por estatisticas_carreiras() (só admin).
export type EstatisticasCarreiras = {
  cliques: number
  cliques_30_dias: number
  alunos_que_clicaram: number
  cliques_por_area: { area: string; total: number }[]
  vagas_mais_clicadas: { titulo: string; total: number }[]
}

// Devolvido por estatisticas_bussola() (só admin): totais, sem identificar ninguém.
export type EstatisticasBussola = {
  respondidas: number
  area_preferida: { area: string; total: number }[]
}
