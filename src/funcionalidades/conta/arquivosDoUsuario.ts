// ============================================================
// funcionalidades/conta/arquivosDoUsuario.ts
// APAGAR OS ARQUIVOS DE UM USUÁRIO no Storage antes de excluir a conta
// (o banco apaga as linhas sozinho, mas não consegue apagar arquivos). Usado por Minha conta e Usuários.
// ============================================================

import { supabase } from '../../compartilhado/banco/supabase'

// Antes de excluir uma conta, apaga do Storage os arquivos enviados por ela
// (o banco não consegue apagar arquivos; o resto é apagado pelo SQL).
export async function removerArquivosDoUsuario(usuarioId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('materiais')
    .select('arquivo_path')
    .eq('enviado_por', usuarioId)
    .not('arquivo_path', 'is', null)

  if (error) return error.message

  const caminhos = (data ?? []).map((m) => m.arquivo_path as string)
  if (caminhos.length === 0) return null

  const { error: erroStorage } = await supabase.storage.from('materiais').remove(caminhos)
  return erroStorage ? erroStorage.message : null
}
