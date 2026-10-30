import { supabase } from '../supabase'

// Os arquivos são privados: geramos links temporários (1 hora).
const VALIDADE_LINK_SEGUNDOS = 60 * 60

export async function gerarLinksArquivos(caminhos: string[]): Promise<Record<string, string>> {
  const urls: Record<string, string> = {}
  if (caminhos.length === 0) return urls

  const { data } = await supabase.storage.from('materiais').createSignedUrls(caminhos, VALIDADE_LINK_SEGUNDOS)
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
  }
  return urls
}
