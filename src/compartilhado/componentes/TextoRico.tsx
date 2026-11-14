// ============================================================
// compartilhado/componentes/TextoRico.tsx
// TEXTO COM NEGRITO: mostra **assim** em negrito nas perguntas e alternativas do quiz (regra em utilitarios/texto.ts).
// ============================================================

import { partesDoTexto } from '../utilitarios/texto'

// Mostra o texto com os trechos **assim** em negrito.
export default function TextoRico({ texto }: { texto: string }) {
  return (
    <>
      {partesDoTexto(texto).map((parte, i) =>
        parte.negrito ? <strong key={i}>{parte.texto}</strong> : <span key={i}>{parte.texto}</span>,
      )}
    </>
  )
}
