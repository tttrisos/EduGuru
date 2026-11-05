// Tema do site: escuro (padrão) ou claro. A escolha fica salva neste navegador.

export type Tema = 'escuro' | 'claro'

const CHAVE_TEMA = 'eduguru-tema'

export function temaSalvo(): Tema {
  try {
    return localStorage.getItem(CHAVE_TEMA) === 'claro' ? 'claro' : 'escuro'
  } catch {
    return 'escuro'
  }
}

export function aplicarTema(tema: Tema) {
  document.documentElement.dataset.tema = tema
  try {
    localStorage.setItem(CHAVE_TEMA, tema)
  } catch {
    // Sem armazenamento (ex.: janela anônima): o tema vale só até fechar a aba.
  }
}
