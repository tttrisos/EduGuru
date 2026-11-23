// Níveis do Supabase Auth: aal1 = só a senha; aal2 = senha + código do aplicativo.
export type NivelSessao = string | null | undefined

export type SituacaoSessao = {
  liberada: boolean
  temMfa: boolean
  falta: 'codigo' | 'cadastrar' | null
}

// atual = nível desta sessão; proximo = nível que a conta exige (aal2 se tem MFA ativo).
// papel = null enquanto o perfil ainda não foi lido.
export function situacaoDaSessao(atual: NivelSessao, proximo: NivelSessao, papel: string | null): SituacaoSessao {
  const temMfa = proximo === 'aal2'
  const codigoInformado = atual === 'aal2'

  if (temMfa && !codigoInformado) return { liberada: false, temMfa, falta: 'codigo' }
  if (papel === 'admin' && !codigoInformado) return { liberada: false, temMfa, falta: 'cadastrar' }
  return { liberada: true, temMfa, falta: null }
}
