import { useEffect, useRef } from 'react'

// Chave pública do site no Turnstile; a chave secreta fica só no Supabase.
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
