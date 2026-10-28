import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Inicio from './pages/Inicio'
import Disciplinas from './pages/Disciplinas'
import Materiais from './pages/Materiais'
import Perguntas from './pages/Perguntas'
import Quiz from './pages/Quiz'
import Ranking from './pages/Ranking'
import Notas from './pages/Notas'
import Logs from './pages/Logs'
import MinhaConta from './pages/MinhaConta'
import Usuarios from './pages/Usuarios'
import Home from './pages/Home'
import Login from './pages/Login'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import Mfa from './pages/Mfa'
import NovoAceite from './pages/NovoAceite'
import TermoDeAceite from './pages/TermoDeAceite'
import Privacidade from './pages/Privacidade'
import RotaProtegida from './components/RotaProtegida'

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Home pública (apresentação), Login, Termo de Aceite e Política de
            Privacidade ficam fora do MainLayout — não fazem parte da área logada. */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* "Esqueci minha senha": pedido do link e tela de nova senha (aberta
            pelo link do e-mail; ver main.tsx). */}
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        {/* Código do autenticador (2º fator) — já logado com senha, mas
            ainda sem acesso à área logada até concluir o MFA. */}
        <Route path="/mfa" element={<Mfa />} />
        {/* Aceite da versão vigente do Termo/Política (contas antigas ou
            quando os documentos mudam de versão). */}
        <Route path="/aceite" element={<NovoAceite />} />
        <Route path="/termos" element={<TermoDeAceite />} />
        <Route path="/privacidade" element={<Privacidade />} />

        {/* A partir daqui exige login. "somenteAdmin" fica de fora nessa
            rota-pai porque aluno também usa várias telas — quem não pode
            criar/excluir é controlado dentro de cada página, além do RLS
            no banco. */}
        <Route
          element={
            <RotaProtegida>
              <MainLayout />
            </RotaProtegida>
          }
        >
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/disciplinas" element={<Disciplinas />} />
          <Route path="/materiais" element={<Materiais />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/minha-conta" element={<MinhaConta />} />

          {/* Banco de questões: só admin (o aluno vê as perguntas no quiz). */}
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

        {/* Endereço desconhecido (ou link antigo) volta para a Home. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
