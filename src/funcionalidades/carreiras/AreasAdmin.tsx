import { useState } from 'react'
import Ajuda from '../../compartilhado/Ajuda'
import { useDialogo } from '../../compartilhado/Dialogo'
import { supabase } from '../../compartilhado/supabase'
import type { AreaCarreira, Disciplina, DisciplinaArea } from '../../compartilhado/tipos'
import { validarArea, separarPalavras } from './areas'

type Props = {
  areas: AreaCarreira[]
  disciplinas: Disciplina[]
  ligacoes: DisciplinaArea[]
  aoMudar: () => void
}

// Admin: cadastro das áreas de carreira e das disciplinas que levam a cada uma.
export default function AreasAdmin({ areas, disciplinas, ligacoes, aoMudar }: Props) {
  const { confirmar } = useDialogo()
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [palavras, setPalavras] = useState('')
  const [marcadas, setMarcadas] = useState<number[]>([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  function limpar() {
    setEditandoId(null)
    setNome('')
    setDescricao('')
    setPalavras('')
    setMarcadas([])
    setErro('')
  }

  function editar(area: AreaCarreira) {
    setEditandoId(area.id)
    setNome(area.nome)
    setDescricao(area.descricao ?? '')
    setPalavras(area.palavras_chave.join(', '))
    setMarcadas(ligacoes.filter((l) => l.area_id === area.id).map((l) => l.disciplina_id))
    setErro('')
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const problema = validarArea({ nome, descricao, palavras }, areas, editandoId)
    if (problema) {
      setErro(problema)
      return
    }
    setSalvando(true)
    const dados = { nome: nome.trim(), descricao: descricao.trim() || null, palavras_chave: separarPalavras(palavras) }
    const { data, error } = editandoId
      ? await supabase.from('areas_carreira').update(dados).eq('id', editandoId).select('id').single()
      : await supabase.from('areas_carreira').insert([dados]).select('id').single()

    if (error || !data) {
      setSalvando(false)
      setErro(error?.message ?? 'Não foi possível salvar a área.')
      return
    }

    // Disciplinas: apaga as ligações antigas da área e grava as marcadas.
    const areaId = (data as { id: number }).id
    const apagar = await supabase.from('disciplinas_areas').delete().eq('area_id', areaId)
    const gravar =
      marcadas.length > 0
        ? await supabase.from('disciplinas_areas').insert(marcadas.map((d) => ({ disciplina_id: d, area_id: areaId })))
        : { error: null }
    setSalvando(false)
    if (apagar.error || gravar.error) {
      setErro(apagar.error?.message ?? gravar.error?.message ?? 'Não foi possível ligar as disciplinas.')
      aoMudar()
      return
    }
    limpar()
    aoMudar()
  }

  async function excluir(area: AreaCarreira) {
    const ok = await confirmar({
      titulo: `Excluir a área "${area.nome}"?`,
      mensagem: 'As ligações com as disciplinas também saem. Os cliques já contados ficam como "Sem área".',
      textoConfirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    const { error } = await supabase.from('areas_carreira').delete().eq('id', area.id)
    if (error) setErro(error.message)
    else {
      if (editandoId === area.id) limpar()
      aoMudar()
    }
  }

  function marcar(id: number) {
    setMarcadas((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]))
  }

  const nomeDisciplina = (id: number) => disciplinas.find((d) => d.id === id)?.nome ?? `#${id}`

  return (
    <div className="cartao areas-admin">
      <h3>Áreas de carreira</h3>
      <Ajuda
        itens={[
          'O aluno vê as vagas das áreas ligadas às disciplinas em que acerta 60% ou mais no quiz (com pelo menos 5 respostas).',
          'Palavras-chave: termos procurados no título e nas etiquetas da vaga, separados por vírgula (ex.: react, front-end, css).',
          'Uma disciplina pode levar a mais de uma área.',
        ]}
      />

      <form onSubmit={salvar} className="form-area">
        <label className="rotulo">
          Nome da área
          <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} />
        </label>
        <label className="rotulo">
          Descrição (opcional)
          <input className="campo" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={300} />
        </label>
        <label className="rotulo form-area-inteiro">
          Palavras-chave
          <input
            className="campo"
            value={palavras}
            onChange={(e) => setPalavras(e.target.value)}
            placeholder="react, front-end, css"
          />
        </label>
        <fieldset className="form-area-inteiro areas-disciplinas">
          <legend>Disciplinas que levam a esta área ({marcadas.length})</legend>
          {disciplinas.map((d) => (
            <label key={d.id}>
              <input type="checkbox" checked={marcadas.includes(d.id)} onChange={() => marcar(d.id)} /> {d.nome}
            </label>
          ))}
        </fieldset>
        <div className="form-area-inteiro acoes-item">
          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {editandoId ? 'Salvar alterações' : 'Adicionar área'}
          </button>
          {editandoId ? (
            <button type="button" className="btn btn-secundario" onClick={limpar}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      {erro ? <p className="aviso erro">{erro}</p> : null}

      {areas.length === 0 ? (
        <p className="vazio">Nenhuma área cadastrada. Rode o script 17 ou adicione uma acima.</p>
      ) : (
        <ul className="lista">
          {areas.map((area) => {
            const daArea = ligacoes.filter((l) => l.area_id === area.id).map((l) => nomeDisciplina(l.disciplina_id))
            return (
              <li key={area.id} className="item-lista">
                <div>
                  <strong>{area.nome}</strong>
                  {area.descricao ? <span className="item-meta">{area.descricao}</span> : null}
                  <span className="item-meta">Palavras-chave: {area.palavras_chave.join(', ')}</span>
                  <span className="item-meta">
                    Disciplinas: {daArea.length > 0 ? daArea.join(' · ') : 'nenhuma (não aparece como sugestão)'}
                  </span>
                </div>
                <div className="acoes-item">
                  <button type="button" className="btn btn-secundario" onClick={() => editar(area)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn-perigo" onClick={() => excluir(area)}>
                    Excluir
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
