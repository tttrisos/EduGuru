// ============================================================
// compartilhado/layout/Rodape.tsx
// RODAPÉ: links para o Termo de Aceite e a Política de Privacidade, em todas as telas.
// ============================================================

import { Link } from 'react-router-dom'

export default function Rodape() {
  return (
    <footer className="rodape">
      <span>© 2026 EduGuru — PFC UMC</span>
      <span className="rodape-links">
        <Link to="/termos">Termo de Aceite</Link>
        <Link to="/privacidade">Política de Privacidade</Link>
      </span>
    </footer>
  )
}
