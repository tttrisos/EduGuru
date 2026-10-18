import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Caminhos relativos: o site funciona em qualquer subpasta, como
  // https://tttrisos.github.io/EduGuru/ (GitHub Pages). Como as rotas usam
  // HashRouter (/#/rota), só existe um index.html e não há 404 ao recarregar.
  base: './',
})
