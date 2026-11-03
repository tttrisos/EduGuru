import { supabase } from './supabase'

// Logs de acesso (login, logout, MFA, senha). Criar/editar/excluir registros
// é logado direto pelo banco.

// Nome exibido de cada ação do log.
export const ROTULO_ACAO: Record<string, string> = {
  login: 'Login',
  login_falhou: 'Login falhou',
  logout: 'Logout',
  mfa_ativado: 'MFA ativado',
  mfa_falhou: 'Código MFA inválido',
  mfa_bloqueado: 'MFA bloqueado (muitas tentativas)',
  mfa_redefinido: 'MFA redefinido pelo admin',
  limpeza_automatica: 'Limpeza automática',
  limpeza_manual: 'Limpeza manual de logs',
  quiz_finalizado: 'Quiz finalizado',
  redefinicao_senha_solicitada: 'Pediu redefinição de senha',
  senha_redefinida: 'Senha redefinida',
  conta_excluida: 'Conta excluída',
  criar: 'Criou',
  editar: 'Editou',
  excluir: 'Excluiu',
}

export type EventoAuth =
  | 'login'
  | 'logout'
  | 'mfa_ativado'
  | 'mfa_falhou'
  | 'mfa_bloqueado'
  | 'senha_redefinida'

export async function registrarLogEvento(acao: EventoAuth, detalhes?: Record<string, unknown>) {
  try {
    await supabase.rpc('registrar_evento_auth', { acao, detalhes: detalhes ?? null })
  } catch {
    // Falha no log não impede o login/logout.
  }
}

// Sem sessão: o banco limita a quantidade de registros por e-mail.
export async function registrarLoginFalhou(email: string) {
  try {
    await supabase.rpc('registrar_login_falhou', { email })
  } catch {
    // Falha no log não impede o login.
  }
}

export async function registrarPedidoRedefinicao(email: string) {
  try {
    await supabase.rpc('registrar_pedido_redefinicao', { email })
  } catch {
    // Falha no log não impede o login.
  }
}
