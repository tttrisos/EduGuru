// ============================================================
// compartilhado/componentes/Captcha.tsx
// CAPTCHA "NÃO SOU UM ROBÔ" (Cloudflare Turnstile, grátis) no login, no cadastro e no "esqueci a senha".
// Impede robôs de testar senhas e de criar contas falsas em massa. Funciona assim:
//   1) o navegador carrega o Turnstile e mostra a caixinha (quase sempre resolve sozinha);
//   2) o Turnstile devolve um "token" de uso único → a tela manda junto para o Supabase Auth;
//   3) o Supabase confere o token com a Cloudflare (chave secreta, configurada só no painel do Supabase).
// Sem CHAVE_SITE_CAPTCHA preenchida, não aparece nada e o login funciona como antes.
// ============================================================

import { useEffect, useRef } from 'react'

// Chave PÚBLICA do site (Cloudflare → Turnstile → o widget do EduGuru → "Site Key").
// A chave secreta vai só no Supabase: Authentication → Attack Protection → Captcha.
export const CHAVE_SITE_CAPTCHA: string = '0x4AAAAAAGBYJ0RlVQIDJtdS'

export const captchaLigado = CHAVE_SITE_CAPTCHA !== ''

type Turnstile = {
  render: (elemento: HTMLElement, opcoes: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const URL_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let carregamento: Promise<Turnstile> | null = null

// Carrega o script da Cloudflare uma vez só, mesmo com várias telas usando o captcha.
function carregarTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!carregamento) {
    carregamento = new Promise((resolver, rejeitar) => {
      const script = document.createElement('script')
      script.src = URL_SCRIPT
      script.async = true
      script.onload = () => (window.turnstile ? resolver(window.turnstile) : rejeitar(new Error('Turnstile')))
      script.onerror = () => {
        carregamento = null
        rejeitar(new Error('Não foi possível carregar o captcha.'))
      }
      document.head.appendChild(script)
    })
  }
  return carregamento
}

type Props = {
  // Recebe o token (ou null quando expira ou dá erro).
  aoMudar: (token: string | null) => void
  // Aumente este número para pedir um token novo (cada token vale para UMA tentativa).
  reiniciar?: number
}

export default function Captcha({ aoMudar, reiniciar = 0 }: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const idWidget = useRef<string | null>(null)
  const callback = useRef(aoMudar)
  useEffect(() => {
    callback.current = aoMudar
  }, [aoMudar])

  useEffect(() => {
    if (!captchaLigado || !caixa.current) return
    let cancelado = false
    carregarTurnstile()
      .then((turnstile) => {
        if (cancelado || !caixa.current) return
        idWidget.current = turnstile.render(caixa.current, {
          sitekey: CHAVE_SITE_CAPTCHA,
          language: 'pt-br',
          theme: document.documentElement.dataset.tema === 'claro' ? 'light' : 'dark',
          callback: (token: string) => callback.current(token),
          'expired-callback': () => callback.current(null),
          'error-callback': () => callback.current(null),
        })
      })
      .catch(() => callback.current(null))
    return () => {
      cancelado = true
      if (idWidget.current && window.turnstile) window.turnstile.remove(idWidget.current)
      idWidget.current = null
    }
  }, [])

  // Depois de cada tentativa (certa ou errada), o token já foi gasto: pede outro.
  useEffect(() => {
    if (reiniciar > 0 && idWidget.current && window.turnstile) {
      callback.current(null)
      window.turnstile.reset(idWidget.current)
    }
  }, [reiniciar])

  if (!captchaLigado) return null
  return <div ref={caixa} className="captcha" aria-label="Verificação de segurança: não sou um robô" />
}
