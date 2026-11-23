// O Supabase só limita a duração da sessão nos planos pagos; por isso o próprio site encerra
// a sessão depois de 30 minutos sem uso, contando a atividade em qualquer aba.

export const LIMITE_INATIVIDADE_MS = 30 * 60 * 1000
export const INTERVALO_GRAVACAO_MS = 15 * 1000
export const INTERVALO_CONFERENCIA_MS = 30 * 1000
export const CHAVE_ULTIMA_ATIVIDADE = 'eduguru_ultima_atividade'
export const AVISO_SESSAO_EXPIRADA = 'Sua sessão expirou depois de 30 minutos sem uso. Entre de novo.'

// A sessão expirou? Sem registro do último uso (ex.: navegador que bloqueia o armazenamento),
// não expira, para não deslogar ninguém por engano.
export function sessaoExpirou(ultimaAtividade: number | null, agora: number, limite = LIMITE_INATIVIDADE_MS) {
  if (ultimaAtividade === null || !Number.isFinite(ultimaAtividade)) return false
  return agora - ultimaAtividade >= limite
}

export function precisaGravar(ultimaGravacao: number, agora: number, intervalo = INTERVALO_GRAVACAO_MS) {
  return agora - ultimaGravacao >= intervalo
}

export function interpretarRegistro(valor: string | null) {
  if (!valor) return null
  const numero = Number(valor)
  return Number.isFinite(numero) && numero > 0 ? numero : null
}

export function lerUltimaAtividade() {
  try {
    return interpretarRegistro(localStorage.getItem(CHAVE_ULTIMA_ATIVIDADE))
  } catch {
    return null
  }
}

export function marcarAtividade(agora = Date.now()) {
  try {
    localStorage.setItem(CHAVE_ULTIMA_ATIVIDADE, String(agora))
  } catch {
    // navegador sem armazenamento: a sessão só não expira por inatividade
  }
}

export function limparAtividade() {
  try {
    localStorage.removeItem(CHAVE_ULTIMA_ATIVIDADE)
  } catch {
    // nada a fazer
  }
}
