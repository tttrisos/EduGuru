// Divide o texto em partes normais e em negrito. **assim** vira negrito.
export type ParteTexto = { texto: string; negrito: boolean }

export function partesDoTexto(texto: string): ParteTexto[] {
  return texto
    .split('**')
    .map((parte, i) => ({ texto: parte, negrito: i % 2 === 1 }))
    .filter((parte) => parte.texto !== '')
}
