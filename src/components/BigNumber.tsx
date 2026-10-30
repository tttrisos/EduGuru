import type { ReactNode } from 'react'

// Indicador grande do painel.
export default function BigNumber({ valor, legenda, detalhe }: { valor: ReactNode; legenda: string; detalhe?: string }) {
  return (
    <div className="big-number cartao">
      <strong>{valor}</strong>
      <span>{legenda}</span>
      {detalhe ? <small>{detalhe}</small> : null}
    </div>
  )
}
