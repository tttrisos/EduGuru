import { supabase } from '../../compartilhado/supabase'
import { gerarLinksArquivos } from '../../compartilhado/arquivos'
import type { MaterialComunidade } from '../../compartilhado/tipos'

// Materiais aprovados de uma disciplina ou de um autor, com os links dos arquivos.
export async function buscarMateriaisComunidade(filtro: { disciplinaId?: number | null; autorId?: string }) {
  const { data, error } = await supabase.rpc('materiais_da_comunidade', {
    p_disciplina_id: filtro.disciplinaId ?? null,
    p_autor_id: filtro.autorId ?? null,
  })
  const lista = (data as MaterialComunidade[]) ?? []
  const caminhos = lista.map((m) => m.arquivo_path).filter((p): p is string => !!p)
  return { lista, urls: await gerarLinksArquivos(caminhos), erro: error?.message ?? '' }
}

export const MOTIVOS_DENUNCIA = [
  'Conteúdo impróprio ou ofensivo',
  'Possível crime (pirataria, golpe, drogas)',
  'Expõe dados pessoais (LGPD)',
  'Link quebrado ou suspeito',
  'Não tem relação com a disciplina',
]
