// Máximo de perguntas por rodada. É o mesmo "limit 10" da função iniciar_quiz
// (supabase/19_quiz_embaralhado.sql): se mudar lá, mude aqui também.
export const PERGUNTAS_POR_RODADA = 10

// O cartão mostra quantas perguntas a rodada terá (no máximo 10), e não o total cadastrado.
export function textoPerguntasDoCartao(totalNoBanco: number): string {
  if (totalNoBanco <= 0) return 'Ainda sem perguntas'
  const naRodada = Math.min(totalNoBanco, PERGUNTAS_POR_RODADA)
  return naRodada === 1 ? '1 pergunta' : `${naRodada} perguntas`
}
