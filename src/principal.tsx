// ============================================================
// principal.tsx
// PONTO DE ENTRADA do site: é o primeiro arquivo que roda (o index.html aponta para ele).
// O que faz: carrega o CSS global, aplica o tema salvo e "liga" o React na <div id="root">.
// Envolve tudo com: AuthProvider (quem está logado, em sessao/ContextoSessao.tsx) e DialogoProvider (janelas de confirmação).
// Próximo passo: Rotas.tsx decide qual tela mostrar.
// ============================================================

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