const PREFIXO = 'eduguru.aparelho.'

// Navegação privada ou armazenamento bloqueado: sem token, o aluno só recebe o código de novo.
export function lerTokenAparelho(usuarioId: string): string | null {
  try {
    return localStorage.getItem(PREFIXO + usuarioId)
  } catch {
    return null
  }
}

export function guardarTokenAparelho(usuarioId: string, token: string) {
  try {
    localStorage.setItem(PREFIXO + usuarioId, token)
  } catch {
    // sem armazenamento: o aparelho só não fica lembrado
  }
}

export function esquecerTokenAparelho(usuarioId: string) {
  try {
    localStorage.removeItem(PREFIXO + usuarioId)
  } catch {
    // nada a fazer
  }
}

export function mensagemCodigoEmail(motivo: string | undefined, extra?: { restantes?: number; segundos?: number }): string {
  switch (motivo) {
    case 'errado':
      return `Código incorreto. Tentativas restantes: ${extra?.restantes ?? 0}.`
    case 'bloqueado':
      return 'Muitos códigos incorretos. Peça um código novo.'
    case 'expirado':
      return 'Este código expirou ou já foi usado. Peça um código novo.'
    case 'aguarde':
      return `Aguarde ${extra?.segundos ?? 60} segundos para pedir outro código.`
    case 'limite_pessoal':
      return 'Você pediu muitos códigos hoje. Tente de novo amanhã ou ative o aplicativo autenticador em Minha conta.'
    case 'limite_geral':
      return 'O limite diário de e-mails do EduGuru foi atingido. Tente de novo mais tarde.'
    default:
      return 'Não foi possível concluir. Tente de novo.'
  }
}

// Como o login foi verificado (detalhes.mfa do log de login, supabase/25).
export function textoVerificacao(verificacao: string | null | undefined): string {
  switch (verificacao) {
    case 'totp':
      return 'com o código do aplicativo'
    case 'email':
      return 'com o código do e-mail'
    case 'aparelho':
      return 'em aparelho lembrado'
    default:
      return 'só com a senha'
  }
}
