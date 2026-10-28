// Regras do Dashboard Acadêmico (notas e faltas). Ficam aqui, em funções
// "puras" (sem tela e sem banco), para serem fáceis de entender e de testar.
//
// Regra adotada (RF29 na monografia):
//   ND (nota de desempenho) = (M1 + M2) / 2
//   ND >= 6                  -> Aprovado
//   ND <  6                  -> faz Exame; média final = (ND + Exame) / 2
//   média final >= 5         -> Aprovado no exame; senão -> Reprovado
//   faltas > 25% das aulas   -> Reprovado por falta (vale mais que a nota)
// Se a regra oficial do curso for outra, só estas constantes e a função
// calcularSituacao mudam.

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

export type ResultadoNotas = {
  nd: number | null
  mediaFinal: number | null
  situacao: Situacao
  limiteFaltas: number
  faltasRestantes: number
  // true quando já usou 75% ou mais do limite de faltas
  alertaFaltas: boolean
}

function arredondar(valor: number) {
  return Math.round(valor * 100) / 100
}

export function limiteDeFaltas(totalAulas: number) {
  return Math.floor(totalAulas * PERCENTUAL_MAXIMO_FALTAS)
}

export function calcularSituacao(
  m1: number | null,
  m2: number | null,
  exame: number | null,
  faltas: number,
  totalAulas: number,
): ResultadoNotas {
  const limite = limiteDeFaltas(totalAulas)
  const faltasInfo = {
    limiteFaltas: limite,
    faltasRestantes: Math.max(limite - faltas, 0),
    alertaFaltas: faltas >= limite * 0.75,
  }

  const nd = m1 !== null && m2 !== null ? arredondar((m1 + m2) / 2) : null

  if (faltas > limite) {
    return { nd, mediaFinal: null, situacao: 'Reprovado por falta', ...faltasInfo }
  }
  if (nd === null) {
    return { nd, mediaFinal: null, situacao: 'Aguardando notas', ...faltasInfo }
  }
  if (nd >= MEDIA_APROVACAO) {
    return { nd, mediaFinal: nd, situacao: 'Aprovado', ...faltasInfo }
  }
  if (exame === null) {
    return { nd, mediaFinal: null, situacao: 'Em exame', ...faltasInfo }
  }

  const mediaFinal = arredondar((nd + exame) / 2)
  const situacao = mediaFinal >= MEDIA_APROVACAO_EXAME ? 'Aprovado no exame' : 'Reprovado'
  return { nd, mediaFinal, situacao, ...faltasInfo }
}

// Valida o que o aluno digitou: vazio = ainda não saiu (null); senão,
// número de 0 a 10 com vírgula ou ponto. Devolve a mensagem de erro, se houver.
export function lerNota(texto: string): { valor: number | null; erro: string | null } {
  const limpo = texto.trim().replace(',', '.')
  if (limpo === '') return { valor: null, erro: null }
  const valor = Number(limpo)
  if (Number.isNaN(valor)) return { valor: null, erro: 'A nota precisa ser um número.' }
  if (valor < 0 || valor > 10) return { valor: null, erro: 'A nota precisa estar entre 0 e 10.' }
  return { valor: arredondar(valor), erro: null }
}
