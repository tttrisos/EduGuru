import { partesDoTexto } from '../utilitarios/texto'

export default function TextoRico({ texto }: { texto: string }) {
  return (
    <>
      {partesDoTexto(texto).map((parte, i) =>
        parte.negrito ? <strong key={i}>{parte.texto}</strong> : <span key={i}>{parte.texto}</span>,
      )}
    </>
  )
}
