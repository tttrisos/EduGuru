// ============================================================
// compartilhado/componentes/NumeroDestaque.tsx
// NÚMERO EM DESTAQUE ("big number") dos painéis: valor grande, legenda e detalhe.
// ============================================================

import type { ReactNode } from 'react'

// Indicador grande do painel.
export default function NumeroDestaque({ valor, legenda, detalhe }: { valor: ReactNode; legenda: string; detalhe?: string }) {
  return (
    <div className="big-number cartao">
      <strong>{valor}</strong>
      <span>{legenda}</span>
      {detalhe ? <small>{detalhe}</small> : null}
    </div>
  )
}
