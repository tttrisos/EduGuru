import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import Ajuda from '../../compartilhado/Ajuda'
import { useDialogo } from '../../compartilhado/Dialogo'
import GraficoBarras from '../../compartilhado/GraficoBarras'
import { supabase } from '../../compartilhado/supabase'
import {
  ESCALA,
  completas,
  destaques,
  progresso,
  proximaSemResposta,
  type AfinidadeBussola,
  type Afirmacao,
  type Respostas,
} from './afinidadeBussola'
import './carreiras.css'

type Etapa = 'carregando' | 'inicio' | 'perguntas' | 'resultado'

// Bússola EduGuru: autoavaliação de interesses (RF33). Não é teste vocacional nem psicológico.
export default function Bussola() {
  const { confirmar } = useDialogo()
  const [etapa, setEtapa] = useState<Etapa>('carregando')
  const [afirmacoes, setAfirmacoes] = useState<Afirmacao[]>([])
  const [respostas, setRespostas] = useState<Respostas>({})
  const [atual, setAtual] = useState(0)
  const [resultado, setResultado] = useState<AfinidadeBussola[]>([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('bussola_afirmacoes').select('id, texto, area_id, ordem').eq('ativa', true).order('ordem'),
      supabase.rpc('minha_bussola'),
    ])
      .then(([afs, meu]) => {
        if (afs.error) {
          setErro('A Bússola ainda não está disponível (o script 18 do banco não foi aplicado).')
          setEtapa('inicio')
          return
        }
        setAfirmacoes((afs.data as Afirmacao[]) ?? [])
        const anterior = (meu.data as AfinidadeBussola[]) ?? []
        setResultado(anterior)
        setEtapa(anterior.length > 0 ? 'resultado' : 'inicio')
      })
      .catch(() => {
        setErro('Não foi possível conectar ao banco.')
        setEtapa('inicio')
      })
  }, [])

  function comecar() {
    setRespostas({})
    setAtual(0)
    setErro('')
    setEtapa('perguntas')
  }

  const responder = useCallback(
    (valor: number) => {
      const af = afirmacoes[atual]
      if (!af) return
      const novas = { ...respostas, [af.id]: valor }
      setRespostas(novas)
      // Avança sozinho; na última, fica para o aluno clicar em "Ver meu resultado".
      if (atual < afirmacoes.length - 1) setTimeout(() => setAtual((i) => Math.min(i + 1, afirmacoes.length - 1)), 180)
    },
    [afirmacoes, atual, respostas],
  )

  // Atalho de teclado: 1 a 5 respondem a afirmação atual.
  useEffect(() => {
    if (etapa !== 'perguntas') return
    function tecla(e: KeyboardEvent) {
      const n = Number(e.key)
      if (n >= 1 && n <= 5 && !(e.target instanceof HTMLInputElement)) responder(n)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [etapa, responder])

  async function verResultado() {
    if (!completas(afirmacoes, respostas)) {
      setAtual(proximaSemResposta(afirmacoes, respostas))
      setErro('Responda todas as afirmações para ver o resultado.')
      return
    }
    setSalvando(true)
    setErro('')
    const { data, error } = await supabase.rpc('salvar_bussola', { p_respostas: respostas })
    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    setResultado((data as AfinidadeBussola[]) ?? [])
    setEtapa('resultado')
  }

  async function apagar() {
    const ok = await confirmar({
      titulo: 'Apagar o resultado da Bússola?',
      mensagem: 'Suas respostas e afinidades são apagadas e deixam de influenciar as sugestões do Carreiras.',
      textoConfirmar: 'Apagar',
      perigo: true,
    })
    if (!ok) return
    const { error } = await supabase.from('bussola_resultados').delete().not('aluno_id', 'is', null)
    if (error) {
      setErro(error.message)
      return
    }
    setResultado([])
    setEtapa('inicio')
  }

  const af = afirmacoes[atual]
  const top = destaques(resultado)

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <Link to="/carreiras" className="bussola-voltar">
          <ArrowLeft size={16} aria-hidden="true" /> Carreiras
        </Link>
        <h2 className="carreiras-titulo">
          <span className="assinatura">EduGuru</span>
          Bússola
        </h2>
        <p>Autoavaliação de interesses: descubra quais áreas da tecnologia combinam com você.</p>
      </header>

      {erro ? <p className="aviso erro">{erro}</p> : null}
      {etapa === 'carregando' ? <p className="status">Carregando...</p> : null}

      {etapa === 'inicio' ? (
        <div className="cartao bussola-inicio">
          <Compass size={56} className="bussola-icone" aria-hidden="true" />
          <h3>Para onde aponta a sua bússola?</h3>
          <p>
            Leia {afirmacoes.length || 16} frases curtas e diga o quanto cada uma tem a ver com você. Leva cerca de 3
            minutos e não existe resposta certa.
          </p>
          <Ajuda
            titulo="Antes de começar"
            itens={[
              'É uma orientação simples, para você explorar áreas da tecnologia. Não é teste vocacional nem avaliação psicológica.',
              'O resultado mostra sua afinidade com cada área e entra nas sugestões de vagas e materiais do Carreiras.',
              'Só você vê suas respostas. A equipe vê apenas totais gerais, sem nomes.',
              'Responder é opcional. Você pode refazer ou apagar o resultado quando quiser.',
            ]}
          />
          <button type="button" className="btn btn-primario btn-grande" onClick={comecar} disabled={afirmacoes.length === 0}>
            Começar
          </button>
        </div>
      ) : null}

      {etapa === 'perguntas' && af ? (
        <div className="cartao bussola-pergunta">
          <div className="bussola-progresso">
            <span>
              Afirmação {atual + 1} de {afirmacoes.length}
            </span>
            <div className="bussola-barra" role="progressbar" aria-valuenow={progresso(afirmacoes, respostas)} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${progresso(afirmacoes, respostas)}%` }} />
            </div>
          </div>

          <p className="bussola-texto" key={af.id}>
            {af.texto}
          </p>

          <div className="bussola-escala" role="radiogroup" aria-label="O quanto isso tem a ver com você">
            {ESCALA.map((e) => (
              <button
                key={e.valor}
                type="button"
                role="radio"
                aria-checked={respostas[af.id] === e.valor}
                className={`bussola-opcao${respostas[af.id] === e.valor ? ' marcada' : ''}`}
                onClick={() => responder(e.valor)}
              >
                <strong>{e.valor}</strong>
                <span>{e.rotulo}</span>
              </button>
            ))}
          </div>

          <div className="bussola-navegacao">
            <button type="button" className="btn btn-secundario" onClick={() => setAtual((i) => Math.max(0, i - 1))} disabled={atual === 0}>
              Anterior
            </button>
            <span className="item-meta">Dica: use as teclas 1 a 5</span>
            {atual < afirmacoes.length - 1 ? (
              <button type="button" className="btn btn-secundario" onClick={() => setAtual((i) => i + 1)} disabled={!respostas[af.id]}>
                Próxima
              </button>
            ) : (
              <button type="button" className="btn btn-primario" onClick={verResultado} disabled={salvando || !respostas[af.id]}>
                {salvando ? 'Calculando...' : 'Ver meu resultado'}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {etapa === 'resultado' ? (
        <>
          <div className="cartao bussola-resultado">
            <Compass size={48} className="bussola-icone girando" aria-hidden="true" />
            <div>
              <p className="item-meta">Sua bússola aponta para</p>
              <h3>{top.length > 0 ? top.map((t) => t.area).join(' · ') : 'Nenhuma área em destaque'}</h3>
              <p className="item-meta">
                {top.length > 0
                  ? 'Essas áreas já aparecem em "Sugeridas para você" no Carreiras, com vagas e materiais.'
                  : 'Suas respostas ficaram baixas em todas as áreas. Explore as vagas e refaça quando quiser.'}
              </p>
            </div>
          </div>

          <div className="cartao">
            <GraficoBarras
              titulo="Sua afinidade com cada área (%)"
              itens={resultado.map((r) => ({ rotulo: r.area, valor: r.afinidade }))}
              maximo={100}
              sufixo="%"
            />
            <p className="item-meta bussola-nota">
              Afinidade = média das suas respostas nas frases de cada área (1 = 0%, 5 = 100%). É uma orientação simples,
              não uma avaliação profissional ou psicológica.
            </p>
            <div className="bussola-acoes">
              <Link to="/carreiras" className="btn btn-primario">
                Ver vagas dessas áreas
              </Link>
              <button type="button" className="btn btn-secundario" onClick={comecar}>
                Refazer
              </button>
              <button type="button" className="btn btn-perigo" onClick={apagar}>
                Apagar meu resultado
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
