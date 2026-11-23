import { supabase } from './supabase'

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
  limpeza_cadastros: 'Cadastros não confirmados apagados (24 h)',
  quiz_finalizado: 'Quiz finalizado',
  redefinicao_senha_solicitada: 'Pediu redefinição de senha',
  senha_redefinida: 'Senha redefinida',
  senha_alterada: 'Senha alterada (logado)',
  senha_atual_incorreta: 'Senha atual incorreta ao trocar',
  conta_excluida: 'Conta excluída',
  dados_exportados: 'Baixou os próprios dados (Minha conta)',
  criar: 'Criou',
  editar: 'Editou',
  excluir: 'Excluiu',
}

export function rotuloDoLog(log: { acao: string; detalhes?: Record<string, unknown> | null }) {
  if (log.acao === 'logout' && log.detalhes?.motivo === 'sessao_expirada') return 'Sessão expirada (30 min sem uso)'
  return ROTULO_ACAO[log.acao] ?? log.acao
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
  | 'dados_exportados'

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
