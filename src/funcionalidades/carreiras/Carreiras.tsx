import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import Ajuda from '../../compartilhado/Ajuda'
import { useAuth } from '../../compartilhado/AuthContext'
import { supabase } from '../../compartilhado/supabase'
import type { AreaCarreira, AreaSugerida, DisciplinaArea, MaterialComunidade } from '../../compartilhado/tipos'
import { buscarMateriaisComunidade } from '../materiais/comunidade'
import ListaVagas from './ListaVagas'
import { combinarSugestoes, type AfinidadeBussola, type SugestaoArea } from './afinidadeBussola'
import './carreiras.css'

type Dados = {
  areas: AreaCarreira[]
  ligacoes: DisciplinaArea[]
  sugeridas: SugestaoArea[]
  materiais: MaterialComunidade[]
  urlsArquivos: Record<string, string>
}

const vazio = Promise.resolve({ data: [], error: null })

// As áreas de carreira e a ligação disciplina → área vêm prontas do script 17
// (8 áreas ligadas à grade); não há cadastro pela tela.
async function consultar(ehAdmin: boolean): Promise<{ dados: Dados; erro: string }> {
  const [areas, ligacoes, desempenho, bussola] = await Promise.all([
    supabase.from('areas_carreira').select('*').order('nome'),
    supabase.from('disciplinas_areas').select('*'),
    ehAdmin ? vazio : supabase.rpc('minhas_areas_carreira'),
    // Antes do script 18 a função não existe: a tela segue só com o desempenho.
    ehAdmin ? vazio : supabase.rpc('minha_bussola'),
  ])
  const erro = areas.error?.message ?? ligacoes.error?.message ?? desempenho.error?.message ?? ''

  const listaBussola = bussola.error ? [] : ((bussola.data as AfinidadeBussola[]) ?? [])
  const sugeridas = combinarSugestoes((desempenho.data as AreaSugerida[]) ?? [], listaBussola)
  const listaLigacoes = (ligacoes.data as DisciplinaArea[]) ?? []

  // Materiais aprovados das disciplinas das áreas sugeridas ("área sugerida → vagas e materiais").
  let materiais: MaterialComunidade[] = []
  let urlsArquivos: Record<string, string> = {}
  if (!ehAdmin && sugeridas.length > 0) {
    const idsAreas = new Set(sugeridas.map((s) => s.area_id))
    const idsDisciplinas = new Set(listaLigacoes.filter((l) => idsAreas.has(l.area_id)).map((l) => l.disciplina_id))
    const { lista, urls } = await buscarMateriaisComunidade({})
    materiais = lista.filter((m) => m.disciplina_id !== null && idsDisciplinas.has(m.disciplina_id)).slice(0, 6)
    urlsArquivos = urls
  }

  return {
    dados: {
      areas: (areas.data as AreaCarreira[]) ?? [],
      ligacoes: listaLigacoes,
      sugeridas,
      materiais,
      urlsArquivos,
    },
    erro,
  }
}

// EduGuru Carreiras: vagas de tecnologia ligadas ao desempenho no quiz e à Bússola EduGuru.
// A candidatura acontece no site de origem; o EduGuru não recebe currículo nem dados de candidatura.
export default function Carreiras() {
  const { ehAdmin } = useAuth()
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState('')

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
        <h2 className="carreiras-titulo">
          <span className="assinatura">EduGuru</span>
          Carreiras
        </h2>
        <p>Vagas de tecnologia ligadas ao seu desempenho no quiz e aos seus interesses.</p>
        <p className="pagina-fatos">
          <span>Vagas remotas e no estado de SP, perto da UMC</span>
          <span>Vagas das comunidades backend-br e frontendbr no GitHub</span>
          <span>A candidatura é feita no site da vaga</span>
        </p>
      </header>

      {erro ? <p className="aviso erro">{erro}</p> : null}
      {!dados && !erro ? <p className="status">Carregando...</p> : null}

      {dados ? (
        <>
          {ehAdmin ? null : (
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
  sugeridas: SugestaoArea[]
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
            Ainda não há áreas sugeridas. Elas aparecem quando você acerta 60% ou mais em uma disciplina (com pelo
            menos 5 perguntas respondidas) ou quando responde a Bússola. Enquanto isso, explore as vagas de todas as
            áreas abaixo.
          </p>
          <div className="areas-aluno-acoes">
            <Link to="/quiz" className="btn btn-primario">
              Fazer um quiz
            </Link>
            <Link to="/bussola" className="btn btn-secundario">
              Responder a Bússola
            </Link>
          </div>
        </>
      ) : (
        <>
          <ul className="areas-sugeridas">
            {sugeridas.map((s) => (
              <li key={s.area_id} className={s.aproveitamento !== null && s.afinidade !== null ? 'combina' : ''}>
                <strong>{s.area}</strong>
                {s.aproveitamento !== null && s.afinidade !== null ? (
                  <span className="selo selo-umc">Combina com você</span>
                ) : null}
                <div className="areas-motivos">
                  {s.aproveitamento !== null ? (
                    <span className="selo selo-certo">Quiz: {s.aproveitamento}% de acertos</span>
                  ) : null}
                  {s.afinidade !== null ? <span className="selo">Bússola: {s.afinidade}% de afinidade</span> : null}
                </div>
                {s.disciplinas.length > 0 ? (
                  <span className="item-meta">Pelo seu desempenho em {s.disciplinas.join(', ')}</span>
                ) : (
                  <span className="item-meta">Pelos seus interesses na Bússola</span>
                )}
              </li>
            ))}
          </ul>
          {materiais.length > 0 ? (
            <div className="areas-materiais">
              <p>
                <strong>Para se preparar</strong> — materiais aprovados das disciplinas dessas áreas:
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
          'As sugestões juntam seus acertos no quiz (60% ou mais) e a Bússola EduGuru (no menu, ao lado de Disciplinas). São uma orientação simples, não uma avaliação profissional ou psicológica.',
          'Ao clicar em "Candidatar-se", a vaga abre no GitHub, em outra aba. O EduGuru não recebe currículo nem dados da candidatura.',
          'Contamos apenas quantas vezes cada vaga foi aberta, para o painel da equipe (sem mostrar quem clicou).',
        ]}
      />
    </div>
  )
}
