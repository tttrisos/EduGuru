// ============================================================
// compartilhado/componentes/CampoSenha.tsx
// CAMPO DE SENHA COM O "OLHINHO": um botão ao lado da senha mostra ou esconde o que foi digitado.
// Aparece em: Login e cadastro, Redefinir senha, Minha conta (Trocar senha e desativar
// a verificação em duas etapas).
// Banco: nenhum. É só tela: a senha continua indo para o Supabase Auth do mesmo jeito.
// ============================================================

import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Recebe as mesmas propriedades de um <input> (value, onChange, placeholder, autoComplete...),
// menos o "type", que o próprio componente controla.
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export default function CampoSenha({ className, ...props }: Props) {
  // Para a banca: começa sempre escondida. "visivel" é só um estado da tela; a senha
  // nunca é gravada nem enviada para outro lugar por causa do olhinho.
  const [visivel, setVisivel] = useState(false)
  const rotulo = visivel ? 'Ocultar senha' : 'Mostrar senha'

  return (
    <div className="campo-senha">
      <input {...props} className={className ?? 'campo'} type={visivel ? 'text' : 'password'} />
      <button
        type="button"
        className="campo-senha-olho"
        onClick={() => setVisivel((v) => !v)}
        aria-label={rotulo}
        aria-pressed={visivel}
        title={rotulo}
      >
        {visivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  )
}
