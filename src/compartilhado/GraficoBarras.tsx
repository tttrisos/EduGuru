// Gráfico de barras horizontais em HTML/CSS.

type Item = { rotulo: string; valor: number }

type Props = {
  titulo: string
  itens: Item[]
  // Valor da barra cheia (ex.: 100 para porcentagem).
  maximo?: number
  sufixo?: string
  vazio?: string
}

export default function GraficoBarras({ titulo, itens, maximo, sufixo = '', vazio }: Props) {
  const topo = maximo ?? Math.max(1, ...itens.map((i) => i.valor))

  return (
    <figure className="grafico">
      <figcaption className="grafico-titulo">{titulo}</figcaption>
      {itens.length === 0 ? (
        <p className="vazio">{vazio ?? 'Ainda não há dados.'}</p>
      ) : (
        <ul className="grafico-linhas">
          {itens.map((item) => (
            <li key={item.rotulo} className="grafico-linha" title={`${item.rotulo}: ${item.valor}${sufixo}`}>
              <span className="grafico-rotulo">{item.rotulo}</span>
              <span className="grafico-trilho">
                <span
                  className="grafico-barra"
                  style={{ width: `${Math.min(100, (item.valor / topo) * 100)}%` }}
                />
              </span>
              <span className="grafico-valor">
                {item.valor}
                {sufixo}
              </span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  )
}
