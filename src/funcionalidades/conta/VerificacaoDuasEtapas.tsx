// ============================================================
// funcionalidades/conta/VerificacaoDuasEtapas.tsx
// ATIVAR / DESATIVAR A VERIFICAÇÃO EM DUAS ETAPAS (cartão em Minha conta) — RF03, RF21.
// Para o aluno é opcional. Passo a passo:
//   ATIVAR:    gera o QR Code (fatoresMfa.ts) → o aluno confirma um código do aplicativo →
//              a sessão vira aal2 e, a partir daí, todo login pede o código (o banco exige: supabase/23).
//   DESATIVAR: só com a sessão que digitou o código (o Supabase exige) E a senha atual
//              (conferir_senha_atual, supabase/21) → remove o aplicativo → log 'mfa_desativado'.
// Administrador: obrigatório, não aparece o botão de desativar.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import '../acesso/acesso.css'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { supabase } from '../../compartilhado/banco/supabase'
import { registrarLogEvento } from '../../compartilhado/banco/log'
import { useAuth } from '../../compartilhado/sessao/ContextoSessao'
import { useDialogo } from '../../compartilhado/componentes/Dialogo'
import {
  confirmarCodigo,
  fatorVerificado,
  iniciarCadastroTotp,
  limparCadastrosPendentes,
  type CadastroTotp,
} from '../acesso/fatoresMfa'

export default function VerificacaoDuasEtapas() {
  const { perfil, temMfa, atualizarMfa } = useAuth()
  const { confirmar } = useDialogo()
  const ehAdmin = perfil?.papel === 'admin'
  const location = useLocation()
  const cartao = useRef<HTMLDivElement>(null)

  // Veio do aviso 'Ativar agora' (Minha evolução): rola até este cartão.
  useEffect(() => {
    if ((location.state as { focar?: string } | null)?.focar === 'duas-etapas') {
      cartao.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [location.state])

  const [cadastro, setCadastro] = useState<CadastroTotp | null>(null)
  const [codigo, setCodigo] = useState('')
  const [senha, setSenha] = useState('')
  const [desativando, setDesativando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [enviando, setEnviando] = useState(false)

  function limparMensagens() {
    setErro('')
    setSucesso('')
  }

  // ---------- Ativar ----------
  async function comecarAtivacao() {
    limparMensagens()
    setEnviando(true)
    try {
      setCadastro(await iniciarCadastroTotp())
    } catch {
      setErro('Não foi possível gerar o QR Code. Tente de novo em instantes.')
    }
    setEnviando(false)
  }

  async function cancelarAtivacao() {
    setCadastro(null)
    setCodigo('')
    await limparCadastrosPendentes().catch(() => undefined)
  }

  async function confirmarAtivacao(e: React.FormEvent) {
    e.preventDefault()
    if (!cadastro) return
    limparMensagens()
    const codigoLimpo = codigo.replace(/\D/g, '')
    if (codigoLimpo.length !== 6) return setErro('Digite os 6 números que aparecem no aplicativo.')

    setEnviando(true)
    const falha = await confirmarCodigo(cadastro.fatorId, codigoLimpo)
    if (falha) {
      setEnviando(false)
      setCodigo('')
      return setErro('Código inválido ou expirado. Confira o horário do celular e digite o código atual.')
    }
    await registrarLogEvento('mfa_ativado')
    await atualizarMfa()
    setEnviando(false)
    setCadastro(null)
    setCodigo('')
    setSucesso('Verificação em duas etapas ativada! A partir de agora, todo login pede o código do aplicativo.')
  }

  // ---------- Desativar ----------
  async function desativar(e: React.FormEvent) {
    e.preventDefault()
    limparMensagens()
    if (!senha) return setErro('Digite a sua senha atual para confirmar.')

    const ok = await confirmar({
      titulo: 'Desativar a verificação em duas etapas?',
      mensagem:
        'Sua conta volta a ser protegida só pela senha: se alguém descobrir a senha, consegue entrar. Você pode ativar de novo quando quiser.',
      textoConfirmar: 'Desativar',
      perigo: true,
    })
    if (!ok) return

    setEnviando(true)
    // 1) A senha atual está certa? (mesma função da troca de senha; 5 erros em 15 min bloqueiam)
    const conferencia = await supabase.rpc('conferir_senha_atual', { p_senha: senha })
    if (conferencia.error || conferencia.data !== true) {
      setEnviando(false)
      return setErro(conferencia.error?.message ?? 'A senha atual está incorreta.')
    }
    // 2) Remove o aplicativo (o Supabase só deixa se esta sessão digitou o código)
    try {
      const fatorId = await fatorVerificado()
      if (fatorId) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: fatorId })
        if (error) throw error
      }
    } catch {
      setEnviando(false)
      return setErro('Não foi possível desativar. Saia, entre de novo com o código do aplicativo e tente outra vez.')
    }
    // 3) Log e sessão atualizada
    await registrarLogEvento('mfa_desativado')
    await supabase.auth.refreshSession()
    await atualizarMfa()
    setEnviando(false)
    setSenha('')
    setDesativando(false)
    setSucesso('Verificação em duas etapas desativada. Agora o login pede só a senha.')
  }

  return (
    <div className="cartao conta-secao" id="duas-etapas" ref={cartao}>
      <h3>
        {temMfa ? <ShieldCheck size={20} color="var(--certo)" aria-hidden="true" /> : <ShieldOff size={20} aria-hidden="true" />}{' '}
        Verificação em duas etapas
      </h3>
      <p>
        {temMfa ? (
          <>
            <strong>Ativada.</strong> Além da senha, todo login pede o código de 6 números do seu aplicativo
            autenticador. Mesmo que alguém descubra a sua senha, não consegue entrar.
          </>
        ) : (
          <>
            <strong>Desativada.</strong> Opcional, mas recomendada: além da senha, o login passa a pedir um
            código de 6 números de um aplicativo no celular (Google Authenticator, Microsoft Authenticator,
            Authy...). Mesmo que alguém descubra a sua senha, não consegue entrar.
          </>
        )}
      </p>

      {erro ? <p className="aviso erro">{erro}</p> : null}
      {sucesso ? <p className="aviso sucesso">{sucesso}</p> : null}

      {/* Ativar: botão → QR Code → código */}
      {!temMfa && !cadastro ? (
        <button type="button" className="btn btn-primario" onClick={comecarAtivacao} disabled={enviando}>
          {enviando ? 'Gerando...' : 'Ativar verificação em duas etapas'}
        </button>
      ) : null}

      {cadastro ? (
        <form onSubmit={confirmarAtivacao} className="mfa-ativar">
          <ol>
            <li>Instale um aplicativo autenticador no celular.</li>
            <li>No aplicativo, escolha adicionar conta e leia o QR Code.</li>
            <li>Digite o código de 6 números que aparecer.</li>
          </ol>
          <img className="mfa-qr" src={cadastro.qrCode} alt="QR Code para o aplicativo autenticador" />
          <p className="mfa-segredo">
            Não consegue ler o QR? Digite esta chave no aplicativo: <code>{cadastro.segredo}</code>
          </p>
          <input
            className="campo mfa-codigo"
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-label="Código de 6 números"
            autoFocus
          />
          <div className="acoes-item">
            <button type="submit" className="btn btn-primario" disabled={enviando}>
              {enviando ? 'Verificando...' : 'Confirmar e ativar'}
            </button>
            <button type="button" className="btn btn-secundario" onClick={cancelarAtivacao} disabled={enviando}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {/* Desativar: só aluno, com a senha atual */}
      {temMfa && ehAdmin ? (
        <p className="item-meta">Para administradores, a verificação em duas etapas é obrigatória.</p>
      ) : null}

      {temMfa && !ehAdmin && !desativando ? (
        <button type="button" className="btn btn-secundario" onClick={() => { limparMensagens(); setDesativando(true) }}>
          Desativar
        </button>
      ) : null}

      {temMfa && !ehAdmin && desativando ? (
        <form onSubmit={desativar} className="trocar-senha-form">
          <label className="rotulo">
            Para confirmar, digite a sua senha atual
            <input
              className="campo"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </label>
          <div className="acoes-item">
            <button type="submit" className="btn btn-perigo" disabled={enviando}>
              {enviando ? 'Desativando...' : 'Desativar verificação em duas etapas'}
            </button>
            <button type="button" className="btn btn-secundario" onClick={() => { setDesativando(false); setSenha('') }}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
