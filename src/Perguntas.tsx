import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function Perguntas() {
  const [perguntas, setPerguntas] = useState<any[]>([])
  const [enunciado, setEnunciado] = useState('')
  const [disciplina, setDisciplina] = useState('SI')
  const [nivel, setNivel] = useState('Fácil')

  async function buscarPerguntas() {
    const { data, error } = await supabase.from('perguntas').select('*')
    if (data) setPerguntas(data)
  }

  useEffect(() => {
    buscarPerguntas()
  }, [])

  async function adicionarPergunta(e: React.FormEvent) {
    e.preventDefault()
    if (!enunciado) return alert('Digite o enunciado da pergunta!')

    const { error } = await supabase
      .from('perguntas')
      .insert([{ enunciado: enunciado, disciplina: disciplina, nivel: nivel }])

    if (error) {
      console.error("Erro Supabase:", error)
      alert(`Erro ao salvar: ${error.message}`)
    } else {
      setEnunciado('')
      buscarPerguntas()
    }
  }

  async function deletarPergunta(id: number) {
    const { error } = await supabase.from('perguntas').delete().eq('id', id)
    if (!error) buscarPerguntas()
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '30px' }}>
        <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '15px', marginBottom: '25px' }}>
          <h1 style={{ margin: 0, color: '#111827', fontSize: '24px' }}>EduGuru - Gestão Acadêmica</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>Módulo de Cadastro de Perguntas (Quiz)</p>
        </div>

        <form onSubmit={adicionarPergunta} style={{ display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Enunciado da pergunta..." 
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '16px', outline: 'none' }}
          />
          <select value={disciplina} onChange={(e) => setDisciplina(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '16px', outline: 'none', backgroundColor: '#353535' }}>
            <option value="SI">Sistemas de Informação</option>
            <option value="ADS">Análise e Desenv. de Sistemas</option>
            <option value="ES">Engenharia de Software</option>
          </select>
          <select value={nivel} onChange={(e) => setNivel(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '16px', outline: 'none', backgroundColor: '#353535' }}>
            <option value="Fácil">Fácil</option>
            <option value="Médio">Médio</option>
            <option value="Difícil">Difícil</option>
          </select>
          <button type="submit" style={{ padding: '12px 24px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold' }}>
            + Adicionar
          </button>
        </form>

        <h3 style={{ color: '#374151', marginBottom: '15px' }}>Perguntas Cadastradas:</h3>
        {perguntas.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Nenhuma pergunta cadastrada ainda.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {perguntas.map(pergunta => (
              <li key={pergunta.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '10px', backgroundColor: '#f9fafb' }}>
                <div>
                  <strong style={{ color: '#1f2937', fontSize: '16px' }}>{pergunta.enunciado}</strong>
                  <span style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Disciplina: {pergunta.disciplina} | Nível: {pergunta.nivel}</span>
                </div>
                <button onClick={() => deletarPergunta(pergunta.id)} style={{ color: 'white', backgroundColor: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Perguntas