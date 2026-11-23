import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'
import LayoutLogado from './compartilhado/layout/LayoutLogado'
import RotaProtegida from './compartilhado/sessao/RotaProtegida'
import Inicio from './funcionalidades/1_publico/inicio/Inicio'
import Login from './funcionalidades/2_acesso/Login'
import EsqueciSenha from './funcionalidades/2_acesso/EsqueciSenha'
import RedefinirSenha from './funcionalidades/2_acesso/RedefinirSenha'
import Mfa from './funcionalidades/2_acesso/Mfa'
import TermoDeAceite from './funcionalidades/1_publico/lgpd/TermoDeAceite'
import Privacidade from './funcionalidades/1_publico/lgpd/Privacidade'
import NovoAceite from './funcionalidades/1_publico/lgpd/NovoAceite'
import MinhaConta from './funcionalidades/6_conta/MinhaConta'
import Painel from './funcionalidades/3_minha_evolucao/painel/Painel'
import Disciplinas from './funcionalidades/3_minha_evolucao/disciplinas/Disciplinas'
import Perguntas from './funcionalidades/7_administracao/Perguntas'
import Materiais from './funcionalidades/4_estudar/materiais/Materiais'
import PerfilAutor from './funcionalidades/4_estudar/materiais/PerfilAutor'
import Quiz from './funcionalidades/4_estudar/quiz/Quiz'
import Ranking from './funcionalidades/4_estudar/ranking/Ranking'
import Carreiras from './funcionalidades/5_carreira/carreiras/Carreiras'
import Bussola from './funcionalidades/5_carreira/bussola/Bussola'
import Usuarios from './funcionalidades/7_administracao/Usuarios'
import Logs from './funcionalidades/7_administracao/Logs'

function Rotas() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/mfa" element={<Mfa />} />
        <Route path="/aceite" element={<NovoAceite />} />
        <Route path="/termos" element={<TermoDeAceite />} />
        <Route path="/privacidade" element={<Privacidade />} />

        <Route
          element={
            <RotaProtegida>
              <LayoutLogado />
            </RotaProtegida>
          }
        >
          <Route path="/painel" element={<Painel />} />
          <Route path="/disciplinas" element={<Disciplinas />} />
          <Route path="/materiais" element={<Materiais />} />
          <Route path="/perfil/:id" element={<PerfilAutor />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/carreiras" element={<Carreiras />} />
          <Route path="/bussola" element={<Bussola />} />
          <Route path="/carreiras/bussola" element={<Navigate to="/bussola" replace />} />
          <Route path="/minha-conta" element={<MinhaConta />} />

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
