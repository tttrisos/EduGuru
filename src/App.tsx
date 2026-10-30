import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import RotaProtegida from './components/RotaProtegida'
import Home from './pages/publico/Home'
import Login from './pages/autenticacao/Login'
import EsqueciSenha from './pages/autenticacao/EsqueciSenha'
import RedefinirSenha from './pages/autenticacao/RedefinirSenha'
import Mfa from './pages/autenticacao/Mfa'
import TermoDeAceite from './pages/lgpd/TermoDeAceite'
import Privacidade from './pages/lgpd/Privacidade'
import NovoAceite from './pages/lgpd/NovoAceite'
import MinhaConta from './pages/lgpd/MinhaConta'
import Painel from './pages/painel/Painel'
import Notas from './pages/painel/Notas'
import Disciplinas from './pages/cadastros/Disciplinas'
import Perguntas from './pages/cadastros/Perguntas'
import Materiais from './pages/cadastros/Materiais'
import Quiz from './pages/quiz/Quiz'
import Ranking from './pages/quiz/Ranking'
import Usuarios from './pages/admin/Usuarios'
import Logs from './pages/admin/Logs'

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
              <MainLayout />
            </RotaProtegida>
          }
        >
          <Route path="/painel" element={<Painel />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/disciplinas" element={<Disciplinas />} />
          <Route path="/materiais" element={<Materiais />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/ranking" element={<Ranking />} />
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
