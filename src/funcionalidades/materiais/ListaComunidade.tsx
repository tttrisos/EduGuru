import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Flag, Paperclip } from 'lucide-react'
import { supabase } from '../../compartilhado/supabase'
import { useAuth } from '../../compartilhado/AuthContext'
import { formatarTamanho } from '../../compartilhado/arquivos'
import type { MaterialComunidade } from '../../compartilhado/tipos'
import { MOTIVOS_DENUNCIA } from './comunidade'
import './materiais.css'

type Props = {
  materiais: MaterialComunidade[]
  urls: Record<string, string>
  mostrarAutor?: boolean
}

// Materiais aprovados dos colegas, com o autor (abre o perfil) e o botão de denunciar.
export default function ListaComunidade({ materiais, urls, mostrarAutor = true }: Props) {
  const { usuario } = useAuth()
  const [denunciando, setDenunciando] = useState<number | null>(null)
  const [motivo, setMotivo] = useState(MOTIVOS_DENUNCIA[0])
  const [mensagens, setMensagens] = useState<Record<number, string>>({})

  async function denunciar(id: number) {
    const { data, error } = await supabase.rpc('denunciar_material', { p_material_id: id, p_motivo: motivo })
    setMensagens((atuais) => ({ ...atuais, [id]: error ? error.message : (data as string) }))
    setDenunciando(null)
  }

  return (
    <ul className="comunidade-lista">
      {materiais.map((m) => (
        <li key={m.id} className="comunidade-item">
          <div className="comunidade-conteudo">
            <strong>
              {m.titulo}
              {m.disciplina && !mostrarAutor ? <span className="selo">{m.disciplina}</span> : null}
            </strong>
            {m.descricao ? <p className="comunidade-descricao">{m.descricao}</p> : null}

            <div className="comunidade-links">
              {m.link ? (
                <a href={m.link} target="_blank" rel="noreferrer noopener">
                  <ExternalLink size={14} /> Abrir link
                </a>
              ) : null}
              {m.arquivo_path && urls[m.arquivo_path] ? (
                <a href={urls[m.arquivo_path]} target="_blank" rel="noreferrer noopener">
                  <Paperclip size={14} /> {m.arquivo_nome} ({formatarTamanho(m.arquivo_tamanho)})
                </a>
              ) : null}
            </div>

            {mostrarAutor ? (
              <Link to={`/perfil/${m.autor_id}`} className="comunidade-autor">
                <span className="avatar">{m.autor_nome.charAt(0).toUpperCase()}</span>
                Enviado por {m.autor_nome}
                {m.autor_curso ? ` · ${m.autor_curso}` : ''}
              </Link>
            ) : null}

            {mensagens[m.id] ? <p className="aviso">{mensagens[m.id]}</p> : null}

            {denunciando === m.id ? (
              <div className="denuncia-form">
                <select className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                  {MOTIVOS_DENUNCIA.map((opcao) => (
                    <option key={opcao}>{opcao}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-perigo" onClick={() => denunciar(m.id)}>
                  Enviar denúncia
                </button>
                <button type="button" className="btn-texto" onClick={() => setDenunciando(null)}>
                  Cancelar
                </button>
              </div>
            ) : null}
          </div>

          {m.autor_id !== usuario?.id && denunciando !== m.id && !mensagens[m.id] ? (
            <button
              type="button"
              className="btn-texto denunciar"
              title="Denunciar material"
              onClick={() => setDenunciando(m.id)}
            >
              <Flag size={14} /> Denunciar
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
