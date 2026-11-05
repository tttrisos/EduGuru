import { supabase } from './supabase'

// Os arquivos são privados: geramos links temporários (1 hora).
const VALIDADE_LINK_SEGUNDOS = 60 * 60

export async function gerarLinksArquivos(
  caminhos: string[],
  bucket: 'materiais' | 'perguntas' = 'materiais',
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {}
  if (caminhos.length === 0) return urls

  const { data } = await supabase.storage.from(bucket).createSignedUrls(caminhos, VALIDADE_LINK_SEGUNDOS)
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
  }
  return urls
}

// Imagens das perguntas: as ilustrações que vêm com o sistema ficam em public/ilustracoes;
// as enviadas pelo admin ficam no bucket "perguntas".
export async function gerarLinksImagensPerguntas(caminhos: string[]) {
  const ilustracoes = caminhos.filter((c) => c.startsWith('ilustracoes/'))
  const enviadas = caminhos.filter((c) => !c.startsWith('ilustracoes/'))
  const urls = await gerarLinksArquivos(enviadas, 'perguntas')
  for (const caminho of ilustracoes) urls[caminho] = `${import.meta.env.BASE_URL}${caminho}`
  return urls
}

export function formatarTamanho(bytes: number | null) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}
