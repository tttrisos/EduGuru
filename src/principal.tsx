import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// O CSS compartilhado carrega primeiro; o de cada funcionalidade vem com a própria tela.
import './compartilhado/estilos/global.css'
import Rotas from './Rotas.tsx'
import { AuthProvider } from './compartilhado/sessao/ContextoSessao.tsx'
import { DialogoProvider } from './compartilhado/componentes/Dialogo.tsx'
import { aplicarTema, temaSalvo } from './compartilhado/utilitarios/tema.ts'

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
        <Rotas />
      </DialogoProvider>
    </AuthProvider>
  </StrictMode>,
)