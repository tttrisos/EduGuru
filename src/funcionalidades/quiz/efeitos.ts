// Efeitos do quiz: sons curtos gerados pelo navegador (sem arquivos de áudio) e comemorações.
type Som = 'acerto' | 'erro' | 'dica' | 'fim'

const NOTAS: Record<Som, number[]> = {
  acerto: [660, 880],
  erro: [300, 220],
  dica: [520],
  fim: [523, 659, 784, 1047],
}

const CHAVE_MUDO = 'eduguru-quiz-mudo'

export function somDesligado() {
  try {
    return localStorage.getItem(CHAVE_MUDO) === '1'
  } catch {
    return false
  }
}

export function guardarSomDesligado(mudo: boolean) {
  try {
    localStorage.setItem(CHAVE_MUDO, mudo ? '1' : '0')
  } catch {
    // Sem acesso ao armazenamento: a escolha vale só nesta tela.
  }
}

export function tocarSom(som: Som) {
  if (somDesligado()) return
  try {
    const audio = new AudioContext()
    NOTAS[som].forEach((frequencia, i) => {
      const oscilador = audio.createOscillator()
      const volume = audio.createGain()
      const inicio = audio.currentTime + i * 0.12
      oscilador.type = 'sine'
      oscilador.frequency.value = frequencia
      volume.gain.setValueAtTime(0.12, inicio)
      volume.gain.exponentialRampToValueAtTime(0.001, inicio + 0.2)
      oscilador.connect(volume).connect(audio.destination)
      oscilador.start(inicio)
      oscilador.stop(inicio + 0.2)
    })
    setTimeout(() => audio.close(), NOTAS[som].length * 120 + 300)
  } catch {
    // Navegador sem suporte a áudio: o quiz segue sem som.
  }
}

// Mensagem especial ao chegar em 3, 5 e 10 acertos seguidos.
export function mensagemSequencia(sequencia: number) {
  if (sequencia === 10) return 'Lendário! 10 seguidas!'
  if (sequencia === 5) return 'Imparável! 5 seguidas!'
  if (sequencia === 3) return 'Em chamas! 3 seguidas!'
  return ''
}
