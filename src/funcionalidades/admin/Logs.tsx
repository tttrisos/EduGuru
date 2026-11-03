import { useEffect, useState } from 'react'
import { supabase } from '../../compartilhado/supabase'
import type { LogAuditoria } from '../../compartilhado/tipos'
import { ROTULO_ACAO } from '../../compartilhado/log'
import './admin.css'

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR')
}

async function consultarLogs() {
  return await supabase
    .from('logs_auditoria')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(200)
}

export default function Logs() {
  const [lista, setLista] = useState<LogAuditoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [limpando, setLimpando] = useState(false)
  const [mensagemLimpeza, setMensagemLimpeza] = useState('')

  async function buscar() {
    setCarregando(true)
    const { data, error } = await consultarLogs()

    if (error) setErro(error.message)
    else {
      setLista((data as LogAuditoria[]) ?? [])
      setErro('')
    }
    setCarregando(false)
  }

  useEffect(() => {
    consultarLogs().then(({ data, error }) => {
      if (error) setErro(error.message)
      else setLista((data as LogAuditoria[]) ?? [])
      setCarregando(false)
    })
  }, [])

  async function limparAntigos() {
    setLimpando(true)
    setMensagemLimpeza('')
    setErro('')

    // O prazo de 90 dias é fixo no banco.
    const { data, error } = await supabase.rpc('limpar_logs_antigos')

    setLimpando(false)
    if (error) {
      setErro(error.message)
      return
    }
    setMensagemLimpeza(`${data} registro(s) com mais de 90 dias foram removidos.`)
    buscar()
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Logs de auditoria</h2>
        <p>
          Últimos 200 eventos registrados no sistema (login, logout, criação/edição/exclusão de
          registros). Só administradores enxergam esta página — a regra está garantida no banco
          (RLS), não só aqui na tela.
        </p>
        <p>
          Logs com mais de 90 dias são apagados automaticamente todo dia às 03h (horário de
          Brasília), por uma tarefa agendada no banco. O botão abaixo é só um reforço manual.
        </p>
      </header>

      <div className="cartao">
        <div className="logs-acoes">
          <button type="button" className="btn btn-perigo" onClick={limparAntigos} disabled={limpando}>
            {limpando ? 'Limpando...' : 'Limpar logs com mais de 90 dias'}
          </button>
          {mensagemLimpeza ? <span className="aviso sucesso">{mensagemLimpeza}</span> : null}
        </div>

        {erro ? <p className="aviso erro">{erro}</p> : null}
        {carregando ? <p className="status">Carregando...</p> : null}

        {!carregando && lista.length === 0 ? (
          <p className="vazio">Nenhum log registrado ainda.</p>
        ) : (
          <ul className="lista">
            {lista.map((log) => (
              <li key={log.id} className="item-lista">
                <div>
                  <strong>
                    {ROTULO_ACAO[log.acao] ?? log.acao}
                    {log.tabela ? ` · ${log.tabela}` : ''}
                  </strong>
                  <span className="item-meta">
                    {log.usuario_email ?? 'usuário desconhecido'} — {formatarData(log.criado_em)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}