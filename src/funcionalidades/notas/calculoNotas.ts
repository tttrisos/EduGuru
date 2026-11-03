// Regras de notas e faltas (RF29), iguais às do boletim da UMC:
//   M1 = resultado das avaliações do 1º bimestre
//   ND = resultado das avaliações do 2º bimestre
//   NI = nota da avaliação integrada
//   M2 = ND × 70% + NI × 30%           (média do 2º bimestre; ou digitada pelo aluno)
//   MD = (M1 + M2 × 2) / 3             (média; o 2º bimestre pesa o dobro;
//                                       nota que ainda não saiu conta como 0, como no portal)
//   MS = média semestral (nota única)  -> quando existe, substitui a MD
//   MF = MD assim que as notas do semestre saem (M1 e M2, ou MS)
//   MD >= 5                            -> Aprovado
//   MD <  5                            -> faz Exame; MF = (MD + EX) / 2
//   MF >= 5                            -> Aprovado no exame; senão -> Reprovado
//   faltas > 40                        -> Reprovado por falta (vale mais que a nota)
// Faltas: 4 por dia de aula, 2 por módulo.
// Médias arredondadas para 1 casa decimal.

export const PESO_ND = 0.7
export const PESO_NI = 0.3
export const MEDIA_APROVACAO = 5
export const MEDIA_APROVACAO_EXAME = 5
export const LIMITE_FALTAS = 40
export const FALTAS_POR_DIA = 4
export const FALTAS_POR_MODULO = 2

export type SituacaoNotas = 'Aguardando notas' | 'Aprovado' | 'Em exame' | 'Aprovado no exame' | 'Reprovado'
export type SituacaoFrequencia = 'Frequência OK' | 'Atenção às faltas' | 'Reprovado por falta'
export type Situacao = SituacaoNotas | 'Reprovado por falta'

// Notas digitadas pelo aluno (null = ainda não saiu).
export type NotasDigitadas = {
  m1: number | null
  nd: number | null
  ni: number | null
  m2: number | null
  ms: number | null
  exame: number | null
}

export type ResultadoNotas = {
  m2: number | null
  md: number | null
  mediaFinal: number | null
  situacao: SituacaoNotas
}

export type ResultadoFrequencia = {
  limiteFaltas: number
  faltasRestantes: number
  // dias inteiros que ainda pode faltar sem passar do limite
  diasRestantes: number
  // true quando já usou 75% ou mais do limite de faltas
  alertaFaltas: boolean
  situacao: SituacaoFrequencia
}

function arredondar(valor: number) {
  return Math.round(valor * 10) / 10
}

// M2 = ND × 70% + NI × 30% (só quando as duas notas já saíram).
export function calcularM2(nd: number | null, ni: number | null) {
  if (nd === null || ni === null) return null
  return arredondar(nd * PESO_ND + ni * PESO_NI)
}

// MD = (M1 + M2 × 2) / 3, calculada já com a M1 (a M2 que falta conta como 0).
// Se a disciplina tem nota única (MS), ela vale como MD.
export function calcularMD(m1: number | null, m2: number | null, ms: number | null) {
  if (ms !== null) return ms
  if (m1 === null && m2 === null) return null
  return arredondar(((m1 ?? 0) + (m2 ?? 0) * 2) / 3)
}

// 1º cálculo: notas (M2, MD, MF e situação), sem olhar as faltas.
export function calcularNotas(notas: NotasDigitadas): ResultadoNotas {
  // M2 calculada pelo ND e NI; sem eles, vale a M2 digitada pelo aluno.
  const m2 = calcularM2(notas.nd, notas.ni) ?? notas.m2
  const md = calcularMD(notas.m1, m2, notas.ms)

  // Enquanto falta nota do semestre, a MD é parcial e ainda não há MF.
  const semestreFechado = notas.ms !== null || (notas.m1 !== null && m2 !== null)
  if (md === null || !semestreFechado) return { m2, md, mediaFinal: null, situacao: 'Aguardando notas' }
  if (md >= MEDIA_APROVACAO) return { m2, md, mediaFinal: md, situacao: 'Aprovado' }
  if (notas.exame === null) return { m2, md, mediaFinal: md, situacao: 'Em exame' }

  const mediaFinal = arredondar((md + notas.exame) / 2)
  const situacao = mediaFinal >= MEDIA_APROVACAO_EXAME ? 'Aprovado no exame' : 'Reprovado'
  return { m2, md, mediaFinal, situacao }
}

// 2º cálculo: frequência (limite de 40 faltas), sem olhar as notas.
export function calcularFrequencia(faltas: number): ResultadoFrequencia {
  const faltasRestantes = Math.max(LIMITE_FALTAS - faltas, 0)
  const alertaFaltas = faltas >= LIMITE_FALTAS * 0.75
  let situacao: SituacaoFrequencia = 'Frequência OK'
  if (faltas > LIMITE_FALTAS) situacao = 'Reprovado por falta'
  else if (alertaFaltas) situacao = 'Atenção às faltas'
  return {
    limiteFaltas: LIMITE_FALTAS,
    faltasRestantes,
    diasRestantes: Math.floor(faltasRestantes / FALTAS_POR_DIA),
    alertaFaltas,
    situacao,
  }
}

// Faltas vêm de 2 em 2 (cada módulo faltado conta 2).
export function validarFaltas(faltas: number): string | null {
  if (!Number.isInteger(faltas) || faltas < 0) return 'Faltas precisa ser um número inteiro, zero ou maior.'
  if (faltas > 400) return 'Número de faltas alto demais.'
  if (faltas % FALTAS_POR_MODULO !== 0) return 'As faltas vão de 2 em 2 (cada módulo faltado conta 2).'
  return null
}

// Situação final da disciplina: reprovar por falta vale mais que a nota.
export function calcularSituacao(notas: NotasDigitadas, faltas: number) {
  const resultadoNotas = calcularNotas(notas)
  const frequencia = calcularFrequencia(faltas)
  const reprovadoPorFalta = frequencia.situacao === 'Reprovado por falta'
  return {
    ...resultadoNotas,
    ...frequencia,
    mediaFinal: reprovadoPorFalta ? null : resultadoNotas.mediaFinal,
    situacao: (reprovadoPorFalta ? 'Reprovado por falta' : resultadoNotas.situacao) as Situacao,
  }
}

// Campo vazio = nota ainda não saiu. Aceita vírgula ou ponto, de 0 a 10.
export function lerNota(texto: string): { valor: number | null; erro: string | null } {
  const limpo = texto.trim().replace(',', '.')
  if (limpo === '') return { valor: null, erro: null }
  const valor = Number(limpo)
  if (Number.isNaN(valor)) return { valor: null, erro: 'A nota precisa ser um número.' }
  if (valor < 0 || valor > 10) return { valor: null, erro: 'A nota precisa estar entre 0 e 10.' }
  return { valor: Math.round(valor * 100) / 100, erro: null }
}
