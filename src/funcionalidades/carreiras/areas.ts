import type { AreaCarreira } from '../../compartilhado/tipos'
import { normalizar } from './vagas'

// "React, front-end ,, CSS" -> ['css', 'front-end', 'react'] (mesma regra do gatilho do banco)
export function separarPalavras(texto: string) {
  const lista = texto
    .split(',')
    .map((p) => normalizar(p))
    .filter((p) => p !== '')
  return [...new Set(lista)].sort()
}

// Validação do formulário de área (repetida no banco: tamanho, nome único, 1 a 40 palavras).
export function validarArea(
  dados: { nome: string; descricao: string; palavras: string },
  existentes: Pick<AreaCarreira, 'id' | 'nome'>[],
  editandoId: number | null,
) {
  const nome = dados.nome.trim()
  if (nome.length < 2) return 'Digite o nome da área (pelo menos 2 letras).'
  if (nome.length > 60) return 'O nome da área pode ter no máximo 60 letras.'
  if (dados.descricao.trim().length > 300) return 'A descrição pode ter no máximo 300 letras.'
  if (existentes.some((a) => a.id !== editandoId && normalizar(a.nome) === normalizar(nome))) {
    return 'Já existe uma área com esse nome.'
  }
  const palavras = separarPalavras(dados.palavras)
  if (palavras.length === 0) return 'Informe pelo menos uma palavra-chave.'
  if (palavras.length > 40) return 'Use no máximo 40 palavras-chave.'
  if (palavras.some((p) => p.length > 40)) return 'Cada palavra-chave pode ter no máximo 40 letras.'
  return ''
}
