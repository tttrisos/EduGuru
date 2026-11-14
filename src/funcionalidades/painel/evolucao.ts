// Regras da tela "Minha evolução" (painel do aluno). Ficam aqui, separadas da tela,
// para poderem ser testadas (testes/evolucao.test.ts).
//
// De onde vêm os dados: a função do banco meu_desempenho() (supabase/11_quiz_ranking_guru.sql)
// devolve, por disciplina, quantas perguntas o aluno respondeu e quantas acertou.
// Os cortes são os mesmos do resto do sistema:
//   - 5 respostas ou mais = já dá para avaliar a disciplina;
//   - 60% ou mais = "dominada" (vira área sugerida no Carreiras);
//   - abaixo de 60% = "para revisar" (o Guru indica materiais).
import type { DesempenhoDisciplina } from '../../compartilhado/tipos'

export const MINIMO_RESPOSTAS = 5
export const APROVEITAMENTO_BOM = 60

export type ResumoEvolucao = {
  praticadas: number // disciplinas com pelo menos 1 resposta
  dominadas: number // >= 60% com 5+ respostas
  paraRevisar: number // < 60% com 5+ respostas
  emAndamento: number // menos de 5 respostas: ainda cedo para avaliar
  aproveitamentoGeral: number | null // acertos ÷ respostas, em %, de todas as disciplinas
}

export function resumirEvolucao(desempenho: DesempenhoDisciplina[]): ResumoEvolucao {
  const avaliaveis = desempenho.filter((d) => d.respondidas >= MINIMO_RESPOSTAS)
  const respondidas = desempenho.reduce((soma, d) => soma + d.respondidas, 0)
  const acertos = desempenho.reduce((soma, d) => soma + d.acertos, 0)
  return {
    praticadas: desempenho.filter((d) => d.respondidas > 0).length,
    dominadas: avaliaveis.filter((d) => d.aproveitamento >= APROVEITAMENTO_BOM).length,
    paraRevisar: avaliaveis.filter((d) => d.aproveitamento < APROVEITAMENTO_BOM).length,
    emAndamento: desempenho.filter((d) => d.respondidas > 0 && d.respondidas < MINIMO_RESPOSTAS).length,
    aproveitamentoGeral: respondidas > 0 ? Math.round((acertos / respondidas) * 100) : null,
  }
}

// Frase da etapa "Aprender" da jornada, conforme o momento do aluno.
export function fraseAprender(r: ResumoEvolucao) {
  if (r.praticadas === 0) return 'Comece praticando uma disciplina do seu curso.'
  if (r.dominadas === 0 && r.paraRevisar === 0) return 'Continue praticando: com 5 respostas a disciplina já é avaliada.'
  return `Você domina ${r.dominadas} de ${r.dominadas + r.paraRevisar} disciplinas avaliadas.`
}
