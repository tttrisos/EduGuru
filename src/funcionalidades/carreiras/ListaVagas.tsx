import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, MapPin, RefreshCw } from 'lucide-react'
import { supabase } from '../../compartilhado/supabase'
import type { AreaCarreira, AreaSugerida } from '../../compartilhado/tipos'
import {
  ErroVagas,
  MSG_SEM_CONEXAO,
  buscarVagas,
  filtrarVagas,
  termosEncontrados,
  type FiltroVagas,
  type ResultadoVagas,
  type Vaga,
} from './vagas'
import { OPCOES_LOCAL, localDaVaga, vagaNoLocal, type FiltroLocal } from './localidade'

const POR_PAGINA = 15

const OPCOES_NIVEL: { valor: FiltroVagas['nivel']; label: string }[] = [
  { valor: 'todos', label: 'Todos os níveis' },
  { valor: 'inicio', label: 'Estágio e Júnior' },
  { valor: 'Pleno', label: 'Pleno' },
  { valor: 'Sênior', label: 'Sênior' },
]

// Lista de vagas da API do GitHub, filtrada pelas áreas. "sugeridas" vem do desempenho no quiz.
export default function ListaVagas({ areas, sugeridas }: { areas: AreaCarreira[]; sugeridas: AreaSugerida[] }) {
  const [resultado, setResultado] = useState<ResultadoVagas | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  // 'sugeridas', 'todas' ou o id de uma área
  const [aba, setAba] = useState<string>(sugeridas.length > 0 ? 'sugeridas' : 'todas')
  const [nivel, setNivel] = useState<FiltroVagas['nivel']>('todos')
  const [busca, setBusca] = useState('')
  // Padrão: só remotas e no estado de SP (alunos da UMC, em Mogi das Cruzes).
  const [local, setLocal] = useState<FiltroLocal>('sp-remoto')
  const [quantas, setQuantas] = useState(POR_PAGINA)

  const carregar = useCallback(async (forcar: boolean) => {
    setCarregando(true)
    setErro('')
    try {
      setResultado(await buscarVagas({ forcar }))
    } catch (e) {
      setErro(e instanceof ErroVagas ? e.message : MSG_SEM_CONEXAO)
    } finally {
      setCarregando(false)
    }
  }, [])

  // Primeira busca: usa o cache se ele tiver menos de 30 minutos.
  useEffect(() => {
    buscarVagas()
      .then(setResultado)
      .catch((e) => setErro(e instanceof ErroVagas ? e.message : MSG_SEM_CONEXAO))
      .finally(() => setCarregando(false))
  }, [])

  const idsSugeridos = useMemo(() => new Set(sugeridas.map((s) => s.area_id)), [sugeridas])

  const areasDoFiltro = useMemo(() => {
    if (aba === 'todas') return []
    if (aba === 'sugeridas') return areas.filter((a) => idsSugeridos.has(a.id))
    return areas.filter((a) => String(a.id) === aba)
  }, [aba, areas, idsSugeridos])

  const semFiltroLocal = useMemo(
    () => filtrarVagas(resultado?.vagas ?? [], { areas: areasDoFiltro, nivel, busca }),
    [resultado, areasDoFiltro, nivel, busca],
  )

  // Filtro de localidade; as vagas perto da UMC (Alto Tietê) vêm primeiro.
  const filtradas = useMemo(() => {
    const lista = semFiltroLocal.filter((v) => vagaNoLocal(v, local))
    return [...lista].sort((a, b) => Number(localDaVaga(b).pertoDaUmc) - Number(localDaVaga(a).pertoDaUmc))
  }, [semFiltroLocal, local])

  const escondidasPeloLocal = semFiltroLocal.length - filtradas.length

  function trocarAba(nova: string) {
    setAba(nova)
    setQuantas(POR_PAGINA)
  }

  // Por que a vaga aparece: a área (sugerida, de preferência) e o termo encontrado.
  function motivo(vaga: Vaga) {
    const candidatas = areasDoFiltro.length > 0 ? areasDoFiltro : areas
    const ordem = [...candidatas].sort((a, b) => Number(idsSugeridos.has(b.id)) - Number(idsSugeridos.has(a.id)))
    for (const area of ordem) {
      const termos = termosEncontrados(vaga, area)
      if (termos.length === 0) continue
      const sugestao = sugeridas.find((s) => s.area_id === area.id)
      return {
        area,
        texto: sugestao
          ? `${area.nome}: você acerta ${sugestao.aproveitamento}% em ${sugestao.disciplinas.slice(0, 2).join(' e ')}`
          : area.nome,
      }
    }
    return null
  }

  function registrarClique(vaga: Vaga, areaId: number | null) {
    // Não espera a resposta: a vaga abre na hora, em outra aba.
    void supabase.rpc('registrar_clique_vaga', {
      p_fonte: vaga.fonte,
      p_vaga_numero: vaga.numero,
      p_vaga_titulo: vaga.titulo,
      p_area_id: areaId,
    })
  }

  const abas = [
    ...(sugeridas.length > 0 ? [{ valor: 'sugeridas', label: 'Sugeridas para você' }] : []),
    { valor: 'todas', label: 'Todas as áreas' },
    ...areas.map((a) => ({ valor: String(a.id), label: a.nome })),
  ]

  return (
    <div className="cartao vagas">
      <div className="vagas-topo">
        <h3>Vagas de tecnologia</h3>
        <button
          type="button"
          className="btn btn-secundario btn-pequeno"
          onClick={() => carregar(true)}
          disabled={carregando}
        >
          <RefreshCw size={14} aria-hidden="true" /> Atualizar
        </button>
      </div>

      <div className="abas abas-rolagem" role="tablist" aria-label="Filtrar vagas por área">
        {abas.map((a) => (
          <button
            key={a.valor}
            type="button"
            role="tab"
            aria-selected={aba === a.valor}
            className={`aba${aba === a.valor ? ' ativa' : ''}`}
            onClick={() => trocarAba(a.valor)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="form-linha">
        <input
          className="campo"
          type="search"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            setQuantas(POR_PAGINA)
          }}
          placeholder="Buscar por tecnologia, cidade ou empresa"
          aria-label="Buscar vagas"
        />
        <select
          className="campo vagas-nivel"
          value={nivel}
          onChange={(e) => {
            setNivel(e.target.value as FiltroVagas['nivel'])
            setQuantas(POR_PAGINA)
          }}
          aria-label="Nível da vaga"
        >
          {OPCOES_NIVEL.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="campo vagas-local"
          value={local}
          onChange={(e) => {
            setLocal(e.target.value as FiltroLocal)
            setQuantas(POR_PAGINA)
          }}
          aria-label="Localidade da vaga"
        >
          {OPCOES_LOCAL.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {resultado?.aviso ? <p className="aviso alerta">{resultado.aviso}</p> : null}
      {erro ? (
        <div className="vagas-erro">
          <p className="aviso erro">{erro}</p>
          <button type="button" className="btn btn-secundario" onClick={() => carregar(true)}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {carregando && !resultado ? <p className="status">Buscando vagas no GitHub...</p> : null}

      {resultado && !erro ? (
        <>
          <p className="item-meta">
            {filtradas.length} {filtradas.length === 1 ? 'vaga encontrada' : 'vagas encontradas'} · atualizadas às{' '}
            {new Date(resultado.salvoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · fonte:
            GitHub (backend-br/vagas e frontendbr/vagas)
          </p>
          {escondidasPeloLocal > 0 && local !== 'todas' ? (
            <p className="item-meta vagas-escondidas">
              {escondidasPeloLocal} {escondidasPeloLocal === 1 ? 'vaga de outra região ficou' : 'vagas de outras regiões ficaram'} de
              fora (outros estados, exterior ou sem local informado).{' '}
              <button type="button" className="link-botao" onClick={() => setLocal('todas')}>
                Ver todas
              </button>
            </p>
          ) : null}

          {filtradas.length === 0 ? (
            <p className="vazio">Nenhuma vaga com esses filtros agora. Tente outra área, outro nível ou outra localidade.</p>
          ) : (
            <ul className="lista">
              {filtradas.slice(0, quantas).map((vaga) => {
                const porque = motivo(vaga)
                const lugar = localDaVaga(vaga)
                return (
                  <li key={`${vaga.fonte}#${vaga.numero}`} className="item-lista vaga">
                    <div className="vaga-info">
                      <strong>{vaga.titulo}</strong>
                      <span className="item-meta">
                        Publicada em {new Date(vaga.publicadaEm).toLocaleDateString('pt-BR')} · {vaga.fonte}
                      </span>
                      <div className="vaga-selos">
                        {vaga.nivel ? <span className="selo">{vaga.nivel}</span> : null}
                        {lugar.pertoDaUmc ? <span className="selo selo-umc">Perto da UMC</span> : null}
                        {lugar.rotulo !== 'Remoto' ? (
                          <span className="selo selo-neutro selo-local">
                            <MapPin size={12} aria-hidden="true" /> {lugar.rotulo}
                          </span>
                        ) : null}
                        {vaga.modalidade ? <span className="selo selo-neutro">{vaga.modalidade}</span> : null}
                        {porque ? (
                          <span className={`selo ${idsSugeridos.has(porque.area.id) ? 'selo-certo' : 'selo-neutro'}`}>
                            {porque.texto}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <a
                      className="btn btn-primario vaga-candidatar"
                      href={vaga.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => registrarClique(vaga, porque?.area.id ?? null)}
                    >
                      Candidatar-se <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}

          {filtradas.length > quantas ? (
            <button type="button" className="btn btn-secundario vagas-mais" onClick={() => setQuantas((q) => q + POR_PAGINA)}>
              Ver mais vagas ({filtradas.length - quantas})
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
