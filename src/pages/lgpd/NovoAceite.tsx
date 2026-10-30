import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { supabase } from '../../supabase'
import { useAuth } from '../../contexts/AuthContext'
import { VERSAO_TERMOS } from '../../types'
import Rodape from '../../components/Rodape'
import { removerArquivosDoUsuario } from '../../lib/conta'

// Pede novo aceite quando o Termo/Política mudam de versão.
export default function NovoAceite() {
  const { usuario, perfil, carregando, mfaConcluido, recarregarPerfil, sair } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as { rotaOrigem?: string } | null)?.rotaOrigem ?? '/painel'

  const [marcado, setMarcado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  if (carregando) return <p className="status">Carregando...</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (!mfaConcluido) return <Navigate to="/mfa" replace />
  if (perfil && perfil.versao_termos === VERSAO_TERMOS) return <Navigate to={destino} replace />

  async function aceitar() {
    setErro('')
    setEnviando(true)
    const { error } = await supabase.rpc('registrar_aceite', { versao: VERSAO_TERMOS })
    if (error) {
      setEnviando(false)
      setErro(error.message)
      return
    }
    await recarregarPerfil()
    setEnviando(false)
    navigate(destino, { replace: true })
  }

  async function excluirConta() {
    const digitado = window.prompt(
      'Excluir sua conta? Perfil, conta de acesso e materiais enviados serão apagados. ' +
        'Os registros de auditoria ficam até completar 90 dias.\n\nDigite EXCLUIR para confirmar:',
    )
    if (digitado !== 'EXCLUIR') return
    setErro('')
    setEnviando(true)
    const erroArquivos = await removerArquivosDoUsuario(usuario!.id)
    if (erroArquivos) {
      setEnviando(false)
      setErro(`Não foi possível remover seus arquivos: ${erroArquivos}`)
      return
    }
    const { error } = await supabase.rpc('excluir_minha_conta')
    if (error) {
      setEnviando(false)
      setErro(error.message)
      return
    }
    await supabase.auth.signOut({ scope: 'local' })
    navigate('/login', { replace: true })
  }

  async function aoSair() {
    await sair()
    navigate('/login', { replace: true })
  }

  return (
    <div className="login-tela">
      <div className="login-cartao cartao">
        <div className="login-marca">
          <GraduationCap size={32} color="#8257e5" />
          <div>
            <h1>EduGuru</h1>
            <small>Termos atualizados</small>
          </div>
        </div>

        <div className="mfa-passos">
          <p>
            {perfil?.versao_termos
              ? `Você aceitou a versão ${perfil.versao_termos} dos nossos documentos. `
              : 'Não encontramos o registro do seu aceite dos nossos documentos. '}
            Para continuar, leia e aceite a versão {VERSAO_TERMOS}:
          </p>
          <ul>
            <li>
              <Link to="/termos" target="_blank" rel="noreferrer">
                Termo de Aceite
              </Link>
            </li>
            <li>
              <Link to="/privacidade" target="_blank" rel="noreferrer">
                Política de Privacidade
              </Link>
            </li>
          </ul>
          <p className="item-meta">
            Principais mudanças: verificação em duas etapas obrigatória, registro da data e da
            versão do aceite, tela Minha conta (ver, corrigir, baixar e excluir seus dados) e
            arquivos de materiais acessíveis só por usuários logados.
          </p>
        </div>

        <label className="checkbox-linha">
          <input type="checkbox" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} />
          <span>Li e aceito o Termo de Aceite e a Política de Privacidade (versão {VERSAO_TERMOS}).</span>
        </label>

        {erro ? <p className="aviso erro">{erro}</p> : null}

        <div className="login-form">
          <button
            type="button"
            className="btn btn-primario login-botao"
            onClick={aceitar}
            disabled={!marcado || enviando}
          >
            {enviando ? 'Registrando...' : 'Aceitar e continuar'}
          </button>
          <button type="button" className="btn btn-secundario login-botao" onClick={aoSair}>
            Não aceito — sair
          </button>
        </div>

        <p className="login-rodape">
          Não concorda? Você pode excluir sua conta agora, sem precisar aceitar:{' '}
          <button type="button" className="link-botao" onClick={excluirConta} disabled={enviando}>
            excluir minha conta
          </button>
          .
        </p>
      </div>

      <Rodape />
    </div>
  )
}
