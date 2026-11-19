// ============================================================
// compartilhado/sessao/inatividade.ts
// SESSÃO EXPIRADA POR INATIVIDADE: regra dos 30 minutos sem usar o site.
// Usado por: compartilhado/sessao/ContextoSessao.tsx (que encerra a sessão e avisa no login).
// Banco: nenhum. O horário do último uso fica só no navegador (localStorage), sem dado pessoal.
// Testes: testes/compartilhado/inatividade.test.ts.
// ============================================================

// Para a banca: o Supabase só limita o tempo máximo de sessão nos planos pagos (monografia, 2.1).
// Por isso o próprio site conta o tempo parado: qualquer clique, tecla, toque ou rolagem, em
// qualquer aba do EduGuru, conta como uso. Passados 30 minutos sem nada, a sessão é encerrada
// (inclusive se o aluno fechou o navegador e voltou depois) e o login avisa o motivo.

export const LIMITE_INATIVIDADE_MS = 30 * 60 * 1000 // 30 minutos
export const INTERVALO_GRAVACAO_MS = 15 * 1000 // grava o "último uso" no máximo a cada 15 s
export const INTERVALO_CONFERENCIA_MS = 30 * 1000 // confere se expirou a cada 30 s
export const CHAVE_ULTIMA_ATIVIDADE = 'eduguru_ultima_atividade'
export const AVISO_SESSAO_EXPIRADA = 'Sua sessão expirou depois de 30 minutos sem uso. Entre de novo.'

// A sessão expirou? Sem registro do último uso (ex.: navegador que bloqueia o armazenamento),
// não expira, para não deslogar ninguém por engano.
export function sessaoExpirou(ultimaAtividade: number | null, agora: number, limite = LIMITE_INATIVIDADE_MS) {
  if (ultimaAtividade === null || !Number.isFinite(ultimaAtividade)) return false
  return agora - ultimaAtividade >= limite
}

// Evita gravar no navegador a cada movimento: só grava se já passou o intervalo.
export function precisaGravar(ultimaGravacao: number, agora: number, intervalo = INTERVALO_GRAVACAO_MS) {
  return agora - ultimaGravacao >= intervalo
}

// Converte o texto guardado no navegador em número (ou null se não houver ou estiver estragado).
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
