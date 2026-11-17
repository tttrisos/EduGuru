// ============================================================
// funcionalidades/7_administracao/Logs.tsx
// LOGS DE AUDITORIA (endereço /logs, só admin) — RF09, RF10.
// Filtros (pedido da pré-banca de 13/11): tipo de registro, período, e-mail e tabela. Os filtros vão
// na própria consulta ao banco, então valem para TODOS os logs guardados, não só para os da tela.
// Regras dos filtros: compartilhado/utilitarios/filtroLogs.ts. Índices: supabase/24.
// Banco: lê logs_auditoria (supabase/02) e chama limpar_logs_antigos (supabase/10).
// A limpeza automática de 90 dias roda sozinha no banco (pg_cron, supabase/06).
// ============================================================

import { useEffect, useState } from 'react'
import { supabase } from '../../compartilhado/banco/supabase'
import type { LogAuditoria } from '../../compartilhado/tipos'
import { ROTULO_ACAO } from '../../compartilhado/banco/log'
import FiltrosLogs from '../../compartilhado/componentes/FiltrosLogs'
import {
  FILTRO_INICIAL,
  acoesDaCategoria,
  inicioDoPeriodo,
  type FiltroLogs,
} from '../../compartilhado/utilitarios/filtroLogs'
import './administracao.css'

const POR_PAGINA = 100

// Tabelas que têm log automático de criar/editar/excluir (gatilhos dos scripts 02, 12, 18 e 22).
const TABELAS = ['disciplinas', 'perguntas', 'materiais', 'perfis', 'notas', 'bussola_afirmacoes', 'filtro_sites', 'filtro_termos']

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR')
}

type Filtro = FiltroLogs & { tabela: string }

// Monta a consulta com os filtros. A busca procura no e-mail de quem fez a ação.
async function consultarLogs(filtro: Filtro, quantos: number) {
  let consulta = supabase
    .from('logs_auditoria')
    .select('*', { count: 'exact' })
    .gte('criado_em', inicioDoPeriodo(filtro.dias, new Date()))
    .order('criado_em', { ascending: false })
    .limit(quantos)
  const acoes = acoesDaCategoria(filtro.categoria)
  if (acoes) consulta = consulta.in('acao', acoes)
  if (filtro.tabela) consulta = consulta.eq('tabela', filtro.tabela)
  const busca = filtro.busca.trim().replace(/[%_,()]/g, '')
  if (busca) consulta = consulta.ilike('usuario_email', `%${busca}%`)
  return await consulta
}

export default function Logs() {
  const [lista, setLista] = useState<LogAuditoria[]>([])
  const [total, setTotal] = useState(0)
  const [filtro, setFiltro] = useState<Filtro>({ ...FILTRO_INICIAL, tabela: '' })
  const [quantos, setQuantos] = useState(POR_PAGINA)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [limpando, setLimpando] = useState(false)
  const [mensagemLimpeza, setMensagemLimpeza] = useState('')
  const [versao, setVersao] = useState(0)

  // Busca de novo quando um filtro muda (a digitação espera 400 ms para não consultar a cada letra).
  useEffect(() => {
    let cancelado = false
    const espera = setTimeout(() => {
      setCarregando(true)
      consultarLogs(filtro, quantos).then(({ data, error, count }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else {
          setLista((data as LogAuditoria[]) ?? [])
          setTotal(count ?? 0)
          setErro('')
        }
        setCarregando(false)
      })
    }, 400)
    return () => {
      cancelado = true
      clearTimeout(espera)
    }
  }, [filtro, quantos, versao])

  function mudarFiltro(novo: Filtro) {
    setQuantos(POR_PAGINA)
    setFiltro(novo)
  }

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
    setVersao((v) => v + 1)
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Logs de auditoria</h2>
        <p>Logins, alterações e exclusões. Filtre por tipo, período, e-mail de quem fez ou tabela.</p>
        <p className="pagina-fatos">
          <span>Só administradores veem (regra garantida no banco)</span>
          <span>Apagados após 90 dias, todo dia às 03h</span>
          <span>O botão abaixo é um reforço manual</span>
        </p>
      </header>

      <div className="cartao">
        <div className="logs-acoes">
          <button type="button" className="btn btn-perigo" onClick={limparAntigos} disabled={limpando}>
            {limpando ? 'Limpando...' : 'Limpar logs com mais de 90 dias'}
          </button>
          {mensagemLimpeza ? <span className="aviso sucesso">{mensagemLimpeza}</span> : null}
        </div>

        <FiltrosLogs
          filtro={filtro}
          aoMudar={(f) => mudarFiltro({ ...filtro, ...f })}
          textoBusca="Buscar pelo e-mail de quem fez"
        >
          <select
            className="campo"
            value={filtro.tabela}
            onChange={(e) => mudarFiltro({ ...filtro, tabela: e.target.value })}
            aria-label="Tabela"
          >
            <option value="">Todas as tabelas</option>
            {TABELAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => mudarFiltro({ ...FILTRO_INICIAL, tabela: '' })}
          >
            Limpar filtros
          </button>
        </FiltrosLogs>

        {erro ? <p className="aviso erro">{erro}</p> : null}
        <p className="item-meta" aria-live="polite">
          {carregando ? 'Carregando...' : `${total} registro(s) encontrado(s)${total > lista.length ? `, mostrando os ${lista.length} mais recentes` : ''}.`}
        </p>

        {!carregando && lista.length === 0 ? (
          <p className="vazio">Nenhum registro com esses filtros.</p>
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
                    {typeof log.detalhes?.aparelho === 'string' ? ` — ${log.detalhes.aparelho}` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {total > lista.length ? (
          <button type="button" className="btn btn-secundario" onClick={() => setQuantos((q) => q + POR_PAGINA)}>
            Mostrar mais
          </button>
        ) : null}
      </div>
    </section>
  )
}
