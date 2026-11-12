import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'
import LayoutLogado from './compartilhado/LayoutLogado'
import RotaProtegida from './compartilhado/RotaProtegida'
import Home from './funcionalidades/home/Home'
import Login from './funcionalidades/acesso/Login'
import EsqueciSenha from './funcionalidades/acesso/EsqueciSenha'
import RedefinirSenha from './funcionalidades/acesso/RedefinirSenha'
import Mfa from './funcionalidades/acesso/Mfa'
import TermoDeAceite from './funcionalidades/lgpd/TermoDeAceite'
import Privacidade from './funcionalidades/lgpd/Privacidade'
import NovoAceite from './funcionalidades/lgpd/NovoAceite'
import MinhaConta from './funcionalidades/lgpd/MinhaConta'
import Painel from './funcionalidades/painel/Painel'
import Notas from './funcionalidades/notas/Notas'
import Disciplinas from './funcionalidades/disciplinas/Disciplinas'
import Perguntas from './funcionalidades/perguntas/Perguntas'
import Materiais from './funcionalidades/materiais/Materiais'
import PerfilAutor from './funcionalidades/materiais/PerfilAutor'
import Quiz from './funcionalidades/quiz/Quiz'
import Ranking from './funcionalidades/quiz/Ranking'
import Carreiras from './funcionalidades/carreiras/Carreiras'
import Bussola from './funcionalidades/carreiras/Bussola'
import Usuarios from './funcionalidades/admin/Usuarios'
import Logs from './funcionalidades/admin/Logs'

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Telas sem login */}
        <Route path="/" element={<Home />} />
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
          <Route path="/carreiras/bussola" element={<Bussola />} />
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

export default App
