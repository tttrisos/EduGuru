import { supabase } from '../banco/supabase'

// sessionStorage: vale só para esta aba e some quando ela é fechada.
export const CHAVE_RECUPERACAO = 'eduguru.recuperacao-senha'

// Só libera a troca se o link de recuperação foi aberto por esta mesma conta.
export function podeRedefinirSenha(idDoLink: string | null, idLogado: string | null | undefined) {
  return !!idDoLink && !!idLogado && idDoLink === idLogado
}

export function lerRecuperacao(): string | null {
  try {
    return sessionStorage.getItem(CHAVE_RECUPERACAO)
  } catch {
    return null // navegador sem armazenamento: a pessoa só não consegue usar o link (pede outro)
  }
}

export function limparRecuperacao() {
  try {
    sessionStorage.removeItem(CHAVE_RECUPERACAO)
  } catch {
    // nada a fazer
  }
}

// Precisa ser chamada antes de o React desenhar a tela: o Supabase avisa uma única vez.
// A trava é da tela; mesmo trocando a senha direto pela API, o banco continua pedindo o código
// em aparelho novo.
export function ouvirLinkDeRecuperacao() {
  supabase.auth.onAuthStateChange((evento, sessao) => {
    if (evento !== 'PASSWORD_RECOVERY' || !sessao?.user) return
    try {
      sessionStorage.setItem(CHAVE_RECUPERACAO, sessao.user.id)
    } catch {
      // sem armazenamento: a tela vai pedir um novo link
    }
  })
}
