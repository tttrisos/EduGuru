import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Disciplina, Nota } from '../types'
import { calcularSituacao, lerNota, MEDIA_APROVACAO, PERCENTUAL_MAXIMO_FALTAS } from '../lib/notas'

// RF29 — Notas e faltas (Dashboard Acadêmico). O aluno registra as próprias
// notas com os mesmos campos do boletim da UMC (M1, ND, NI, MS, Exame) e as
// faltas; o sistema calcula M2, MD, MF, a situação e quantas faltas ainda
// pode ter. Só o próprio aluno vê as notas (RLS).

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

function paraTexto(valor: number | null) {
  return valor === null ? '' : String(valor).replace('.', ',')
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
  const [nd, setNd] = useState('')
  const [ni, setNi] = useState('')
  const [ms, setMs] = useState('')
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
    setM1(paraTexto(nota.m1))
    setNd(paraTexto(nota.nd))
    setNi(paraTexto(nota.ni))
    setMs(paraTexto(nota.ms))
    setExame(paraTexto(nota.exame))
    setFaltas(String(nota.faltas))
    setMensagem('')
    setErro('')
  }

  function limparFormulario() {
    setDisciplinaId('')
    setM1('')
    setNd('')
    setNi('')
    setMs('')
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

    const lidas = { m1: lerNota(m1), nd: lerNota(nd), ni: lerNota(ni), ms: lerNota(ms), exame: lerNota(exame) }
    const erroNota = lidas.m1.erro ?? lidas.nd.erro ?? lidas.ni.erro ?? lidas.ms.erro ?? lidas.exame.erro
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
        m1: lidas.m1.valor,
        nd: lidas.nd.valor,
        ni: lidas.ni.valor,
        ms: lidas.ms.valor,
        exame: lidas.exame.valor,
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
    <section className="pagina pagina-larga">
      <header className="pagina-topo">
        <h2>Notas e faltas</h2>
        <p>
          Registre suas notas como aparecem no boletim do portal e acompanhe a situação em cada
          disciplina. Com MD a partir de {MEDIA_APROVACAO} você está aprovado; o limite de faltas é{' '}
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
          <input className="campo campo-curto" value={m1} onChange={(e) => setM1(e.target.value)} placeholder="M1" title="M1 — avaliações do 1º bimestre" inputMode="decimal" />
          <input className="campo campo-curto" value={nd} onChange={(e) => setNd(e.target.value)} placeholder="ND" title="ND — avaliações do 2º bimestre" inputMode="decimal" />
          <input className="campo campo-curto" value={ni} onChange={(e) => setNi(e.target.value)} placeholder="NI" title="NI — avaliação integrada" inputMode="decimal" />
          <input className="campo campo-curto" value={ms} onChange={(e) => setMs(e.target.value)} placeholder="MS" title="MS — média semestral (só em disciplina de nota única)" inputMode="decimal" />
          <input className="campo campo-curto" value={exame} onChange={(e) => setExame(e.target.value)} placeholder="Exame" title="EX — exame" inputMode="decimal" />
          <input
            className="campo campo-curto"
            value={faltas}
            onChange={(e) => setFaltas(e.target.value)}
            placeholder="Faltas"
            inputMode="numeric"
            title="FT — faltas no semestre"
          />
          <button type="submit" className="btn btn-primario">
            Salvar
          </button>
        </form>
        <p className="item-meta">
          M1 = 1º bimestre · ND = avaliações do 2º bimestre · NI = avaliação integrada · M2 = ND × 70% + NI
          × 30% · MD = (M1 + M2 × 2) ÷ 3 · MS = nota única (preencha só se a disciplina tiver) · Deixe em
          branco a nota que ainda não saiu; use vírgula ou ponto (ex.: 7,5).
        </p>

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
                  <th className="numero">ND</th>
                  <th className="numero">NI</th>
                  <th className="numero">M2</th>
                  <th className="numero">MD</th>
                  <th className="numero">MS</th>
                  <th className="numero">EX</th>
                  <th className="numero">MF</th>
                  <th className="numero">FT</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {notas.map((nota) => {
                  const disciplina = disciplinas.find((d) => d.id === nota.disciplina_id)
                  const r = calcularSituacao(nota, nota.faltas, disciplina?.total_aulas ?? 80)
                  return (
                    <tr key={nota.id}>
                      <td>{disciplina?.nome ?? '—'}</td>
                      <td className="numero">{mostrar(nota.m1)}</td>
                      <td className="numero">{mostrar(nota.nd)}</td>
                      <td className="numero">{mostrar(nota.ni)}</td>
                      <td className="numero">{mostrar(r.m2)}</td>
                      <td className="numero">{mostrar(nota.ms === null ? r.md : null)}</td>
                      <td className="numero">{mostrar(nota.ms)}</td>
                      <td className="numero">{mostrar(nota.exame)}</td>
                      <td className="numero">{mostrar(r.mediaFinal)}</td>
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
