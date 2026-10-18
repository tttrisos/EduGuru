import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Inicio from './pages/Inicio'
import Disciplinas from './pages/Disciplinas'
import Materiais from './pages/Materiais'
import Perguntas from './pages/Perguntas'
import Logs from './pages/Logs'
import MinhaConta from './pages/MinhaConta'
import Usuarios from './pages/Usuarios'
import Home from './pages/Home'
import Login from './pages/Login'
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
        {/* Código do autenticador (2º fator) — já logado com senha, mas
            ainda sem acesso à área logada até concluir o MFA. */}
        <Route path="/mfa" element={<Mfa />} />
        {/* Aceite da versão vigente do Termo/Política (contas antigas ou
            quando os documentos mudam de versão). */}
        <Route path="/aceite" element={<NovoAceite />} />
        <Route path="/termos" element={<TermoDeAceite />} />
        <Route path="/privacidade" element={<Privacidade />} />

        {/* A partir daqui exige login. "somenteAdmin" fica de fora nessa
            rota-pai porque aluno também precisa ver disciplinas/perguntas
            — quem não pode criar/excluir é controlado dentro de cada
            página, além do RLS no banco. */}
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
          <Route path="/perguntas" element={<Perguntas />} />
          <Route path="/minha-conta" element={<MinhaConta />} />

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
