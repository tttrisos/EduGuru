import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function Materiais() {
  const [materiais, setMateriais] = useState<any[]>([])
  const [titulo, setTitulo] = useState('')
  const [link, setLink] = useState('')

  async function buscarMateriais() {
    const { data, error } = await supabase.from('materiais').select('*')
    if (data) setMateriais(data)
  }

  useEffect(() => {
    buscarMateriais()
  }, [])

  async function adicionarMaterial(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo || !link) return alert('Digite o título e o link do material!')

    const { error } = await supabase
      .from('materiais')
      .insert([{ titulo: titulo, link: link }])

    if (error) {
      console.error("Erro Supabase:", error)
      alert(`Erro ao salvar: ${error.message}`)
    } else {
      setTitulo('')
      setLink('')
      buscarMateriais()
    }
  }

  async function deletarMaterial(id: number) {
    const { error } = await supabase.from('materiais').delete().eq('id', id)
    if (!error) buscarMateriais()
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '30px' }}>
        <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '15px', marginBottom: '25px' }}>
          <h1 style={{ margin: 0, color: '#111827', fontSize: '24px' }}>EduGuru - Gestão Acadêmica</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>Módulo de Cadastro de Materiais</p>
        </div>

        <form onSubmit={adicionarMaterial} style={{ display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Título do material (Ex: Apostila de React)..." 
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '16px', outline: 'none' }}
          />
          <input 
            type="text" 
            placeholder="Link (URL)..." 
            value={link}
            onChange={(e) => setLink(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '16px', outline: 'none' }}
          />
          <button type="submit" style={{ padding: '12px 24px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold' }}>
            + Adicionar
          </button>
        </form>

        <h3 style={{ color: '#374151', marginBottom: '15px' }}>Materiais Cadastrados:</h3>
        {materiais.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Nenhum material cadastrado ainda.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {materiais.map(material => (
              <li key={material.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '10px', backgroundColor: '#f9fafb' }}>
                <div>
                  <strong style={{ color: '#1f2937', fontSize: '16px' }}>{material.titulo}</strong>
                  <span style={{ display: 'block', color: '#3b82f6', fontSize: '14px', marginTop: '4px' }}>
                    <a href={material.link} target="_blank" rel="noreferrer">{material.link}</a>
                  </span>
                </div>
                <button onClick={() => deletarMaterial(material.id)} style={{ color: 'white', backgroundColor: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
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

export default Materiais