// ============================================================
// funcionalidades/materiais/ListasDoFiltro.tsx
// LISTAS DO FILTRO (admin, dentro de Materiais) — RF27. O admin inclui e remove sites
// permitidos e termos bloqueados sem mexer no código, e testa o filtro com um exemplo.
// Banco (supabase/22): tabelas filtro_sites e filtro_termos (só o admin altera; tudo vai
// para o log), verificar_material (teste) e reanalisar_materiais_publicados.
// ============================================================

import { useEffect, useState } from 'react'
import { Filter, X } from 'lucide-react'
import { useDialogo } from '../../compartilhado/componentes/Dialogo'
import { supabase } from '../../compartilhado/banco/supabase'
import { semAcento, type ResultadoFiltro } from './filtroMateriais'

type Lista = 'filtro_sites' | 'filtro_termos'
type Item = { id: number; valor: string }

const CONFIG = {
  filtro_sites: {
    coluna: 'dominio',
    titulo: 'Sites permitidos',
    explicacao: 'Links destes sites (e dos subdomínios, como pt.wikipedia.org) são publicados na hora. Links de outros sites vão para a Moderação.',
    exemplo: 'Ex.: blog.exemplo.com.br',
  },
  filtro_termos: {
    coluna: 'termo',
    titulo: 'Termos bloqueados',
    explicacao: 'Materiais com estes termos no título, na descrição, no nome do arquivo ou no link são recusados. Acentos e disfarces como "p0rn" são tratados pelo banco. Só administradores veem esta lista.',
    exemplo: 'Ex.: apostila vendida',
  },
} as const

async function consultarListas() {
  const [sites, termos] = await Promise.all([
    supabase.from('filtro_sites').select('id, dominio').order('dominio'),
    supabase.from('filtro_termos').select('id, termo').order('termo'),
  ])
  return {
    sites: ((sites.data as { id: number; dominio: string }[]) ?? []).map((s) => ({ id: s.id, valor: s.dominio })),
    termos: ((termos.data as { id: number; termo: string }[]) ?? []).map((t) => ({ id: t.id, valor: t.termo })),
    erro: sites.error?.message ?? termos.error?.message ?? '',
  }
}

export default function ListasDoFiltro({ versao, aoMudar }: { versao: number; aoMudar: () => void }) {
  const { confirmar } = useDialogo()
  const [itens, setItens] = useState<Record<Lista, Item[]>>({ filtro_sites: [], filtro_termos: [] })
  const [novo, setNovo] = useState<Record<Lista, string>>({ filtro_sites: '', filtro_termos: '' })
  const [busca, setBusca] = useState<Record<Lista, string>>({ filtro_sites: '', filtro_termos: '' })
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  // Teste do filtro
  const [testeTitulo, setTesteTitulo] = useState('')
  const [testeLink, setTesteLink] = useState('')
  const [testeResultado, setTesteResultado] = useState<{ tipo: 'erro' | 'sucesso' | 'alerta'; texto: string } | null>(null)

  function carregar() {
    consultarListas().then((r) => {
      setItens({ filtro_sites: r.sites, filtro_termos: r.termos })
      if (r.erro) setErro(r.erro)
    })
  }

  // Recarrega quando a Moderação libera um site (versao muda).
  useEffect(() => {
    carregar()
  }, [versao])

  async function incluir(lista: Lista, e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    const valor = novo[lista].trim()
    if (!valor) return
    // O banco padroniza (minúsculas, sem acento, sem "https://www.") e devolve como gravou.
    const { data, error } = await supabase
      .from(lista)
      .insert(lista === 'filtro_sites' ? { dominio: valor } : { termo: valor })
      .select(CONFIG[lista].coluna)
      .single()
    if (error) {
      setErro(error.code === '23505' ? 'Esse item já está na lista.' : error.message)
      return
    }
    const gravado = (data as Record<string, string>)[CONFIG[lista].coluna]
    setNovo((n) => ({ ...n, [lista]: '' }))

    if (lista === 'filtro_termos') {
      // Termo novo: o que JÁ está publicado e agora seria bloqueado volta para a análise.
      const { data: total, error: erroReanalise } = await supabase.rpc('reanalisar_materiais_publicados')
      if (erroReanalise) setErro(erroReanalise.message)
      setSucesso(
        Number(total) > 0
          ? `Termo "${gravado}" incluído. ${total} material(is) publicado(s) tinham esse termo e voltaram para a Moderação.`
          : `Termo "${gravado}" incluído. Nenhum material publicado tinha esse termo.`,
      )
    } else {
      setSucesso(`Site ${gravado} incluído. Os próximos links dele serão publicados na hora.`)
    }
    carregar()
    aoMudar()
  }

  async function remover(lista: Lista, item: Item) {
    const ehSite = lista === 'filtro_sites'
    const ok = await confirmar({
      titulo: ehSite ? `Tirar ${item.valor} dos sites permitidos?` : `Tirar "${item.valor}" dos termos bloqueados?`,
      mensagem: ehSite
        ? 'Os próximos links desse site vão para a Moderação. Os materiais já publicados continuam no ar (para retirar, use "Todos os materiais").'
        : 'Materiais com esse termo voltam a ser aceitos.',
      textoConfirmar: 'Tirar da lista',
      perigo: true,
    })
    if (!ok) return
    setErro('')
    setSucesso('')
    const { error } = await supabase.from(lista).delete().eq('id', item.id)
    if (error) setErro(error.message)
    else {
      setSucesso(ehSite ? `Site ${item.valor} retirado da lista.` : `Termo "${item.valor}" retirado da lista.`)
      carregar()
    }
  }

  async function testar(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase.rpc('verificar_material', {
      p_titulo: testeTitulo,
      p_link: testeLink.trim() || null,
    })
    const r = data as ResultadoFiltro | null
    if (error || !r) setTesteResultado({ tipo: 'erro', texto: error?.message ?? 'Não foi possível testar.' })
    else if (r.motivo) setTesteResultado({ tipo: 'erro', texto: `Seria recusado: ${r.motivo}` })
    else if (r.site_novo) setTesteResultado({ tipo: 'alerta', texto: 'Iria para a Moderação: o site não está na lista.' })
    else setTesteResultado({ tipo: 'sucesso', texto: 'Seria publicado na hora (link) ou iria para análise (arquivo de aluno).' })
  }

  return (
    <div className="cartao listas-filtro">
      <h3>
        <Filter size={20} color="#8257e5" aria-hidden="true" /> Listas do filtro
      </h3>
      <p className="item-meta">
        O filtro automático usa estas listas. Mudar aqui vale na hora, sem alterar o código. Toda inclusão e
        exclusão fica registrada nos Logs.
      </p>
      {sucesso ? <p className="aviso sucesso">{sucesso}</p> : null}
      {erro ? <p className="aviso erro">{erro}</p> : null}

      <form className="form-linha" onSubmit={testar} aria-label="Testar o filtro">
        <input
          className="campo"
          value={testeTitulo}
          onChange={(e) => setTesteTitulo(e.target.value)}
          placeholder="Testar: título do material"
          aria-label="Título para testar"
        />
        <input
          className="campo"
          value={testeLink}
          onChange={(e) => setTesteLink(e.target.value)}
          placeholder="Link (opcional)"
          aria-label="Link para testar"
        />
        <button type="submit" className="btn btn-secundario" disabled={!testeTitulo.trim()}>
          Testar o filtro
        </button>
      </form>
      {testeResultado ? (
        <p className={`aviso ${testeResultado.tipo === 'alerta' ? 'alerta' : testeResultado.tipo}`}>{testeResultado.texto}</p>
      ) : null}

      <div className="listas-filtro-colunas">
        {(['filtro_sites', 'filtro_termos'] as Lista[]).map((lista) => {
          const filtro = semAcento(busca[lista].trim())
          const visiveis = itens[lista].filter((i) => !filtro || i.valor.includes(filtro))
          return (
            <section key={lista} className="listas-filtro-coluna">
              <h4>
                {CONFIG[lista].titulo} ({itens[lista].length})
              </h4>
              <p className="item-meta">{CONFIG[lista].explicacao}</p>
              <form className="form-linha" onSubmit={(e) => incluir(lista, e)}>
                <input
                  className="campo"
                  value={novo[lista]}
                  onChange={(e) => setNovo((n) => ({ ...n, [lista]: e.target.value }))}
                  placeholder={CONFIG[lista].exemplo}
                  aria-label={`Incluir em ${CONFIG[lista].titulo}`}
                  maxLength={100}
                />
                <button type="submit" className="btn btn-primario" disabled={!novo[lista].trim()}>
                  Incluir
                </button>
              </form>
              {itens[lista].length > 12 ? (
                <input
                  className="campo listas-filtro-busca"
                  type="search"
                  value={busca[lista]}
                  onChange={(e) => setBusca((b) => ({ ...b, [lista]: e.target.value }))}
                  placeholder="Buscar na lista"
                  aria-label={`Buscar em ${CONFIG[lista].titulo}`}
                />
              ) : null}
              <ul className="listas-filtro-itens">
                {visiveis.map((item) => (
                  <li key={item.id}>
                    {item.valor}
                    <button
                      type="button"
                      onClick={() => remover(lista, item)}
                      aria-label={`Tirar ${item.valor} da lista`}
                      title="Tirar da lista"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
                {visiveis.length === 0 ? <li className="vazio">Nada encontrado.</li> : null}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
