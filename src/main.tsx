import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// O CSS compartilhado carrega primeiro; o de cada funcionalidade vem com a própria tela.
import './compartilhado/global.css'
import App from './App.tsx'
import { AuthProvider } from './compartilhado/AuthContext.tsx'
import { DialogoProvider } from './compartilhado/Dialogo.tsx'
import { aplicarTema, temaSalvo } from './compartilhado/tema.ts'

// Aplica o tema escolhido (escuro ou claro) antes de desenhar a tela.
aplicarTema(temaSalvo())

// Link do e-mail de "esqueci minha senha" abre a tela de nova senha.
if (new URLSearchParams(window.location.search).has('recuperar-senha')) {
  window.location.hash = '#/redefinir-senha'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DialogoProvider>
        <App />
      </DialogoProvider>
    </AuthProvider>
  </StrictMode>,
)