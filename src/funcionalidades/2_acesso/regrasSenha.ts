export type RegraSenha = {
  chave: string
  descricao: string
  testar: (senha: string) => boolean
}

export const REGRAS_SENHA: RegraSenha[] = [
  { chave: 'tamanho', descricao: 'Pelo menos 8 caracteres', testar: (s) => s.length >= 8 },
  { chave: 'maiuscula', descricao: 'Uma letra maiúscula (A-Z)', testar: (s) => /[A-Z]/.test(s) },
  { chave: 'minuscula', descricao: 'Uma letra minúscula (a-z)', testar: (s) => /[a-z]/.test(s) },
  { chave: 'numero', descricao: 'Um número (0-9)', testar: (s) => /[0-9]/.test(s) },
  {
    chave: 'especial',
    descricao: 'Um caractere especial (!@#$%*...)',
    testar: (s) => /[^A-Za-z0-9]/.test(s),
  },
]

export function senhaAtendeTodasRegras(senha: string): boolean {
  return REGRAS_SENHA.every((regra) => regra.testar(senha))
}
export function validarTrocaDeSenha(atual: string, nova: string, confirmacao: string): string | null {
  if (!atual) return 'Digite a sua senha atual.'
  if (!senhaAtendeTodasRegras(nova)) return 'A nova senha ainda não atende a todos os requisitos.'
  if (nova !== confirmacao) return 'A confirmação não é igual à nova senha.'
  if (nova === atual) return 'A nova senha precisa ser diferente da senha atual.'
  return null
}
