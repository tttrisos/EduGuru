// ============================================================
// compartilhado/banco/log.ts
// LOG DE AUDITORIA do lado do site: registra eventos de acesso (login, logout, MFA, senha).
// Banco: registrar_evento_auth (supabase/10 e 21), registrar_login_falhou (10), registrar_pedido_redefinicao (09).
// Criar/editar/excluir cadastros é registrado sozinho por gatilhos do banco (supabase/02).
// ROTULO_ACAO traduz o código da ação para o texto mostrado em Logs e Minha conta.
// ============================================================

import { supabase } from './supabase'

// Logs de acesso (login, logout, MFA, senha). Criar/editar/excluir registros
// é logado direto pelo banco.

// Nome exibido de cada ação do log.
export const ROTULO_ACAO: Record<string, string> = {
  login: 'Login',
  login_falhou: 'Login falhou',
  logout: 'Logout',
  mfa_ativado: 'MFA ativado',
  mfa_desativado: 'MFA desativado',
  sessoes_encerradas: 'Saiu dos outros aparelhos',
  aparelhos_esquecidos: 'Esqueceu os outros aparelhos lembrados',
  codigo_email_enviado: 'Código enviado por e-mail (aparelho novo)',
  codigo_email_confirmado: 'Código do e-mail confirmado',
  codigo_email_errado: 'Código do e-mail incorreto',
  mfa_falhou: 'Código MFA inválido',
  mfa_bloqueado: 'MFA bloqueado (muitas tentativas)',
  mfa_redefinido: 'MFA redefinido pelo admin',
  limpeza_automatica: 'Limpeza automática',
  limpeza_manual: 'Limpeza manual de logs',
  quiz_finalizado: 'Quiz finalizado',
  redefinicao_senha_solicitada: 'Pediu redefinição de senha',
  senha_redefinida: 'Senha redefinida',
  senha_alterada: 'Senha alterada (logado)',
  senha_atual_incorreta: 'Senha atual incorreta ao trocar',
  conta_excluida: 'Conta excluída',
  criar: 'Criou',
  editar: 'Editou',
  excluir: 'Excluiu',
}

export type EventoAuth =
  | 'login'
  | 'logout'
  | 'mfa_ativado'
  | 'mfa_desativado'
  | 'sessoes_encerradas'
  | 'mfa_falhou'
  | 'mfa_bloqueado'
  | 'senha_redefinida'
  | 'senha_alterada'

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
