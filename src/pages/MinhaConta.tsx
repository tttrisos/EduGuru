import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { CURSOS, type LogAuditoria, type Material } from '../types'
import { removerArquivosDoUsuario } from '../lib/conta'
import { ROTULO_ACAO } from '../lib/log'

// Tela para o titular exercer os direitos da LGPD (art. 18) sozinho:
// acesso aos dados, correção, revogação do consentimento do campo opcional
// (cidade/estado) e eliminação da conta. Ligada à seção 7 da Política.

const TEXTO_CONFIRMACAO = 'EXCLUIR'

type DadosExtras = {
  logs: LogAuditoria[]
  materiais: Material[]
  mfaAtivoDesde: string | null
}

async function consultarDadosExtras(usuarioId: string): Promise<DadosExtras> {
  const [logs, materiais, fatores] = await Promise.all([
    supabase
      .from('logs_auditoria')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('criado_em', { ascending: false })
      .limit(100),
    supabase.from('materiais').select('*').eq('enviado_por', usuarioId),
    supabase.auth.mfa.listFactors(),
  ])
  return {
    logs: (logs.data as LogAuditoria[]) ?? [],
    materiais: (materiais.data as Material[]) ?? [],
    mfaAtivoDesde: fatores.data?.totp[0]?.created_at ?? null,
  }
}

function formatarData(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleString('pt-BR') : '—'
}

function nomeCurso(valor: string | null) {
  return CURSOS.find((c) => c.valor === valor)?.label ?? valor ?? '—'
}

export default function MinhaConta() {
  const { usuario, perfil, recarregarPerfil } = useAuth()
  const navigate = useNavigate()

  const [extras, setExtras] = useState<DadosExtras | null>(null)

  const [nome, setNome] = useState(perfil?.nome ?? '')
  const [curso, setCurso] = useState(perfil?.curso ?? '')
  const [cidade, setCidade] = useState(perfil?.cidade ?? '')
  const [estado, setEstado] = useState(perfil?.estado ?? '')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  const [confirmacao, setConfirmacao] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')

  useEffect(() => {
    if (!usuario) return
    consultarDadosExtras(usuario.id).then(setExtras)
  }, [usuario])

  if (!usuario || !perfil) return <p className="status">Carregando...</p>

  async function salvarCorrecao(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setMensagem('')
    if (!nome.trim()) {
      setErro('O nome não pode ficar vazio.')
      return
    }
    const uf = estado.trim().toUpperCase()
    if (uf && !/^[A-Z]{2}$/.test(uf)) {
      setErro('Estado deve ser a sigla com 2 letras (ex.: SP).')
      return
    }
    setSalvando(true)
    const { error } = await supabase
      .from('perfis')
      .update({
        nome: nome.trim(),
        curso: curso || null,
        cidade: cidade.trim() || null,
        estado: uf || null,
      })
      .eq('id', usuario!.id)
    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    setMensagem('Dados atualizados.')
    await recarregarPerfil()
  }

  async function revogarLocalizacao() {
    setErro('')
    setMensagem('')
    const { error } = await supabase
      .from('perfis')
      .update({ cidade: null, estado: null })
      .eq('id', usuario!.id)
    if (error) {
      setErro(error.message)
      return
    }
    setCidade('')
    setEstado('')
    setMensagem('Consentimento revogado: cidade e estado foram apagados do seu perfil.')
    await recarregarPerfil()
  }

  // Portabilidade/acesso: tudo o que o sistema guarda sobre a pessoa, num
  // arquivo JSON gerado no próprio navegador (não passa por outro serviço).
  function baixarMeusDados() {
    const conteudo = {
      gerado_em: new Date().toISOString(),
      conta: { id: usuario!.id, email: usuario!.email, criada_em: usuario!.created_at },
      perfil,
      mfa: { ativo_desde: extras?.mfaAtivoDesde ?? null },
      materiais_enviados: extras?.materiais ?? [],
      registros_de_atividade: extras?.logs ?? [],
    }
    const blob = new Blob([JSON.stringify(conteudo, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'eduguru-meus-dados.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function excluirConta() {
    setErroExclusao('')
    if (confirmacao !== TEXTO_CONFIRMACAO) {
      setErroExclusao(`Digite ${TEXTO_CONFIRMACAO} para confirmar.`)
      return
    }
    setExcluindo(true)

    const erroArquivos = await removerArquivosDoUsuario(usuario!.id)
    if (erroArquivos) {
      setExcluindo(false)
      setErroExclusao(`Não foi possível remover seus arquivos: ${erroArquivos}`)
      return
    }

    const { error } = await supabase.rpc('excluir_minha_conta')
    if (error) {
      setExcluindo(false)
      setErroExclusao(error.message)
      return
    }

    // A conta não existe mais: só limpamos a sessão deste navegador.
    await supabase.auth.signOut({ scope: 'local' })
    navigate('/login', { replace: true })
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Minha conta</h2>
        <p>
          Aqui você exerce os seus direitos de titular previstos na LGPD: ver os dados que o
          EduGuru guarda sobre você, corrigi-los, revogar o consentimento do campo opcional e
          excluir a conta. Veja a seção 7 da Política de Privacidade.
        </p>
      </header>

      <div className="cartao conta-secao">
        <h3>Meus dados</h3>
        <dl className="conta-dados">
          <dt>Nome</dt>
          <dd>{perfil.nome}</dd>
          <dt>E-mail</dt>
          <dd>{usuario.email}</dd>
          <dt>Curso</dt>
          <dd>{nomeCurso(perfil.curso)}</dd>
          <dt>Cidade/estado (opcional)</dt>
          <dd>{perfil.cidade ? `${perfil.cidade} - ${perfil.estado ?? ''}` : 'Não informado'}</dd>
          <dt>Tipo de conta</dt>
          <dd>{perfil.papel === 'admin' ? 'Administrador' : 'Aluno'}</dd>
          <dt>Conta criada em</dt>
          <dd>{formatarData(perfil.criado_em)}</dd>
          <dt>Aceite do Termo e da Política</dt>
          <dd>
            {perfil.consentimento_em
              ? `${formatarData(perfil.consentimento_em)} (versão ${perfil.versao_termos ?? '—'})`
              : 'Sem registro no banco (conta criada antes do registro de aceite)'}
          </dd>
          <dt>Verificação em duas etapas</dt>
          <dd>{extras?.mfaAtivoDesde ? `Ativa desde ${formatarData(extras.mfaAtivoDesde)}` : '—'}</dd>
          <dt>Materiais enviados</dt>
          <dd>{extras ? extras.materiais.length : '...'}</dd>
        </dl>
        <button type="button" className="btn btn-secundario" onClick={baixarMeusDados} disabled={!extras}>
          Baixar meus dados (JSON)
        </button>
      </div>

      <div className="cartao conta-secao">
        <h3>Corrigir dados</h3>
        <form onSubmit={salvarCorrecao} className="form-linha">
          <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" />
          <select className="campo" value={curso} onChange={(e) => setCurso(e.target.value)}>
            <option value="">Selecione o curso...</option>
            {CURSOS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            className="campo"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade (opcional)"
          />
          <input
            className="campo conta-uf"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            placeholder="UF"
            maxLength={2}
          />
          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
        <p className="item-meta">
          E-mail e tipo de conta não podem ser alterados por aqui. Toda alteração fica registrada
          no log de auditoria (só o nome do campo alterado, não o valor).
        </p>
        {erro ? <p className="aviso erro">{erro}</p> : null}
        {mensagem ? <p className="aviso sucesso">{mensagem}</p> : null}
      </div>

      <div className="cartao conta-secao">
        <h3>Revogar consentimento de localização</h3>
        <p>
          Cidade e estado são opcionais e tratados com base no seu consentimento. Ao revogar,
          os dois campos são apagados do seu perfil. Você pode informá-los de novo quando quiser.
        </p>
        <button
          type="button"
          className="btn btn-secundario"
          onClick={revogarLocalizacao}
          disabled={!perfil.cidade && !perfil.estado}
        >
          Revogar e apagar cidade/estado
        </button>
      </div>

      <div className="cartao conta-secao">
        <h3>Meus registros de atividade</h3>
        <p className="item-meta">
          Logins, alterações e demais eventos ligados à sua conta (últimos 100). São guardados
          por 90 dias e apagados automaticamente.
        </p>
        {!extras ? <p className="status">Carregando...</p> : null}
        {extras && extras.logs.length === 0 ? <p className="vazio">Nenhum registro.</p> : null}
        {extras && extras.logs.length > 0 ? (
          <ul className="lista">
            {extras.logs.map((log) => (
              <li key={log.id} className="item-lista">
                <div>
                  <strong>
                    {ROTULO_ACAO[log.acao] ?? log.acao}
                    {log.tabela ? ` · ${log.tabela}` : ''}
                  </strong>
                  <span className="item-meta">{formatarData(log.criado_em)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="cartao conta-secao conta-perigo">
        <h3>Excluir minha conta</h3>
        <p>Esta ação é permanente e não pode ser desfeita. Ao excluir:</p>
        <ul>
          <li>seu perfil, sua conta de acesso e a verificação em duas etapas são apagados;</li>
          <li>os materiais que você enviou (e os arquivos anexados) são apagados;</li>
          <li>
            os registros de auditoria já feitos ficam guardados até completar 90 dias, por
            segurança, e depois são apagados automaticamente.
          </li>
        </ul>
        <div className="form-linha">
          <input
            className="campo"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            placeholder={`Digite ${TEXTO_CONFIRMACAO} para confirmar`}
          />
          <button
            type="button"
            className="btn btn-perigo conta-btn-excluir"
            onClick={excluirConta}
            disabled={excluindo || confirmacao !== TEXTO_CONFIRMACAO}
          >
            {excluindo ? 'Excluindo...' : 'Excluir minha conta'}
          </button>
        </div>
        {erroExclusao ? <p className="aviso erro">{erroExclusao}</p> : null}
      </div>
    </section>
  )
}
