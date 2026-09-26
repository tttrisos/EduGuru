import { HashRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Inicio from './pages/Inicio'
import Disciplinas from './pages/Disciplinas'
import Materiais from './pages/Materiais'
import Perguntas from './pages/Perguntas'
import Logs from './pages/Logs'
import Login from './pages/Login'
import TermoDeAceite from './pages/TermoDeAceite'
import Privacidade from './pages/Privacidade'
import RotaProtegida from './components/RotaProtegida'

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Login, Termo de Aceite e Política de Privacidade ficam fora do
            MainLayout — não fazem parte da área logada. */}
        <Route path="/login" element={<Login />} />
        <Route path="/termos" element={<TermoDeAceite />} />
        <Route path="/privacidade" element={<Privacidade />} />

        {/* A partir daqui exige login. "somenteAdmin" fica de fora nessa
            rota-pai porque aluno também precisa ver disciplinas/perguntas
            — quem não pode criar/excluir é controlado dentro de cada
            página, além do RLS no banco. */}
        <Route
          path="/"
          element={
            <RotaProtegida>
              <MainLayout />
            </RotaProtegida>
          }
        >
          <Route index element={<Inicio />} />
          <Route path="disciplinas" element={<Disciplinas />} />
          <Route path="materiais" element={<Materiais />} />
          <Route path="perguntas" element={<Perguntas />} />

          <Route
            path="logs"
            element={
              <RotaProtegida somenteAdmin>
                <Logs />
              </RotaProtegida>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
