import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Caminhos relativos para funcionar no GitHub Pages (tttrisos.github.io/EduGuru/).
  base: './',
})
