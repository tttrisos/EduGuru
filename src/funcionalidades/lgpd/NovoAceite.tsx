// ============================================================
// funcionalidades/lgpd/NovoAceite.tsx
// NOVO ACEITE (endereço /aceite) — RF22. Aparece quando o Termo/Política mudam de versão (VERSAO_TERMOS).
// Banco: registrar_aceite (supabase/08). Quem não aceitar pode excluir a conta (excluir_minha_conta).
// ============================================================

import { useState } from 'react'
import { useDialogo } from '../../compartilhado/componentes/Dialogo'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { supabase } from '../../compartilhado/banco/supabase'
import { useAuth } from '../../compartilhado/sessao/ContextoSessao'
import { VERSAO_TERMOS } from '../../compartilhado/tipos'
import Rodape from '../../compartilhado/layout/Rodape'
import { removerArquivosDoUsuario } from '../conta/arquivosDoUsuario'
import './lgpd.css'

// Pede novo aceite quando o Termo/Política mudam de versão.
export default function NovoAceite() {
  const { confirmar, pedirTexto } = useDialogo()
  const { usuario, perfil, carregando, verificacaoOk, recarregarPerfil, sair } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as { rotaOrigem?: string } | null)?.rotaOrigem ?? '/painel'

  const [marcado, setMarcado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  if (carregando) return <p className="status">Carregando...</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (!verificacaoOk) return <Navigate to="/mfa" replace />
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
    const digitado = await pedirTexto({
      titulo: 'Excluir sua conta?',
      mensagem:
        'Perfil, conta de acesso e materiais enviados serão apagados. Os registros de auditoria ' +
        'ficam até completar 90 dias. Isso não pode ser desfeito.',
      rotulo: 'Digite EXCLUIR para confirmar',
      exigir: 'EXCLUIR',
      textoConfirmar: 'Excluir conta',
      perigo: true,
    })
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
    if (!(await confirmar({ titulo: 'Sair da sua conta?', mensagem: 'Para entrar de novo, você vai precisar da senha e do código do aplicativo autenticador.', textoConfirmar: 'Sair' }))) return
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
            Principais mudanças: a verificação em duas etapas passou a ser opcional para alunos
            (ative ou desative em Minha conta), os e-mails de cadastro e de nova senha agora
            são entregues pelo serviço Brevo, o login tem a verificação "não sou um robô" (Cloudflare) e
            Minha conta mostra os seus últimos acessos, com o tipo de aparelho.
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
          <button type="button" className="link-botao link-perigo" onClick={excluirConta} disabled={enviando}>
            excluir minha conta
          </button>
          .
        </p>
      </div>

      <Rodape />
    </div>
  )
}
