// ============================================================
// Rotas.tsx
// MAPA DE TELAS: cada <Route path="..."> liga um endereço (ex.: #/quiz) a uma tela.
// Telas públicas: início, login, MFA, esqueci/redefinir senha, termos e política.
// Telas logadas: ficam dentro de RotaProtegida (exige login + MFA + aceite) e de LayoutLogado (barra do topo).
// Telas só de admin: RotaProtegida com somenteAdmin.
// Usamos HashRouter (# no endereço) porque o GitHub Pages só serve arquivos estáticos.
// ============================================================

import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'
import LayoutLogado from './compartilhado/layout/LayoutLogado'
import RotaProtegida from './compartilhado/sessao/RotaProtegida'
import Inicio from './funcionalidades/inicio/Inicio'
import Login from './funcionalidades/acesso/Login'
import EsqueciSenha from './funcionalidades/acesso/EsqueciSenha'
import RedefinirSenha from './funcionalidades/acesso/RedefinirSenha'
import Mfa from './funcionalidades/acesso/Mfa'
import TermoDeAceite from './funcionalidades/lgpd/TermoDeAceite'
import Privacidade from './funcionalidades/lgpd/Privacidade'
import NovoAceite from './funcionalidades/lgpd/NovoAceite'
import MinhaConta from './funcionalidades/conta/MinhaConta'
import Painel from './funcionalidades/painel/Painel'
import Notas from './funcionalidades/notas/Notas'
import Disciplinas from './funcionalidades/disciplinas/Disciplinas'
import Perguntas from './funcionalidades/perguntas/Perguntas'
import Materiais from './funcionalidades/materiais/Materiais'
import PerfilAutor from './funcionalidades/materiais/PerfilAutor'
import Quiz from './funcionalidades/quiz/Quiz'
import Ranking from './funcionalidades/ranking/Ranking'
import Carreiras from './funcionalidades/carreiras/Carreiras'
import Bussola from './funcionalidades/bussola/Bussola'
import Usuarios from './funcionalidades/administracao/Usuarios'
import Logs from './funcionalidades/administracao/Logs'

function Rotas() {
  return (
    <HashRouter>
      <Routes>
        {/* Telas sem login */}
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/mfa" element={<Mfa />} />
        <Route path="/aceite" element={<NovoAceite />} />
        <Route path="/termos" element={<TermoDeAceite />} />
        <Route path="/privacidade" element={<Privacidade />} />

        {/* Área logada (exige login e MFA) */}
        <Route
          element={
            <RotaProtegida>
              <LayoutLogado />
            </RotaProtegida>
          }
        >
          <Route path="/painel" element={<Painel />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/disciplinas" element={<Disciplinas />} />
          <Route path="/materiais" element={<Materiais />} />
          <Route path="/perfil/:id" element={<PerfilAutor />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/carreiras" element={<Carreiras />} />
          <Route path="/bussola" element={<Bussola />} />
          <Route path="/carreiras/bussola" element={<Navigate to="/bussola" replace />} />
          <Route path="/minha-conta" element={<MinhaConta />} />

          {/* Somente administradores */}
          <Route
            path="/perguntas"
            element={
              <RotaProtegida somenteAdmin>
                <Perguntas />
              </RotaProtegida>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RotaProtegida somenteAdmin>
                <Usuarios />
              </RotaProtegida>
            }
          />
          <Route
            path="/logs"
            element={
              <RotaProtegida somenteAdmin>
                <Logs />
              </RotaProtegida>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default Rotas
