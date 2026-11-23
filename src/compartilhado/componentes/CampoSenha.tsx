import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export default function CampoSenha({ className, ...props }: Props) {
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
