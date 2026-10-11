import { supabase } from '../supabase'

// Antes de excluir uma conta, os ARQUIVOS dos materiais enviados por ela
// são removidos do Storage. Isso precisa ser feito pela API de Storage
// (o Supabase não permite apagar arquivo direto por SQL). As linhas da
// tabela "materiais" e a conta em si são apagadas depois, no banco, pelas
// funções excluir_minha_conta / excluir_conta_usuario.
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
