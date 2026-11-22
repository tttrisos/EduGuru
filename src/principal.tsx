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
import { ouvirLinkDeRecuperacao } from './compartilhado/sessao/recuperacaoSenha.ts'

// Aplica o tema escolhido (escuro ou claro) antes de desenhar a tela.
aplicarTema(temaSalvo())

// Começa a escutar o aviso "veio do link de recuperação de senha" ANTES de desenhar a tela, porque o
// Supabase dá esse aviso uma vez só, logo que o site abre (ver compartilhado/sessao/recuperacaoSenha.ts).
ouvirLinkDeRecuperacao()

// Link do e-mail de "esqueci minha senha" abre a tela de nova senha.
if (new URLSearchParams(window.location.search).has('recuperar-senha')) {
  window.location.hash = '#/redefinir-senha'
}

// Link "Confirmar e-mail" do cadastro: o Supabase já confirmou o e-mail antes de voltar para cá.
// Se o link foi aberto no mesmo navegador do cadastro, a pessoa já entra logada e vai para o painel;
// em outro navegador, a RotaProtegida manda para o login, que mostra "E-mail confirmado!".
if (new URLSearchParams(window.location.search).has('cadastro-confirmado') && !window.location.hash) {
  window.location.hash = '#/painel'
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