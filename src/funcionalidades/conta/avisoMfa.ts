// ============================================================
// funcionalidades/conta/avisoMfa.ts
// REGRA DO AVISO "ATIVE A VERIFICAÇÃO EM DUAS ETAPAS" (em Minha evolução), sem tela.
// Aparece para aluno sem MFA. "Agora não" esconde por 30 dias (guardado só neste navegador).
// Testes: testes/conta/.
// ============================================================

export const DIAS_ADIAMENTO = 30
export const CHAVE_ADIAMENTO = 'eduguru.aviso-mfa-adiado-ate'

// adiadoAte = data (ISO) guardada no navegador quando o aluno clicou em "Agora não", ou null.
export function deveMostrarAvisoMfa(temMfa: boolean, ehAdmin: boolean, adiadoAte: string | null, agora: Date) {
  if (temMfa || ehAdmin) return false
  if (!adiadoAte) return true
  const limite = new Date(adiadoAte)
  return Number.isNaN(limite.getTime()) || agora >= limite
}

export function dataDeAdiamento(agora: Date, dias = DIAS_ADIAMENTO) {
  return new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000).toISOString()
}
