import { useState } from 'react'
import { rotuloDoLog } from '../../compartilhado/banco/log'
import FiltrosLogs from '../../compartilhado/componentes/FiltrosLogs'
import type { LogAuditoria } from '../../compartilhado/tipos'
import { FILTRO_INICIAL, filtrarLogs, totaisPorCategoria } from '../../compartilhado/utilitarios/filtroLogs'

const POR_PAGINA = 30

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR')
}

export default function RegistrosAtividade({ logs }: { logs: LogAuditoria[] | null }) {
  const [filtro, setFiltro] = useState(FILTRO_INICIAL)
  const [quantos, setQuantos] = useState(POR_PAGINA)

  const visiveis = logs ? filtrarLogs(logs, filtro, new Date()) : []

  return (
    <div className="cartao conta-secao">
      <h3>Meus registros de atividade</h3>
      <p className="item-meta">
        Logins, alterações e demais eventos ligados à sua conta. São guardados por 90 dias e apagados
        automaticamente.
      </p>

      {!logs ? <p className="status">Carregando...</p> : null}
      {logs && logs.length === 0 ? <p className="vazio">Nenhum registro.</p> : null}

      {logs && logs.length > 0 ? (
        <>
          <FiltrosLogs
            filtro={filtro}
            aoMudar={(f) => {
              setFiltro(f)
              setQuantos(POR_PAGINA)
            }}
            totais={totaisPorCategoria(filtrarLogs(logs, { ...filtro, categoria: 'todos' }, new Date()))}
            textoBusca="Buscar (ex.: login, senha, Chrome)"
          />
          <p className="item-meta" aria-live="polite">
            {visiveis.length} registro(s) com esses filtros.
          </p>
          {visiveis.length === 0 ? (
            <p className="vazio">Nenhum registro com esses filtros.</p>
          ) : (
            <ul className="lista">
              {visiveis.slice(0, quantos).map((log) => (
                <li key={log.id} className="item-lista">
                  <div>
                    <strong>
                      {rotuloDoLog(log)}
                      {log.tabela ? ` · ${log.tabela}` : ''}
                    </strong>
                    <span className="item-meta">
                      {formatarData(log.criado_em)}
                      {typeof log.detalhes?.aparelho === 'string' ? ` — ${log.detalhes.aparelho}` : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {visiveis.length > quantos ? (
            <button type="button" className="btn btn-secundario" onClick={() => setQuantos((q) => q + POR_PAGINA)}>
              Mostrar mais
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
