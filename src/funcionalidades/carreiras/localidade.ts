// Localidade das vagas do EduGuru Carreiras.
// O público é de alunos da UMC (Mogi das Cruzes, SP), então o filtro padrão mostra só
// vagas remotas ou no estado de São Paulo, e destaca as do Alto Tietê, perto da UMC.
// O local vem do começo do título ("[Remoto]", "[Híbrido em SP]", "[Joinville/SC]") e das
// etiquetas (o frontendbr usa etiquetas com o nome do estado, ex.: "São Paulo").
import { contemTermo, normalizar } from './vagas'

export type Localidade = {
  remoto: boolean
  sp: boolean
  // Mogi das Cruzes e cidades vizinhas (região da UMC)
  pertoDaUmc: boolean
  // Algum lugar fora de SP foi citado (outro estado ou outro país)
  outroLugar: boolean
  // Texto curto para o selo (ex.: "Mogi das Cruzes/SP", "São Paulo/SP", "Joinville/SC")
  rotulo: string
}

export type FiltroLocal = 'sp-remoto' | 'remoto' | 'sp' | 'todas'

export const OPCOES_LOCAL: { valor: FiltroLocal; label: string }[] = [
  { valor: 'sp-remoto', label: 'Remotas e no estado de SP' },
  { valor: 'remoto', label: 'Só remotas' },
  { valor: 'sp', label: 'Só no estado de SP' },
  { valor: 'todas', label: 'Todas as localidades' },
]

// Alto Tietê (região da UMC): nome normalizado → nome para exibir
const ALTO_TIETE: [string, string][] = [
  // Só "Mogi das Cruzes": "Mogi Mirim" e "Mogi Guaçu" são outras regiões de SP.
  ['mogi das cruzes', 'Mogi das Cruzes'],
  ['suzano', 'Suzano'],
  ['itaquaquecetuba', 'Itaquaquecetuba'],
  ['poa', 'Poá'],
  ['aruja', 'Arujá'],
  ['ferraz de vasconcelos', 'Ferraz de Vasconcelos'],
  ['guararema', 'Guararema'],
  ['biritiba mirim', 'Biritiba Mirim'],
  ['salesopolis', 'Salesópolis'],
  ['santa isabel', 'Santa Isabel'],
]

// Outras cidades do estado de SP que aparecem em vagas de tecnologia
const CIDADES_SP: [string, string][] = [
  ['sao paulo', 'São Paulo'],
  ['guarulhos', 'Guarulhos'],
  ['santo andre', 'Santo André'],
  ['sao bernardo do campo', 'São Bernardo do Campo'],
  ['sao caetano do sul', 'São Caetano do Sul'],
  ['diadema', 'Diadema'],
  ['maua', 'Mauá'],
  ['osasco', 'Osasco'],
  ['barueri', 'Barueri'],
  ['alphaville', 'Alphaville'],
  ['santana de parnaiba', 'Santana de Parnaíba'],
  ['cotia', 'Cotia'],
  ['taboao da serra', 'Taboão da Serra'],
  ['campinas', 'Campinas'],
  ['jundiai', 'Jundiaí'],
  ['sorocaba', 'Sorocaba'],
  ['santos', 'Santos'],
  ['sao jose dos campos', 'São José dos Campos'],
  ['ribeirao preto', 'Ribeirão Preto'],
  ['sao carlos', 'São Carlos'],
  ['piracicaba', 'Piracicaba'],
  ['bauru', 'Bauru'],
  ['indaiatuba', 'Indaiatuba'],
  ['hortolandia', 'Hortolândia'],
  ['grande sp', 'Grande São Paulo'],
  ['grande sao paulo', 'Grande São Paulo'],
]

// Lugares fora de SP (siglas de estados e nomes que aparecem nas vagas)
const UFS_FORA_SP = ['ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe', 'pi', 'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'to']
const LUGARES_FORA_SP = [
  'rio de janeiro', 'belo horizonte', 'curitiba', 'porto alegre', 'florianopolis', 'joinville', 'blumenau',
  'recife', 'salvador', 'fortaleza', 'brasilia', 'goiania', 'manaus', 'belem', 'natal', 'vitoria',
  'londrina', 'maringa', 'uberlandia', 'juiz de fora', 'campo grande', 'cuiaba', 'teresina', 'joao pessoa',
  'minas gerais', 'parana', 'santa catarina', 'rio grande do sul', 'bahia', 'pernambuco', 'ceara', 'goias',
  'distrito federal', 'espirito santo', 'amazonas',
  'argentina', 'mexico', 'chile', 'colombia', 'peru', 'uruguai', 'portugal', 'espanha', 'eua', 'usa',
  'estados unidos', 'canada', 'alemanha', 'irlanda', 'reino unido', 'londres', 'lisboa', 'exterior',
]

// Texto entre colchetes no começo do título ("[Híbrido / São Paulo, Brasil] Dev" → "Híbrido / São Paulo, Brasil").
export function trechoDeLocal(titulo: string) {
  return /^\s*\[([^\]]{1,120})\]/.exec(titulo)?.[1] ?? ''
}

function primeiraCidade(texto: string, lista: [string, string][]) {
  return lista.find(([termo]) => contemTermo(texto, termo))?.[1] ?? null
}

export function localDaVaga(vaga: { titulo: string; etiquetas: string[] }): Localidade {
  const trecho = trechoDeLocal(vaga.titulo)
  // Etiquetas valem para o local; o título fora dos colchetes não (ex.: "Engenheiro de Dados SP" é raro e ambíguo).
  const texto = `${trecho} | ${vaga.etiquetas.join(' | ')}`
  const t = normalizar(texto)

  const remoto = ['remoto', 'remota', 'remote', 'home office', 'anywhere', '100% remoto'].some((p) => contemTermo(t, p))
  const cidadeUmc = primeiraCidade(t, ALTO_TIETE)
  const cidadeSp = cidadeUmc ?? primeiraCidade(t, CIDADES_SP)
  const sp = !!cidadeSp || contemTermo(t, 'sp')
  // Siglas de estado só valem entre colchetes: nas etiquetas, "Go" é a linguagem, não Goiás.
  const trechoNorm = normalizar(trecho)
  const outroLugar =
    UFS_FORA_SP.some((uf) => new RegExp(`(^|[/\\-–,(\\s])${uf}($|[)\\s,/])`).test(trechoNorm)) ||
    LUGARES_FORA_SP.some((l) => contemTermo(t, l))

  const rotulo = sp
    ? `${cidadeSp ?? 'São Paulo'}/SP`
    : outroLugar
      ? limparRotulo(trecho) || 'Fora de SP'
      : remoto
        ? 'Remoto'
        : 'Local não informado'

  return { remoto, sp, pertoDaUmc: !!cidadeUmc, outroLugar, rotulo }
}

// "Híbrido / Joinville/SC" → "Joinville/SC"; corta em 40 letras.
function limparRotulo(trecho: string) {
  const semModalidade = trecho
    .replace(/(h[ií]brido|presencial|remoto|remote|home office)/gi, '')
    .replace(/^[\s/\-–|,]+|[\s/\-–|,]+$/g, '')
    .replace(/^em\s+/i, '')
    .trim()
  return semModalidade.length > 40 ? `${semModalidade.slice(0, 39)}…` : semModalidade
}

// A vaga entra no filtro de localidade?
// "Remotas e no estado de SP" aceita vagas remotas (de qualquer lugar) e as que citam SP,
// mesmo que também citem outra cidade ("Belo Horizonte ou São Paulo"). Local não informado fica de fora.
export function vagaNoLocal(vaga: { titulo: string; etiquetas: string[] }, filtro: FiltroLocal) {
  if (filtro === 'todas') return true
  const local = localDaVaga(vaga)
  if (filtro === 'remoto') return local.remoto
  if (filtro === 'sp') return local.sp
  return local.remoto || local.sp
}
