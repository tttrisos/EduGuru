import { supabase } from '../supabase'

// Login/logout/MFA não alteram nenhuma tabela, então o trigger do banco não
// registra sozinho — por isso chamamos isso manualmente aqui. Criar/editar/
// excluir em disciplinas, perguntas, materiais e perfis já é logado via
// trigger (ver supabase_setup_auth_logs.sql e supabase_atualizacao_4.sql).
//
// O front NÃO insere direto na tabela de logs: chama funções do banco que
// só aceitam estes eventos e usam sempre o usuário da sessão atual.
// Nome amigável de cada "acao" gravada em logs_auditoria (tela de Logs do
// admin e "Meus registros de atividade" do titular).
export const ROTULO_ACAO: Record<string, string> = {
  login: 'Login',
  login_falhou: 'Login falhou',
  logout: 'Logout',
  mfa_ativado: 'MFA ativado',
  mfa_falhou: 'Código MFA inválido',
  limpeza_automatica: 'Limpeza automática',
  conta_excluida: 'Conta excluída',
  criar: 'Criou',
  editar: 'Editou',
  excluir: 'Excluiu',
}

export type EventoAuth = 'login' | 'logout' | 'mfa_ativado' | 'mfa_falhou'

export async function registrarLogEvento(acao: EventoAuth, detalhes?: Record<string, unknown>) {
  try {
    await supabase.rpc('registrar_evento_auth', { acao, detalhes: detalhes ?? null })
  } catch {
    // Log falhou: não travamos login/logout por causa disso.
  }
}

// Senha errada acontece sem sessão; a função do banco limita a quantidade
// de registros por e-mail para não virar porta de spam.
export async function registrarLoginFalhou(email: string) {
  try {
    await supabase.rpc('registrar_login_falhou', { email })
  } catch {
    // idem
  }
}
