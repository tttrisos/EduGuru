// Regras do Dashboard Acadêmico (notas e faltas). Ficam aqui, em funções
// "puras" (sem tela e sem banco), para serem fáceis de entender e de testar.
//
// Regra adotada (RF29 na monografia), a mesma do boletim do portal da UMC:
//   M1 = resultado das avaliações do 1º bimestre
//   ND = resultado das avaliações do 2º bimestre
//   NI = nota da avaliação integrada
//   M2 = ND × 70% + NI × 30%           (média do 2º bimestre)
//   MD = (M1 + M2 × 2) / 3             (média; o 2º bimestre pesa o dobro)
//   MS = média semestral (nota única)  -> quando existe, substitui a MD
//   MD >= 6                            -> Aprovado
//   MD <  6                            -> faz Exame; MF = (MD + EX) / 2
//   MF >= 5                            -> Aprovado no exame; senão -> Reprovado
//   faltas > 25% das aulas             -> Reprovado por falta (vale mais que a nota)
// As médias são arredondadas para 1 casa decimal, como no portal.
// Se a regra oficial mudar, só estas constantes e a função calcularSituacao mudam.

export const PESO_ND = 0.7
export const PESO_NI = 0.3
export const MEDIA_APROVACAO = 6
export const MEDIA_APROVACAO_EXAME = 5
export const PERCENTUAL_MAXIMO_FALTAS = 0.25

export type Situacao =
  | 'Aguardando notas'
  | 'Aprovado'
  | 'Em exame'
  | 'Aprovado no exame'
  | 'Reprovado'
  | 'Reprovado por falta'

// Notas digitadas pelo aluno (null = ainda não saiu).
export type NotasDigitadas = {
  m1: number | null
  nd: number | null
  ni: number | null
  ms: number | null
  exame: number | null
}

export type ResultadoNotas = {
  m2: number | null
  md: number | null
  mediaFinal: number | null
  situacao: Situacao
  limiteFaltas: number
  faltasRestantes: number
  // true quando já usou 75% ou mais do limite de faltas
  alertaFaltas: boolean
}

// Arredonda para 1 casa decimal (ex.: 2,033 -> 2,0).
function arredondar(valor: number) {
  return Math.round(valor * 10) / 10
}

export function limiteDeFaltas(totalAulas: number) {
  return Math.floor(totalAulas * PERCENTUAL_MAXIMO_FALTAS)
}

// M2 = ND × 70% + NI × 30% (só quando as duas notas já saíram).
export function calcularM2(nd: number | null, ni: number | null) {
  if (nd === null || ni === null) return null
  return arredondar(nd * PESO_ND + ni * PESO_NI)
}

// MD = (M1 + M2 × 2) / 3. Se a disciplina tem nota única (MS), ela vale como MD.
export function calcularMD(m1: number | null, m2: number | null, ms: number | null) {
  if (ms !== null) return ms
  if (m1 === null || m2 === null) return null
  return arredondar((m1 + m2 * 2) / 3)
}

export function calcularSituacao(notas: NotasDigitadas, faltas: number, totalAulas: number): ResultadoNotas {
  const limite = limiteDeFaltas(totalAulas)
  const faltasInfo = {
    limiteFaltas: limite,
    faltasRestantes: Math.max(limite - faltas, 0),
    alertaFaltas: faltas >= limite * 0.75,
  }

  const m2 = calcularM2(notas.nd, notas.ni)
  const md = calcularMD(notas.m1, m2, notas.ms)
  const base = { m2, md, ...faltasInfo }

  if (faltas > limite) {
    return { ...base, mediaFinal: null, situacao: 'Reprovado por falta' }
  }
  if (md === null) {
    return { ...base, mediaFinal: null, situacao: 'Aguardando notas' }
  }
  if (md >= MEDIA_APROVACAO) {
    return { ...base, mediaFinal: md, situacao: 'Aprovado' }
  }
  if (notas.exame === null) {
    return { ...base, mediaFinal: null, situacao: 'Em exame' }
  }

  const mediaFinal = arredondar((md + notas.exame) / 2)
  const situacao = mediaFinal >= MEDIA_APROVACAO_EXAME ? 'Aprovado no exame' : 'Reprovado'
  return { ...base, mediaFinal, situacao }
}

// Valida o que o aluno digitou: vazio = ainda não saiu (null); senão,
// número de 0 a 10 com vírgula ou ponto. Devolve a mensagem de erro, se houver.
export function lerNota(texto: string): { valor: number | null; erro: string | null } {
  const limpo = texto.trim().replace(',', '.')
  if (limpo === '') return { valor: null, erro: null }
  const valor = Number(limpo)
  if (Number.isNaN(valor)) return { valor: null, erro: 'A nota precisa ser um número.' }
  if (valor < 0 || valor > 10) return { valor: null, erro: 'A nota precisa estar entre 0 e 10.' }
  return { valor: Math.round(valor * 100) / 100, erro: null }
}
