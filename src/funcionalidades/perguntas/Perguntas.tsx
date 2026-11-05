import { useEffect, useState } from 'react'
import { useDialogo } from '../../compartilhado/Dialogo'
import { supabase } from '../../compartilhado/supabase'
import TextoRico from '../../compartilhado/TextoRico'
import { LETRAS, NIVEIS, cursosDa, type Disciplina, type Letra, type Nivel, type Pergunta } from '../../compartilhado/tipos'
import './perguntas.css'

// Banco de perguntas do quiz (só admin): cadastrar, editar e excluir. O gabarito e a explicação ficam na tabela "gabaritos".

type Gabarito = { pergunta_id: number; correta: Letra; explicacao: string | null }

const LIMITE_IMAGEM_MB = 2
const TIPOS_IMAGEM = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

async function consultarDados() {
  const [perguntas, gabaritos, disciplinas] = await Promise.all([
    supabase.from('perguntas').select('*').order('id', { ascending: false }),
    supabase.from('gabaritos').select('*'),
    supabase.from('disciplinas').select('*').order('nome'),
  ])
  const mapaGabaritos: Record<number, Gabarito> = {}
  for (const g of (gabaritos.data as Gabarito[]) ?? []) mapaGabaritos[g.pergunta_id] = g

  return {
    perguntas: (perguntas.data as Pergunta[]) ?? [],
    gabaritos: mapaGabaritos,
    disciplinas: (disciplinas.data as Disciplina[]) ?? [],
    erro: perguntas.error?.message ?? disciplinas.error?.message ?? '',
  }
}

const ALTERNATIVAS_VAZIAS: Record<Letra, string> = { A: '', B: '', C: '', D: '' }

export default function Perguntas() {
  const { confirmar } = useDialogo()
  const [lista, setLista] = useState<Pergunta[]>([])
  const [gabaritos, setGabaritos] = useState<Record<number, Gabarito>>({})
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(true)

  const [enunciado, setEnunciado] = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [nivel, setNivel] = useState<Nivel>('Fácil')
  const [alternativas, setAlternativas] = useState(ALTERNATIVAS_VAZIAS)
  const [correta, setCorreta] = useState<Letra | ''>('')
  const [explicacao, setExplicacao] = useState('')
  const [imagem, setImagem] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  // Edição: id da pergunta, imagem que ela já tem e se o admin pediu para tirá-la.
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [imagemAtual, setImagemAtual] = useState<string | null>(null)
  const [removerImagem, setRemoverImagem] = useState(false)

  async function buscar() {
    const dados = await consultarDados()
    setLista(dados.perguntas)
    setGabaritos(dados.gabaritos)
    setDisciplinas(dados.disciplinas)
    setErro(dados.erro)
  }

  useEffect(() => {
    consultarDados().then((dados) => {
      setLista(dados.perguntas)
      setGabaritos(dados.gabaritos)
      setDisciplinas(dados.disciplinas)
      setErro(dados.erro)
      setCarregando(false)
    })
  }, [])

  function mudarAlternativa(letra: Letra, texto: string) {
    setAlternativas((atual) => ({ ...atual, [letra]: texto }))
  }

  function aoEscolherImagem(e: React.ChangeEvent<HTMLInputElement>) {
    setImagem(e.target.files?.[0] ?? null)
    e.target.value = ''
  }

  function validar(): string | null {
    if (enunciado.trim().length < 10) return 'O enunciado precisa ter pelo menos 10 caracteres.'
    if (enunciado.length > 500) return 'O enunciado pode ter no máximo 500 caracteres.'
    if (!disciplinaId) return 'Escolha a disciplina.'
    const textos = LETRAS.map((l) => alternativas[l].trim())
    if (textos.some((t) => t === '')) return 'Preencha as quatro alternativas.'
    if (new Set(textos.map((t) => t.toLowerCase())).size < 4) return 'As quatro alternativas precisam ser diferentes.'
    if (!correta) return 'Marque qual alternativa é a correta.'
    if (explicacao.length > 600) return 'A explicação pode ter no máximo 600 caracteres.'
    if (imagem && !TIPOS_IMAGEM.includes(imagem.type)) return 'A imagem precisa ser PNG, JPG, WEBP ou GIF.'
    if (imagem && imagem.size > LIMITE_IMAGEM_MB * 1024 * 1024) return `A imagem pode ter no máximo ${LIMITE_IMAGEM_MB} MB.`
    return null
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setMensagem('')

    const problema = validar()
    if (problema) {
      setErro(problema)
      return
    }

    setSalvando(true)
    let imagemPath: string | null = null
    if (imagem) {
      imagemPath = `${crypto.randomUUID()}-${imagem.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
      const { error: erroUpload } = await supabase.storage
        .from('perguntas')
        .upload(imagemPath, imagem, { contentType: imagem.type })
      if (erroUpload) {
        setSalvando(false)
        setErro(`Falha ao enviar a imagem: ${erroUpload.message}`)
        return
      }
    }

    // Na edição, sem imagem nova, continua a atual (a não ser que o admin peça para tirar).
    const imagemFinal = imagemPath ?? (removerImagem ? null : imagemAtual)
    const dados = {
      p_enunciado: enunciado.trim(),
      p_disciplina_id: Number(disciplinaId),
      p_nivel: nivel,
      p_alternativa_a: alternativas.A.trim(),
      p_alternativa_b: alternativas.B.trim(),
      p_alternativa_c: alternativas.C.trim(),
      p_alternativa_d: alternativas.D.trim(),
      p_correta: correta,
      p_explicacao: explicacao.trim() || null,
      p_imagem_path: editandoId ? imagemFinal : imagemPath,
    }
    const { error } = editandoId
      ? await supabase.rpc('editar_pergunta', { p_id: editandoId, ...dados })
      : await supabase.rpc('criar_pergunta', dados)
    setSalvando(false)

    if (error) {
      if (imagemPath) await supabase.storage.from('perguntas').remove([imagemPath])
      setErro(error.message)
      return
    }

    // Imagem antiga trocada ou removida: apaga do armazenamento (as ilustrações do site ficam).
    if (editandoId && imagemAtual && imagemAtual !== imagemFinal && !imagemAtual.startsWith('ilustracoes/')) {
      await supabase.storage.from('perguntas').remove([imagemAtual])
    }

    setMensagem(editandoId ? 'Pergunta atualizada.' : 'Pergunta cadastrada.')
    limparFormulario()
    buscar()
  }

  function limparFormulario() {
    setEditandoId(null)
    setImagemAtual(null)
    setRemoverImagem(false)
    setEnunciado('')
    setAlternativas(ALTERNATIVAS_VAZIAS)
    setCorreta('')
    setExplicacao('')
    setImagem(null)
  }

  function editar(item: Pergunta) {
    const gabarito = gabaritos[item.id]
    setEditandoId(item.id)
    setImagemAtual(item.imagem_path)
    setRemoverImagem(false)
    setEnunciado(item.enunciado)
    setDisciplinaId(item.disciplina_id ? String(item.disciplina_id) : '')
    setNivel(item.nivel)
    setAlternativas({
      A: item.alternativa_a ?? '',
      B: item.alternativa_b ?? '',
      C: item.alternativa_c ?? '',
      D: item.alternativa_d ?? '',
    })
    setCorreta(gabarito?.correta ?? '')
    setExplicacao(gabarito?.explicacao ?? '')
    setImagem(null)
    setErro('')
    setMensagem('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function excluir(item: Pergunta) {
    const ok = await confirmar({
      titulo: 'Excluir esta pergunta?',
      mensagem: 'Ela sai do quiz e do histórico de respostas. Isso não pode ser desfeito.',
      textoConfirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    const { error } = await supabase.from('perguntas').delete().eq('id', item.id)
    if (error) {
      setErro(error.message)
      return
    }
    if (item.imagem_path) await supabase.storage.from('perguntas').remove([item.imagem_path])
    buscar()
  }

  function nomeDisciplina(id: number | null) {
    return disciplinas.find((d) => d.id === id)?.nome ?? null
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Perguntas</h2>
        <p>Banco de questões do quiz.</p>
        <p className="pagina-fatos">
          <span>4 alternativas e 1 correta</span>
          <span>O aluno nunca vê o gabarito: a correção é feita no banco</span>
        </p>
      </header>

      <div className="cartao">
        <form onSubmit={salvar} className="pergunta-form">
          <textarea
            className="campo campo-texto"
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            placeholder="Enunciado da pergunta (use **palavra** para negrito)"
            maxLength={500}
          />
          <div className="form-linha">
            <select className="campo" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
              <option value="">Disciplina...</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} ({cursosDa(d).join('/')})
                </option>
              ))}
            </select>
            <select className="campo" value={nivel} onChange={(e) => setNivel(e.target.value as Nivel)}>
              {NIVEIS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {LETRAS.map((letra) => (
            <label key={letra} className="pergunta-alternativa">
              <input
                type="radio"
                name="correta"
                checked={correta === letra}
                onChange={() => setCorreta(letra)}
                title="Marcar como correta"
              />
              <strong>{letra})</strong>
              <input
                className="campo"
                value={alternativas[letra]}
                onChange={(e) => mudarAlternativa(letra, e.target.value)}
                placeholder={`Alternativa ${letra}`}
              />
            </label>
          ))}
          <p className="item-meta">Marque a bolinha da alternativa correta.</p>

          <textarea
            className="campo campo-texto"
            value={explicacao}
            onChange={(e) => setExplicacao(e.target.value)}
            placeholder="Explicação mostrada depois da resposta (opcional, ajuda o aluno a aprender)"
            maxLength={600}
          />
          <label className="campo-arquivo">
            <input type="file" accept=".png,.jpg,.jpeg,.webp,.gif" onChange={aoEscolherImagem} />
            {imagem
              ? `Imagem: ${imagem.name}`
              : imagemAtual && !removerImagem
                ? 'Trocar a imagem atual (opcional)'
                : `Anexar imagem (opcional, até ${LIMITE_IMAGEM_MB} MB)`}
          </label>
          {editandoId && imagemAtual && !imagem ? (
            <label className="item-meta">
              <input type="checkbox" checked={removerImagem} onChange={(e) => setRemoverImagem(e.target.checked)} />{' '}
              Remover a imagem atual
            </label>
          ) : null}

          <div className="acoes-item">
            <button type="submit" className="btn btn-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Adicionar pergunta'}
            </button>
            {editandoId ? (
              <button type="button" className="btn btn-secundario" onClick={limparFormulario}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        {erro ? <p className="aviso erro">{erro}</p> : null}
        {mensagem ? <p className="aviso sucesso">{mensagem}</p> : null}
        {carregando ? <p className="status">Carregando...</p> : null}

        {!carregando && lista.length === 0 ? (
          <p className="vazio">Nenhuma pergunta cadastrada ainda.</p>
        ) : (
          <ul className="lista">
            {lista.map((item) => {
              const gabarito = gabaritos[item.id]
              const completa = !!gabarito && item.disciplina_id !== null
              return (
                <li key={item.id} className="item-lista">
                  <div>
                    <strong>
                      <TextoRico texto={item.enunciado} />
                    </strong>
                    <span className="item-meta">
                      {nomeDisciplina(item.disciplina_id) ?? 'Sem disciplina'}
                      <span className="selo">{item.nivel}</span>
                      {completa ? (
                        <span className="selo">Correta: {gabarito.correta}</span>
                      ) : (
                        <span className="selo selo-alerta">Incompleta — não entra no quiz</span>
                      )}
                      {item.imagem_path ? <span className="selo">Com imagem</span> : null}
                      {gabarito?.explicacao ? <span className="selo">Com explicação</span> : null}
                    </span>
                  </div>
                  <div className="acoes-item">
                    <button type="button" className="btn btn-secundario" onClick={() => editar(item)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-perigo" onClick={() => excluir(item)}>
                      Excluir
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
