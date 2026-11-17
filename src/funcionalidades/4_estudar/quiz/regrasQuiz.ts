// ============================================================
// funcionalidades/4_estudar/quiz/regrasQuiz.ts
// Regras do quiz que não dependem de tela nem de banco (por isso têm teste unitário).
// Usado por: Quiz.tsx (cartões das disciplinas). Teste: testes/4_estudar/quiz/regrasQuiz.test.ts
// ============================================================

// Máximo de perguntas por rodada. É o mesmo "limit 10" da função iniciar_quiz
// (supabase/19_quiz_embaralhado.sql): se mudar lá, mude aqui também.
export const PERGUNTAS_POR_RODADA = 10

// Texto do cartão de cada disciplina na tela do quiz.
// O cartão mostra quantas perguntas a RODADA vai ter, e não o total cadastrado: uma disciplina com
// 15 perguntas no banco gera rodadas de 10. Quando o banco tem mais que isso, o total vai entre
// parênteses, para o aluno saber que as rodadas seguintes podem trazer perguntas diferentes.
//   0  → "Ainda sem perguntas"
//   7  → "Rodada de 7 perguntas"
//   15 → "Rodada de 10 perguntas (de 15 no banco)"
export function textoPerguntasDoCartao(totalNoBanco: number): string {
  if (totalNoBanco <= 0) return 'Ainda sem perguntas'
  const naRodada = Math.min(totalNoBanco, PERGUNTAS_POR_RODADA)
  const plural = naRodada === 1 ? 'pergunta' : 'perguntas'
  if (totalNoBanco <= PERGUNTAS_POR_RODADA) return `Rodada de ${naRodada} ${plural}`
  return `Rodada de ${naRodada} ${plural} (de ${totalNoBanco} no banco)`
}
