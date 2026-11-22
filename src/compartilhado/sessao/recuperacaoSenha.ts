// ============================================================
// compartilhado/sessao/recuperacaoSenha.ts
// "ESQUECI MINHA SENHA": a tela de nova senha (2_acesso/RedefinirSenha.tsx) só pode ser usada por quem
// chegou pelo LINK DE RECUPERAÇÃO enviado ao e-mail — RF24-RN06.
// Por quê: a rota /redefinir-senha é pública. Sem esta trava, quem descobriu a senha de um aluno e
// entrou num aparelho novo (sessão ainda esperando o código do e-mail, supabase/25) poderia abrir
// #/redefinir-senha direto e trocar a senha sem nunca passar pelo e-mail da vítima.
// Como o site sabe que a pessoa veio do link: o Supabase Auth avisa com o evento PASSWORD_RECOVERY.
// Esse evento só acontece quando o link foi pedido NESTE navegador (no fluxo PKCE, o navegador guarda
// um "verificador" na hora do pedido e o link só funciona junto com ele).
// Banco: nenhum. Usado por: principal.tsx (liga a escuta) e RedefinirSenha.tsx (confere).
// Testes: testes/compartilhado/recuperacaoSenha.test.ts.
// ============================================================

import { supabase } from '../banco/supabase'

// sessionStorage: vale só para esta aba e some quando ela é fechada.
export const CHAVE_RECUPERACAO = 'eduguru.recuperacao-senha'

// A REGRA (sem tela, testada): só libera a troca se o link de recuperação foi aberto por ESTA conta.
// idDoLink = id da conta que abriu o link (guardado no evento); idLogado = quem está logado agora.
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

// Liga a escuta do evento. Precisa ser chamada ANTES de o React desenhar a tela (principal.tsx):
// o Supabase troca o código do link pela sessão logo que o site abre e avisa uma única vez.
// Limitação (dita na monografia): esta trava é da tela. O Supabase Auth aceita a troca de senha de
// qualquer sessão válida pela API; mesmo assim, quem fizer isso continua sem acesso aos dados, porque
// o banco segue exigindo o código do e-mail (ou do aplicativo) em aparelho novo.
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
