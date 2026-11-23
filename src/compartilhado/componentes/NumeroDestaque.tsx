import type { ReactNode } from 'react'

export default function NumeroDestaque({ valor, legenda, detalhe }: { valor: ReactNode; legenda: string; detalhe?: string }) {
  return (
    <div className="big-number cartao">
      <strong>{valor}</strong>
      <span>{legenda}</span>
      {detalhe ? <small>{detalhe}</small> : null}
    </div>
  )
}
