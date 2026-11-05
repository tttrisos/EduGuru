import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../compartilhado/supabase'
import { CURSOS, type MaterialComunidade, type PerfilPublico } from '../../compartilhado/tipos'
import { buscarMateriaisComunidade } from './comunidade'
import ListaComunidade from './ListaComunidade'
import './materiais.css'

// Perfil público de quem compartilha materiais: só nome abreviado, curso e os materiais aprovados.
export default function PerfilAutor() {
  const { id = '' } = useParams()
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null)
  const [materiais, setMateriais] = useState<MaterialComunidade[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    Promise.all([supabase.rpc('perfil_publico', { p_usuario_id: id }), buscarMateriaisComunidade({ autorId: id })])
      .then(([resposta, resultado]) => {
        setPerfil(((resposta.data as PerfilPublico[]) ?? [])[0] ?? null)
        setMateriais(resultado.lista)
        setUrls(resultado.urls)
      })
      .finally(() => setCarregando(false))
  }, [id])

  if (carregando) return <p className="status">Carregando...</p>

  if (!perfil) {
    return (
      <section className="pagina">
        <p className="vazio">Perfil não encontrado ou sem materiais compartilhados.</p>
        <Link to="/quiz" className="btn btn-secundario">
          Voltar ao quiz
        </Link>
      </section>
    )
  }

  const curso = CURSOS.find((c) => c.valor === perfil.curso)?.label

  return (
    <section className="pagina">
      <div className="cartao perfil-autor">
        <span className="avatar avatar-grande">{perfil.nome.charAt(0).toUpperCase()}</span>
        <div>
          <h2>
            {perfil.nome}
            {perfil.equipe ? <span className="selo selo-admin">Equipe EduGuru</span> : null}
          </h2>
          <p>{curso ?? 'Curso não informado'}</p>
          <p className="item-meta">
            {perfil.materiais} {perfil.materiais === 1 ? 'material compartilhado' : 'materiais compartilhados'}
          </p>
        </div>
      </div>

      <div className="cartao">
        <h3>Materiais compartilhados</h3>
        {materiais.length === 0 ? (
          <p className="vazio">Nenhum material aprovado ainda.</p>
        ) : (
          <ListaComunidade materiais={materiais} urls={urls} mostrarAutor={false} />
        )}
      </div>
    </section>
  )
}
