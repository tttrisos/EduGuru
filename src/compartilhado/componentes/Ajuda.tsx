import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

export default function Ajuda({ titulo, itens }: { titulo?: string; itens: ReactNode[] }) {
  return (
    <div className="ajuda">
      <Info size={18} className="ajuda-icone" aria-hidden="true" />
      <div>
        {titulo ? <strong className="ajuda-titulo">{titulo}</strong> : null}
        <ul>
          {itens.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
