// ============================================================
// funcionalidades/acesso/fatoresMfa.ts
// APLICATIVO AUTENTICADOR (MFA/TOTP): chamadas ao Supabase Auth usadas pela tela do código
// (Mfa.tsx: login e cadastro obrigatório do admin) e por Minha conta (conta/VerificacaoDuasEtapas.tsx:
// ativar e desativar).
// ============================================================

import { supabase } from '../../compartilhado/banco/supabase'

export type CadastroTotp = { fatorId: string; qrCode: string; segredo: string }

// Id do aplicativo já confirmado da conta, ou null se o MFA não está ativo.
export async function fatorVerificado(): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data.totp[0]?.id ?? null
}

// Remove QR Codes gerados e nunca confirmados (ex.: a pessoa fechou a tela no meio).
export async function limparCadastrosPendentes() {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  const pendentes = data.all.filter((f) => f.factor_type === 'totp' && f.status === 'unverified')
  for (const fator of pendentes) {
    await supabase.auth.mfa.unenroll({ factorId: fator.id })
  }
}

// Gera o QR Code e a chave para o aplicativo. Só vale depois de confirmar um código (confirmarCodigo).
export async function iniciarCadastroTotp(): Promise<CadastroTotp> {
  await limparCadastrosPendentes()
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `EduGuru ${new Date().toISOString()}`,
  })
  if (error) throw error
  return { fatorId: data.id, qrCode: data.totp.qr_code, segredo: data.totp.secret }
}

// Confere o código de 6 dígitos. Se estiver certo, a sessão passa a ser aal2 (senha + código).
export async function confirmarCodigo(fatorId: string, codigo: string) {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fatorId, code: codigo })
  return error
}
