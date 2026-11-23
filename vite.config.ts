/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Caminhos relativos para funcionar no GitHub Pages (tttrisos.github.io/EduGuru/).
  base: './',
  test: {
    coverage: {
      // Todo o código do site entra na conta, inclusive arquivos que nenhum teste importa.
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { statements: 50, lines: 50 },
    },
  },
})
