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
// 15 perguntas no banco gera rodadas de 10, e o aluno vê só "10 perguntas" (o total do banco não
// interessa a ele; as rodadas seguintes trazem primeiro as que ele ainda não acertou).
//   0  → "Ainda sem perguntas"
//   7  → "7 perguntas"
//   15 → "10 perguntas"
export function textoPerguntasDoCartao(totalNoBanco: number): string {
  if (totalNoBanco <= 0) return 'Ainda sem perguntas'
  const naRodada = Math.min(totalNoBanco, PERGUNTAS_POR_RODADA)
  return naRodada === 1 ? '1 pergunta' : `${naRodada} perguntas`
}
