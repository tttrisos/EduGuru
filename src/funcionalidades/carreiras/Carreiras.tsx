import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import Ajuda from '../../compartilhado/Ajuda'
import { useAuth } from '../../compartilhado/AuthContext'
import { supabase } from '../../compartilhado/supabase'
import type {
  AreaCarreira,
  AreaSugerida,
  Disciplina,
  DisciplinaArea,
  MaterialComunidade,
} from '../../compartilhado/tipos'
import { buscarMateriaisComunidade } from '../materiais/comunidade'
import AreasAdmin from './AreasAdmin'
import ListaVagas from './ListaVagas'
import './carreiras.css'

type Dados = {
  areas: AreaCarreira[]
  ligacoes: DisciplinaArea[]
  disciplinas: Disciplina[]
  sugeridas: AreaSugerida[]
  materiais: MaterialComunidade[]
  urlsArquivos: Record<string, string>
}

async function consultar(ehAdmin: boolean): Promise<{ dados: Dados; erro: string }> {
  const [areas, ligacoes, disciplinas, sugeridas] = await Promise.all([
    supabase.from('areas_carreira').select('*').order('nome'),
    supabase.from('disciplinas_areas').select('*'),
    supabase.from('disciplinas').select('*').order('nome'),
    ehAdmin ? Promise.resolve({ data: [], error: null }) : supabase.rpc('minhas_areas_carreira'),
  ])
  const erro = areas.error?.message ?? ligacoes.error?.message ?? disciplinas.error?.message ?? sugeridas.error?.message ?? ''

  const listaSugeridas = (sugeridas.data as AreaSugerida[]) ?? []
  const listaLigacoes = (ligacoes.data as DisciplinaArea[]) ?? []

  // Materiais aprovados das disciplinas das áreas sugeridas ("área sugerida → vagas e materiais").
  let materiais: MaterialComunidade[] = []
  let urlsArquivos: Record<string, string> = {}
  if (!ehAdmin && listaSugeridas.length > 0) {
    const idsAreas = new Set(listaSugeridas.map((s) => s.area_id))
    const idsDisciplinas = new Set(listaLigacoes.filter((l) => idsAreas.has(l.area_id)).map((l) => l.disciplina_id))
    const { lista, urls } = await buscarMateriaisComunidade({})
    materiais = lista.filter((m) => m.disciplina_id !== null && idsDisciplinas.has(m.disciplina_id)).slice(0, 6)
    urlsArquivos = urls
  }

  return {
    dados: {
      areas: (areas.data as AreaCarreira[]) ?? [],
      ligacoes: listaLigacoes,
      disciplinas: (disciplinas.data as Disciplina[]) ?? [],
      sugeridas: listaSugeridas,
      materiais,
      urlsArquivos,
    },
    erro,
  }
}

// EduGuru Carreiras: vagas de tecnologia ligadas ao desempenho no quiz.
// A candidatura acontece no site de origem; o EduGuru não recebe currículo nem dados de candidatura.
export default function Carreiras() {
  const { ehAdmin } = useAuth()
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState('')

  function recarregar() {
    consultar(ehAdmin).then((r) => {
      setDados(r.dados)
      setErro(r.erro)
    })
  }

  useEffect(() => {
    consultar(ehAdmin)
      .then((r) => {
        setDados(r.dados)
        setErro(r.erro)
      })
      .catch(() => setErro('Não foi possível conectar ao banco.'))
  }, [ehAdmin])

  return (
    <section className="pagina pagina-larga">
      <header className="pagina-topo">
        <h2>Carreiras</h2>
        <p>Vagas de tecnologia ligadas às disciplinas em que você vai bem no quiz.</p>
        <p className="pagina-fatos">
          <span>Vagas das comunidades backend-br e frontendbr no GitHub</span>
          <span>A candidatura é feita no site da vaga</span>
        </p>
      </header>

      {erro ? <p className="aviso erro">{erro}</p> : null}
      {!dados && !erro ? <p className="status">Carregando...</p> : null}

      {dados ? (
        <>
          {ehAdmin ? (
            <AreasAdmin
              areas={dados.areas}
              disciplinas={dados.disciplinas}
              ligacoes={dados.ligacoes}
              aoMudar={recarregar}
            />
          ) : (
            <AreasDoAluno sugeridas={dados.sugeridas} materiais={dados.materiais} urls={dados.urlsArquivos} />
          )}
          <ListaVagas areas={dados.areas} sugeridas={dados.sugeridas} />
        </>
      ) : null}
    </section>
  )
}

function AreasDoAluno({
  sugeridas,
  materiais,
  urls,
}: {
  sugeridas: AreaSugerida[]
  materiais: MaterialComunidade[]
  urls: Record<string, string>
}) {
  return (
    <div className="cartao areas-aluno">
      <h3>
        <Briefcase size={20} color="#8257e5" aria-hidden="true" /> Suas áreas em destaque
      </h3>
      {sugeridas.length === 0 ? (
        <>
          <p className="vazio">
            Ainda não há áreas sugeridas. Elas aparecem quando você acerta 60% ou mais em uma disciplina, com pelo
            menos 5 perguntas respondidas. Enquanto isso, explore as vagas de todas as áreas abaixo.
          </p>
          <Link to="/quiz" className="btn btn-primario areas-aluno-quiz">
            Fazer um quiz
          </Link>
        </>
      ) : (
        <>
          <ul className="areas-sugeridas">
            {sugeridas.map((s) => (
              <li key={s.area_id}>
                <strong>{s.area}</strong>
                <span className="selo selo-certo">{s.aproveitamento}% de acertos</span>
                <span className="item-meta">Pelo seu desempenho em {s.disciplinas.join(', ')}</span>
              </li>
            ))}
          </ul>
          {materiais.length > 0 ? (
            <div className="areas-materiais">
              <p>
                <strong>Para se preparar</strong> — materiais aprovados dessas disciplinas:
              </p>
              <ul>
                {materiais.map((m) => {
                  const href = m.link ?? (m.arquivo_path ? urls[m.arquivo_path] : undefined)
                  return (
                    <li key={m.id}>
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {m.titulo}
                        </a>
                      ) : (
                        m.titulo
                      )}{' '}
                      <span className="item-meta-inline">· {m.disciplina}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </>
      )}
      <Ajuda
        titulo="Como funciona"
        itens={[
          'As sugestões são uma orientação simples, calculada pelos seus acertos no quiz. Não são uma avaliação profissional.',
          'Ao clicar em "Candidatar-se", a vaga abre no GitHub, em outra aba. O EduGuru não recebe currículo nem dados da candidatura.',
          'Contamos apenas quantas vezes cada vaga foi aberta, para o painel da equipe (sem mostrar quem clicou).',
        ]}
      />
    </div>
  )
}
