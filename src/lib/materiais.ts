import { supabase } from '../supabase'

// O bucket de arquivos é privado: em vez de link público, geramos links
// assinados que expiram em 1 hora, só para quem está logado.
const VALIDADE_LINK_SEGUNDOS = 60 * 60

// Recebe os caminhos dos arquivos no Storage e devolve { caminho: link }.
export async function gerarLinksArquivos(caminhos: string[]): Promise<Record<string, string>> {
  const urls: Record<string, string> = {}
  if (caminhos.length === 0) return urls

  const { data } = await supabase.storage.from('materiais').createSignedUrls(caminhos, VALIDADE_LINK_SEGUNDOS)
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
  }
  return urls
}
