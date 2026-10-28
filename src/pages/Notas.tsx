import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Disciplina, Nota } from '../types'
import { calcularSituacao, lerNota, MEDIA_APROVACAO, PERCENTUAL_MAXIMO_FALTAS } from '../lib/notas'

// RF29 — Notas e faltas (Dashboard Acadêmico). O aluno registra as próprias
// notas (M1, M2, Exame) e faltas; o sistema calcula ND, situação e quantas
// faltas ainda pode ter. Só o próprio aluno vê as notas (RLS).

async function consultarDados() {
  const [disciplinas, notas] = await Promise.all([
    supabase.from('disciplinas').select('*').order('nome'),
    supabase.from('notas').select('*'),
  ])
  return {
    disciplinas: (disciplinas.data as Disciplina[]) ?? [],
    notas: (notas.data as Nota[]) ?? [],
    erro: disciplinas.error?.message ?? notas.error?.message ?? '',
  }
}

function mostrar(valor: number | null) {
  return valor === null ? '—' : valor.toFixed(1).replace('.', ',')
}

// Classe CSS da situação (verde, amarelo ou vermelho). O texto da situação
// aparece sempre junto, então a informação nunca depende só da cor.
function classeSituacao(situacao: string) {
  if (situacao.startsWith('Aprovado')) return 'situacao-ok'
  if (situacao.startsWith('Reprovado')) return 'situacao-ruim'
  return 'situacao-atencao'
}

export default function Notas() {
  const { usuario, perfil } = useAuth()
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [notas, setNotas] = useState<Nota[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  // Campos do formulário (texto, para aceitar vírgula e campo vazio).
  const [disciplinaId, setDisciplinaId] = useState('')
  const [m1, setM1] = useState('')
  const [m2, setM2] = useState('')
  const [exame, setExame] = useState('')
  const [faltas, setFaltas] = useState('0')

  async function buscar() {
    const dados = await consultarDados()
    setDisciplinas(dados.disciplinas)
    setNotas(dados.notas)
    setErro(dados.erro)
  }

  useEffect(() => {
    consultarDados().then((dados) => {
      setDisciplinas(dados.disciplinas)
      setNotas(dados.notas)
      setErro(dados.erro)
      setCarregando(false)
    })
  }, [])

  // Disciplinas do curso do aluno aparecem primeiro na lista.
  const disciplinasOrdenadas = [...disciplinas].sort(
    (a, b) => Number(b.curso === perfil?.curso) - Number(a.curso === perfil?.curso),
  )

  function editar(nota: Nota) {
    setDisciplinaId(String(nota.disciplina_id))
    setM1(nota.m1 === null ? '' : String(nota.m1))
    setM2(nota.m2 === null ? '' : String(nota.m2))
    setExame(nota.exame === null ? '' : String(nota.exame))
    setFaltas(String(nota.faltas))
    setMensagem('')
    setErro('')
  }

  function limparFormulario() {
    setDisciplinaId('')
    setM1('')
    setM2('')
    setExame('')
    setFaltas('0')
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setMensagem('')

    const disciplina = disciplinas.find((d) => String(d.id) === disciplinaId)
    if (!disciplina) {
      setErro('Escolha a disciplina.')
      return
    }

    const notaM1 = lerNota(m1)
    const notaM2 = lerNota(m2)
    const notaExame = lerNota(exame)
    const erroNota = notaM1.erro ?? notaM2.erro ?? notaExame.erro
    if (erroNota) {
      setErro(erroNota)
      return
    }

    const qtdFaltas = Number(faltas)
    if (!Number.isInteger(qtdFaltas) || qtdFaltas < 0) {
      setErro('Faltas precisa ser um número inteiro, zero ou maior.')
      return
    }
    if (qtdFaltas > disciplina.total_aulas) {
      setErro(`Faltas não pode passar do total de aulas da disciplina (${disciplina.total_aulas}).`)
      return
    }

    // Uma linha por aluno e disciplina: se já existe, atualiza (upsert).
    const { error } = await supabase.from('notas').upsert(
      {
        aluno_id: usuario!.id,
        disciplina_id: disciplina.id,
        m1: notaM1.valor,
        m2: notaM2.valor,
        exame: notaExame.valor,
        faltas: qtdFaltas,
      },
      { onConflict: 'aluno_id,disciplina_id' },
    )

    if (error) {
      setErro(error.message)
      return
    }
    setMensagem(`Notas de ${disciplina.nome} salvas.`)
    limparFormulario()
    buscar()
  }

  async function excluir(nota: Nota) {
    if (!window.confirm('Apagar as notas e faltas desta disciplina?')) return
    const { error } = await supabase.from('notas').delete().eq('id', nota.id)
    if (error) setErro(error.message)
    else buscar()
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Notas e faltas</h2>
        <p>
          Registre suas notas e faltas para acompanhar a situação em cada disciplina. ND = (M1 + M2)
          ÷ 2; com ND a partir de {MEDIA_APROVACAO} você está aprovado. O limite de faltas é{' '}
          {PERCENTUAL_MAXIMO_FALTAS * 100}% das aulas. Só você vê estes dados.
        </p>
      </header>

      <div className="cartao">
        <form onSubmit={salvar} className="form-linha form-notas">
          <select className="campo" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
            <option value="">Disciplina...</option>
            {disciplinasOrdenadas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome} ({d.curso})
              </option>
            ))}
          </select>
          <input className="campo campo-curto" value={m1} onChange={(e) => setM1(e.target.value)} placeholder="M1" inputMode="decimal" />
          <input className="campo campo-curto" value={m2} onChange={(e) => setM2(e.target.value)} placeholder="M2" inputMode="decimal" />
          <input className="campo campo-curto" value={exame} onChange={(e) => setExame(e.target.value)} placeholder="Exame" inputMode="decimal" />
          <input
            className="campo campo-curto"
            value={faltas}
            onChange={(e) => setFaltas(e.target.value)}
            placeholder="Faltas"
            inputMode="numeric"
            title="Faltas"
          />
          <button type="submit" className="btn btn-primario">
            Salvar
          </button>
        </form>
        <p className="item-meta">Deixe em branco a nota que ainda não saiu. Use vírgula ou ponto (ex.: 7,5).</p>

        {erro ? <p className="aviso erro">{erro}</p> : null}
        {mensagem ? <p className="aviso sucesso">{mensagem}</p> : null}
        {carregando ? <p className="status">Carregando...</p> : null}

        {!carregando && notas.length === 0 ? (
          <p className="vazio">Nenhuma nota registrada ainda.</p>
        ) : null}

        {notas.length > 0 ? (
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Disciplina</th>
                  <th className="numero">M1</th>
                  <th className="numero">M2</th>
                  <th className="numero">ND</th>
                  <th className="numero">Exame</th>
                  <th className="numero">Faltas</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {notas.map((nota) => {
                  const disciplina = disciplinas.find((d) => d.id === nota.disciplina_id)
                  const r = calcularSituacao(nota.m1, nota.m2, nota.exame, nota.faltas, disciplina?.total_aulas ?? 80)
                  return (
                    <tr key={nota.id}>
                      <td>{disciplina?.nome ?? '—'}</td>
                      <td className="numero">{mostrar(nota.m1)}</td>
                      <td className="numero">{mostrar(nota.m2)}</td>
                      <td className="numero">{mostrar(r.nd)}</td>
                      <td className="numero">{mostrar(nota.exame)}</td>
                      <td className={`numero${r.alertaFaltas ? ' situacao-atencao' : ''}`}>
                        {nota.faltas}/{r.limiteFaltas}
                      </td>
                      <td>
                        <span className={`selo-situacao ${classeSituacao(r.situacao)}`}>{r.situacao}</span>
                      </td>
                      <td className="acoes">
                        <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => editar(nota)}>
                          Editar
                        </button>
                        <button type="button" className="btn btn-perigo" onClick={() => excluir(nota)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}
