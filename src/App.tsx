import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [disciplinas, setDisciplinas] = useState<any[]>([])
  const [nome, setNome] = useState('')
  // Ajuste 1: O valor inicial agora é 'SI' para bater com o seu select
  const [curso, setCurso] = useState('SI')

  async function buscarDisciplinas() {
    const { data, error } = await supabase.from('disciplinas').select('*')
    if (data) setDisciplinas(data)
  }

  useEffect(() => {
    buscarDisciplinas()
  }, [])

  async function adicionarDisciplina(e: React.FormEvent) {
    e.preventDefault()
    if (!nome) return alert('Digite o nome da disciplina!')

    const { error } = await supabase
      .from('disciplinas')
      .insert([{ nome: nome, curso: curso }])

    if (error) {
      // Ajuste 2: Se der erro, ele vai mostrar no console para podermos investigar
      console.error("Detalhes do erro do Supabase:", error)
      alert(`Erro ao salvar: ${error.message}`)
    } else {
      setNome('')
      buscarDisciplinas()
    }
  }

  async function deletarDisciplina(id: number) {
    const { error } = await supabase.from('disciplinas').delete().eq('id', id)
    if (!error) buscarDisciplinas()
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>EduGuru - Gestão Acadêmica</h1>
      <h2>Cadastro de Disciplinas</h2>

      <form onSubmit={adicionarDisciplina} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Nome da matéria..." 
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ flex: 1, padding: '8px' }}
        />
        <select value={curso} onChange={(e) => setCurso(e.target.value)} style={{ padding: '8px' }}>
          <option value="SI">Sistemas de Informação</option>
          <option value="ADS">Análise e Desenvolvimento de Sistemas</option>
          <option value="ES">Engenharia de Software</option>
        </select>
        <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
          Salvar
        </button>
      </form>

      <h3>Minhas Disciplinas:</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {disciplinas.map(disc => (
          <li key={disc.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>{disc.nome}</strong> - {disc.curso}</span>
            <button onClick={() => deletarDisciplina(disc.id)} style={{ color: 'white', backgroundColor: '#f44336', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App