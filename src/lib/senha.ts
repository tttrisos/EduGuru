// Regras mínimas de senha. Cada regra tem "testar" (true/false), usado
// tanto na checklist visual quanto na validação de envio do formulário.
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