// ============================================================
// compartilhado/sessao/nivelSessao.ts
// REGRA DA VERIFICAÇÃO EM DUAS ETAPAS (MFA), sem tela: a sessão está liberada?
// - Aluno SEM MFA ativo: entra só com a senha (o MFA é opcional, ativado em Minha conta).
// - Quem ATIVOU o MFA: precisa do código do aplicativo em todo login.
// - Administrador: o código é obrigatório; sem MFA cadastrado, precisa cadastrar.
// O banco aplica a mesma regra (sessao_mfa_ok e eh_admin, supabase/23). Testes: testes/compartilhado/.
// ============================================================

// Níveis do Supabase Auth: aal1 = só a senha; aal2 = senha + código do aplicativo.
export type NivelSessao = string | null | undefined

export type SituacaoSessao = {
  liberada: boolean
  temMfa: boolean
  // O que falta: digitar o código, cadastrar o aplicativo (admin) ou nada.
  falta: 'codigo' | 'cadastrar' | null
}

// atual = nível desta sessão; proximo = nível que a conta exige (aal2 se tem MFA ativo).
// papel = null enquanto o perfil ainda não foi lido.
// Exemplos (são os casos testados em testes/compartilhado/nivelSessao.test.ts):
//   aluno sem MFA, só senha        → atual aal1, proximo aal1 → liberada
//   aluno com MFA, só senha        → atual aal1, proximo aal2 → falta 'codigo'
//   aluno com MFA, digitou código  → atual aal2, proximo aal2 → liberada
//   admin ainda sem aplicativo     → atual aal1, proximo aal1, papel admin → falta 'cadastrar'
export function situacaoDaSessao(atual: NivelSessao, proximo: NivelSessao, papel: string | null): SituacaoSessao {
  const temMfa = proximo === 'aal2'
  const codigoInformado = atual === 'aal2'

  if (temMfa && !codigoInformado) return { liberada: false, temMfa, falta: 'codigo' }
  if (papel === 'admin' && !codigoInformado) return { liberada: false, temMfa, falta: 'cadastrar' }
  return { liberada: true, temMfa, falta: null }
}
