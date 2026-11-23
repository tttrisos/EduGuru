import { supabase } from '../../compartilhado/banco/supabase'

export type CadastroTotp = { fatorId: string; qrCode: string; segredo: string }

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

export async function confirmarCodigo(fatorId: string, codigo: string) {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fatorId, code: codigo })
  return error
}
