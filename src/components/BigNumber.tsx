import type { ReactNode } from 'react'

// "Big number" do painel: um indicador grande com legenda.
export default function BigNumber({ valor, legenda, detalhe }: { valor: ReactNode; legenda: string; detalhe?: string }) {
  return (
    <div className="big-number cartao">
      <strong>{valor}</strong>
      <span>{legenda}</span>
      {detalhe ? <small>{detalhe}</small> : null}
    </div>
  )
}
