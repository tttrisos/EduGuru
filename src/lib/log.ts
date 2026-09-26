import { supabase } from '../supabase'

// Login/logout não alteram nenhuma tabela, então o trigger do banco não
// registra sozinho — por isso chamamos isso manualmente aqui. Criar/editar/
// excluir em disciplinas, perguntas e materiais já é logado via trigger
// (ver supabase_setup_auth_logs.sql).
export async function registrarLogEvento(
  acao: 'login' | 'login_falhou' | 'logout',
  usuarioId: string | null,
  usuarioEmail: string | null,
  detalhes?: Record<string, unknown>,
) {
  try {
    await supabase.from('logs_auditoria').insert([
      {
        usuario_id: usuarioId,
        usuario_email: usuarioEmail,
        acao,
        tabela: null,
        registro_id: null,
        detalhes: detalhes ?? null,
      },
    ])
  } catch {
    // Log falhou: não travamos login/logout por causa disso.
  }
}
