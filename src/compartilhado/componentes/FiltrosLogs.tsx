// ============================================================
// compartilhado/componentes/FiltrosLogs.tsx
// CONTROLES DE FILTRO DOS LOGS: categoria (botões), período e busca.
// Usado em administracao/Logs.tsx (admin) e conta/RegistrosAtividade.tsx (Minha conta).
// As regras ficam em compartilhado/utilitarios/filtroLogs.ts.
// ============================================================

import { CATEGORIAS_LOG, PERIODOS_LOG, type Categoria, type FiltroLogs } from '../utilitarios/filtroLogs'

type Props = {
  filtro: FiltroLogs
  aoMudar: (filtro: FiltroLogs) => void
  // Números ao lado de cada categoria (opcional: só quando a lista inteira está na tela).
  totais?: Record<Categoria, number>
  textoBusca?: string
  // Conteúdo extra na linha dos campos (ex.: filtro por tabela, só para o admin).
  children?: React.ReactNode
}

export default function FiltrosLogs({ filtro, aoMudar, totais, textoBusca = 'Buscar', children }: Props) {
  return (
    <div className="filtros-logs">
      <div className="chips-areas" role="group" aria-label="Filtrar por tipo de registro">
        {CATEGORIAS_LOG.map((c) => (
          <button
            key={c.valor}
            type="button"
            className={`chip${filtro.categoria === c.valor ? ' ativo' : ''}`}
            aria-pressed={filtro.categoria === c.valor}
            onClick={() => aoMudar({ ...filtro, categoria: c.valor })}
          >
            {c.rotulo}
            {totais ? <span className="chip-total">{totais[c.valor]}</span> : null}
          </button>
        ))}
      </div>
      <div className="form-linha">
        <select
          className="campo"
          value={filtro.dias}
          onChange={(e) => aoMudar({ ...filtro, dias: Number(e.target.value) })}
          aria-label="Período"
        >
          {PERIODOS_LOG.map((p) => (
            <option key={p.dias} value={p.dias}>
              {p.rotulo}
            </option>
          ))}
        </select>
        <input
          className="campo"
          type="search"
          value={filtro.busca}
          onChange={(e) => aoMudar({ ...filtro, busca: e.target.value })}
          placeholder={textoBusca}
          aria-label={textoBusca}
        />
        {children}
      </div>
    </div>
  )
}
