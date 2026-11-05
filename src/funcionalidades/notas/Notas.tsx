import { useEffect, useState } from 'react'
import { useDialogo } from '../../compartilhado/Dialogo'
import { supabase } from '../../compartilhado/supabase'
import { useAuth } from '../../compartilhado/AuthContext'
import { cursosDa, type Disciplina, type Nota } from '../../compartilhado/tipos'
import {
  calcularFrequencia,
  calcularNotas,
  FALTAS_POR_DIA,
  FALTAS_POR_MODULO,
  lerNota,
  LIMITE_FALTAS,
  MEDIA_APROVACAO,
  validarFaltas,
} from './calculoNotas'
import './notas.css'

// Notas e faltas (RF20), com os campos do boletim da UMC. São dois cadastros e dois
// cálculos separados: notas (M2, MD, MF) e frequência (limite de faltas). Regras em calculoNotas.ts.

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

function classeSituacao(situacao: string) {
  if (situacao.startsWith('Aprovado') || situacao === 'Frequência OK') return 'situacao-ok'
  if (situacao.startsWith('Reprovado')) return 'situacao-ruim'
  return 'situacao-atencao'
}

export default function Notas() {
  const { confirmar } = useDialogo()
  const { usuario, perfil } = useAuth()
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [notas, setNotas] = useState<Nota[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  // Formulário de notas
  const [disciplinaNotas, setDisciplinaNotas] = useState('')
  const [m1, setM1] = useState('')
  const [nd, setNd] = useState('')
  const [ni, setNi] = useState('')
  const [m2, setM2] = useState('')
  const [ms, setMs] = useState('')
  const [exame, setExame] = useState('')

  const [aba, setAba] = useState<'notas' | 'faltas'>('notas')

  // Formulário de faltas
  const [disciplinaFaltas, setDisciplinaFaltas] = useState('')
  const [faltas, setFaltas] = useState('')

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

  // Disciplinas do curso do aluno primeiro.
  const disciplinasOrdenadas = [...disciplinas].sort(
    (a, b) => Number(b.curso === perfil?.curso) - Number(a.curso === perfil?.curso),
  )
  const disciplinaDasFaltas = disciplinas.find((d) => String(d.id) === disciplinaFaltas)

  function nomeDisciplina(nota: Nota) {
    return disciplinas.find((d) => d.id === nota.disciplina_id)?.nome ?? '—'
  }

  function editarNotas(nota: Nota) {
    setDisciplinaNotas(String(nota.disciplina_id))
    setM1(paraTexto(nota.m1))
    setNd(paraTexto(nota.nd))
    setNi(paraTexto(nota.ni))
    setM2(paraTexto(nota.m2))
    setMs(paraTexto(nota.ms))
    setExame(paraTexto(nota.exame))
    setMensagem('')
    setErro('')
  }

  function editarFaltas(nota: Nota) {
    setDisciplinaFaltas(String(nota.disciplina_id))
    setFaltas(String(nota.faltas))
    setMensagem('')
    setErro('')
  }

  // Ao escolher a disciplina, traz as faltas já salvas.
  function escolherDisciplinaFaltas(id: string) {
    setDisciplinaFaltas(id)
    const salva = notas.find((n) => String(n.disciplina_id) === id)
    setFaltas(salva ? String(salva.faltas) : '')
  }

  function somarFaltas(quantidade: number) {
    setFaltas(String((Number(faltas) || 0) + quantidade))
  }

  // Grava só os campos enviados; o que já estava salvo no outro cadastro continua igual.
  async function gravar(disciplinaId: number, campos: Partial<Nota>) {
    return supabase
      .from('notas')
      .upsert({ aluno_id: usuario!.id, disciplina_id: disciplinaId, ...campos }, { onConflict: 'aluno_id,disciplina_id' })
  }

  async function salvarNotas(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setMensagem('')

    const disciplina = disciplinas.find((d) => String(d.id) === disciplinaNotas)
    if (!disciplina) {
      setErro('Escolha a disciplina das notas.')
      return
    }

    const lidas = {
      m1: lerNota(m1),
      nd: lerNota(nd),
      ni: lerNota(ni),
      m2: lerNota(m2),
      ms: lerNota(ms),
      exame: lerNota(exame),
    }
    const erroNota =
      lidas.m1.erro ?? lidas.nd.erro ?? lidas.ni.erro ?? lidas.m2.erro ?? lidas.ms.erro ?? lidas.exame.erro
    if (erroNota) {
      setErro(erroNota)
      return
    }

    const { error } = await gravar(disciplina.id, {
      m1: lidas.m1.valor,
      nd: lidas.nd.valor,
      ni: lidas.ni.valor,
      m2: lidas.m2.valor,
      ms: lidas.ms.valor,
      exame: lidas.exame.valor,
    })
    if (error) {
      setErro(error.message)
      return
    }
    setMensagem(`Notas de ${disciplina.nome} salvas.`)
    setDisciplinaNotas('')
    setM1('')
    setNd('')
    setNi('')
    setM2('')
    setMs('')
    setExame('')
    buscar()
  }

  async function salvarFaltas(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setMensagem('')

    if (!disciplinaDasFaltas) {
      setErro('Escolha a disciplina das faltas.')
      return
    }
    const qtdFaltas = faltas.trim() === '' ? NaN : Number(faltas)
    const problema = validarFaltas(qtdFaltas)
    if (problema) {
      setErro(problema)
      return
    }

    const { error } = await gravar(disciplinaDasFaltas.id, { faltas: qtdFaltas })
    if (error) {
      setErro(error.message)
      return
    }
    setMensagem(`Faltas de ${disciplinaDasFaltas.nome} salvas.`)
    setDisciplinaFaltas('')
    setFaltas('')
    buscar()
  }

  async function excluir(nota: Nota) {
    const ok = await confirmar({
      titulo: `Apagar as notas e as faltas de ${nomeDisciplina(nota)}?`,
      mensagem: 'Isso não pode ser desfeito.',
      textoConfirmar: 'Apagar',
      perigo: true,
    })
    if (!ok) return
    const { error } = await supabase.from('notas').delete().eq('id', nota.id)
    if (error) setErro(error.message)
    else buscar()
  }

  // Prévia do cálculo enquanto o aluno digita (antes de salvar).
  const digitadas = [m1, nd, ni, m2, ms, exame].map(lerNota)
  const previa =
    digitadas.every((d) => !d.erro) && digitadas.some((d) => d.valor !== null)
      ? calcularNotas({
          m1: digitadas[0].valor,
          nd: digitadas[1].valor,
          ni: digitadas[2].valor,
          m2: digitadas[3].valor,
          ms: digitadas[4].valor,
          exame: digitadas[5].valor,
        })
      : null

  const opcoesDisciplinas = disciplinasOrdenadas.map((d) => (
    <option key={d.id} value={d.id}>
      {d.nome} ({cursosDa(d).join('/')})
    </option>
  ))

  return (
    <section className="pagina pagina-larga">
      <header className="pagina-topo">
        <h2>Notas e faltas</h2>
        <p>
          Registre só as disciplinas presenciais do semestre, como aparecem no boletim do portal. Notas e
          faltas têm cálculos separados: com MD a partir de {MEDIA_APROVACAO} você está aprovado nas notas, e
          o limite é de {LIMITE_FALTAS} faltas por disciplina. Só você vê estes dados.
        </p>
      </header>

      {erro ? <p className="aviso erro">{erro}</p> : null}
      {mensagem ? <p className="aviso sucesso">{mensagem}</p> : null}
      {carregando ? <p className="status">Carregando...</p> : null}

      <div className="abas" role="tablist" aria-label="Cadastro">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'notas'}
          className={`aba${aba === 'notas' ? ' ativa' : ''}`}
          onClick={() => setAba('notas')}
        >
          Notas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'faltas'}
          className={`aba${aba === 'faltas' ? ' ativa' : ''}`}
          onClick={() => setAba('faltas')}
        >
          Faltas
        </button>
      </div>

      {aba === 'notas' ? (
        <div className="cartao" role="tabpanel">
          <form onSubmit={salvarNotas} className="form-linha form-notas">
            <select className="campo" value={disciplinaNotas} onChange={(e) => setDisciplinaNotas(e.target.value)}>
              <option value="">Disciplina...</option>
              {opcoesDisciplinas}
            </select>
            <input className="campo campo-curto" value={m1} onChange={(e) => setM1(e.target.value)} placeholder="M1" title="M1 — avaliações do 1º bimestre" inputMode="decimal" />
            <input className="campo campo-curto" value={nd} onChange={(e) => setNd(e.target.value)} placeholder="ND" title="ND — avaliações do 2º bimestre" inputMode="decimal" />
            <input className="campo campo-curto" value={ni} onChange={(e) => setNi(e.target.value)} placeholder="NI" title="NI — avaliação integrada" inputMode="decimal" />
            <input className="campo campo-curto" value={m2} onChange={(e) => setM2(e.target.value)} placeholder="M2" title="M2 — média do 2º bimestre (se ND e NI estiverem preenchidas, ela é calculada)" inputMode="decimal" />
            <input className="campo campo-curto" value={ms} onChange={(e) => setMs(e.target.value)} placeholder="MS" title="MS — média semestral (só em disciplina de nota única)" inputMode="decimal" />
            <input className="campo campo-curto" value={exame} onChange={(e) => setExame(e.target.value)} placeholder="Exame" title="EX — exame" inputMode="decimal" />
            <button type="submit" className="btn btn-primario">
              Salvar notas
            </button>
          </form>
          <p className="item-meta">
            M2 = ND × 70% + NI × 30% (ou digite a M2 para simular) · MD = (M1 + M2 × 2) ÷ 3 · MS = nota única
            (preencha só se a disciplina tiver) · Deixe em branco a nota que ainda não saiu; use vírgula ou ponto
            (ex.: 7,5).
          </p>
          <p className="aviso aviso-estimativa">
            Os valores calculados aqui são uma <strong>estimativa</strong>. O professor pode acrescentar
            atividades complementares, trabalhos com peso próprio ou outros critérios. A nota oficial é sempre a
            do portal da UMC.
          </p>
          {previa ? (
            <p className="previa-notas" aria-live="polite">
              Estimativa: M2 <strong>{mostrar(previa.m2)}</strong> · MD <strong>{mostrar(previa.md)}</strong> · MF{' '}
              <strong>{mostrar(previa.mediaFinal)}</strong> ·{' '}
              <span className={`selo-situacao ${classeSituacao(previa.situacao)}`}>{previa.situacao}</span>
            </p>
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
                    <th>Situação das notas</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {notas.map((nota) => {
                    const r = calcularNotas(nota)
                    return (
                      <tr key={nota.id}>
                        <td>{nomeDisciplina(nota)}</td>
                        <td className="numero">{mostrar(nota.m1)}</td>
                        <td className="numero">{mostrar(nota.nd)}</td>
                        <td className="numero">{mostrar(nota.ni)}</td>
                        <td className="numero">{mostrar(r.m2)}</td>
                        <td className="numero">{mostrar(nota.ms === null ? r.md : null)}</td>
                        <td className="numero">{mostrar(nota.ms)}</td>
                        <td className="numero">{mostrar(nota.exame)}</td>
                        <td className="numero">{mostrar(r.mediaFinal)}</td>
                        <td>
                          <span className={`selo-situacao ${classeSituacao(r.situacao)}`}>{r.situacao}</span>
                        </td>
                        <td className="acoes">
                          <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => editarNotas(nota)}>
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
          ) : !carregando ? (
            <p className="vazio">Nenhuma nota registrada ainda.</p>
          ) : null}
        </div>
      ) : (
        <div className="cartao" role="tabpanel">
          <form onSubmit={salvarFaltas} className="form-linha form-notas">
            <select className="campo" value={disciplinaFaltas} onChange={(e) => escolherDisciplinaFaltas(e.target.value)}>
              <option value="">Disciplina...</option>
              {opcoesDisciplinas}
            </select>
            <input
              className="campo campo-curto"
              value={faltas}
              onChange={(e) => setFaltas(e.target.value)}
              placeholder="Faltas"
              inputMode="numeric"
              title="FT — faltas no semestre"
            />
            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => somarFaltas(FALTAS_POR_MODULO)}
              title="Faltei um módulo"
            >
              +{FALTAS_POR_MODULO} (1 módulo)
            </button>
            <button type="button" className="btn btn-secundario" onClick={() => somarFaltas(FALTAS_POR_DIA)} title="Faltei o dia todo">
              +{FALTAS_POR_DIA} (dia todo)
            </button>
            <button type="submit" className="btn btn-primario">
              Salvar faltas
            </button>
          </form>
          <p className="item-meta">
            FT = faltas no semestre, como no boletim. Limite: {LIMITE_FALTAS} faltas por disciplina. Cada dia de aula
            vale {FALTAS_POR_DIA} faltas: {FALTAS_POR_MODULO} no primeiro módulo e {FALTAS_POR_MODULO} no segundo.
          </p>

          {notas.length > 0 ? (
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Disciplina</th>
                    <th className="numero">FT</th>
                    <th className="numero">Limite</th>
                    <th className="numero">Ainda pode faltar</th>
                    <th>Situação da frequência</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {notas.map((nota) => {
                    const f = calcularFrequencia(nota.faltas)
                    return (
                      <tr key={nota.id}>
                        <td>{nomeDisciplina(nota)}</td>
                        <td className="numero">{nota.faltas}</td>
                        <td className="numero">{f.limiteFaltas}</td>
                        <td className="numero">
                          {f.faltasRestantes} ({f.diasRestantes} {f.diasRestantes === 1 ? 'dia' : 'dias'})
                        </td>
                        <td>
                          <span className={`selo-situacao ${classeSituacao(f.situacao)}`}>{f.situacao}</span>
                        </td>
                        <td className="acoes">
                          <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => editarFaltas(nota)}>
                            Editar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : !carregando ? (
            <p className="vazio">Nenhuma falta registrada ainda.</p>
          ) : null}
        </div>
      )}
    </section>
  )
}
