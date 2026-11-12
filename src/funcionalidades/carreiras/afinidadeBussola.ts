// Bússola EduGuru: autoavaliação de interesses (não é teste vocacional nem psicológico).
// O cálculo oficial da afinidade fica no banco (salvar_bussola, script 18); aqui ficam as regras
// de tela: escala, progresso, destaques do resultado e a junção com o desempenho no quiz.
import type { AreaSugerida } from '../../compartilhado/tipos'

export type Afirmacao = { id: number; texto: string; area_id: number; ordem: number }
export type AfinidadeBussola = { area_id: number; area: string; afinidade: number }
export type Respostas = Record<number, number>

export const ESCALA: { valor: number; rotulo: string }[] = [
  { valor: 1, rotulo: 'Nada a ver comigo' },
  { valor: 2, rotulo: 'Pouco a ver' },
  { valor: 3, rotulo: 'Mais ou menos' },
  { valor: 4, rotulo: 'Bastante a ver' },
  { valor: 5, rotulo: 'Tem tudo a ver comigo' },
]

// A partir de quanto a área é "em destaque" (mesmo corte do quiz no Carreiras).
export const AFINIDADE_MINIMA = 60

export function respondidas(afirmacoes: Afirmacao[], respostas: Respostas) {
  return afirmacoes.filter((a) => respostas[a.id] >= 1 && respostas[a.id] <= 5).length
}

export function progresso(afirmacoes: Afirmacao[], respostas: Respostas) {
  return afirmacoes.length === 0 ? 0 : Math.round((100 * respondidas(afirmacoes, respostas)) / afirmacoes.length)
}

export function completas(afirmacoes: Afirmacao[], respostas: Respostas) {
  return afirmacoes.length > 0 && respondidas(afirmacoes, respostas) === afirmacoes.length
}

// Primeira afirmação ainda sem resposta (para continuar de onde parou).
export function proximaSemResposta(afirmacoes: Afirmacao[], respostas: Respostas) {
  const i = afirmacoes.findIndex((a) => !(respostas[a.id] >= 1))
  return i === -1 ? afirmacoes.length - 1 : i
}

// Áreas em destaque: as de afinidade >= 60%, no máximo 3. Se nenhuma chegar a 60%,
// mostra só a maior (desde que não seja 0), para o resultado nunca ficar vazio.
export function destaques(resultado: AfinidadeBussola[]) {
  const ordenado = [...resultado].sort((a, b) => b.afinidade - a.afinidade || a.area.localeCompare(b.area))
  const fortes = ordenado.filter((r) => r.afinidade >= AFINIDADE_MINIMA).slice(0, 3)
  if (fortes.length > 0) return fortes
  return ordenado.length > 0 && ordenado[0].afinidade > 0 ? [ordenado[0]] : []
}

// Sugestão de área no Carreiras: pelo quiz (desempenho), pela Bússola (interesse) ou pelos dois.
export type SugestaoArea = {
  area_id: number
  area: string
  aproveitamento: number | null
  disciplinas: string[]
  afinidade: number | null
}

export function combinarSugestoes(desempenho: AreaSugerida[], bussola: AfinidadeBussola[]): SugestaoArea[] {
  const mapa = new Map<number, SugestaoArea>()
  for (const d of desempenho) {
    mapa.set(d.area_id, { area_id: d.area_id, area: d.area, aproveitamento: d.aproveitamento, disciplinas: d.disciplinas, afinidade: null })
  }
  for (const b of destaques(bussola)) {
    const atual = mapa.get(b.area_id)
    if (atual) atual.afinidade = b.afinidade
    else mapa.set(b.area_id, { area_id: b.area_id, area: b.area, aproveitamento: null, disciplinas: [], afinidade: b.afinidade })
  }
  // Primeiro as que aparecem nos dois, depois pela maior porcentagem.
  const nota = (s: SugestaoArea) => (s.aproveitamento !== null && s.afinidade !== null ? 1000 : 0) + Math.max(s.aproveitamento ?? 0, s.afinidade ?? 0)
  return [...mapa.values()].sort((a, b) => nota(b) - nota(a) || a.area.localeCompare(b.area))
}

// Texto do selo de cada vaga: por que ela aparece para o aluno.
export function motivoSugestao(s: SugestaoArea) {
  const quiz = s.aproveitamento !== null ? `você acerta ${s.aproveitamento}% em ${s.disciplinas.slice(0, 2).join(' e ')}` : ''
  const interesse = s.afinidade !== null ? `${s.afinidade}% de afinidade na Bússola` : ''
  if (quiz && interesse) return `${s.area}: ${quiz} e ${interesse}`
  return `${s.area}: ${quiz || interesse}`
}
