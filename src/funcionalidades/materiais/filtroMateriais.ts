// Filtro dos materiais (mesma regra da função motivo_bloqueio_material, script 15).
// Devolve o motivo do bloqueio, ou null se o material pode ser enviado.

export const DOMINIOS_PERMITIDOS = [
  'youtube.com', 'youtu.be', 'github.com', 'gitlab.com', 'developer.mozilla.org',
  'w3schools.com', 'wikipedia.org', 'stackoverflow.com', 'freecodecamp.org',
  'khanacademy.org', 'alura.com.br', 'dio.me', 'rocketseat.com.br', 'udemy.com',
  'coursera.org', 'edx.org', 'cursoemvideo.com', 'devmedia.com.br', 'geeksforgeeks.org',
  'microsoft.com', 'react.dev', 'typescriptlang.org', 'python.org', 'postgresql.org',
  'supabase.com', 'git-scm.com', 'umc.br', 'scielo.br', 'scielo.org', 'gov.br',
]

const TERMOS_PROIBIDOS = new RegExp(
  '\\b(porn|porno|pornografia|xxx|nude|nudes|putaria|hentai|onlyfans|' +
    'cocaina|maconha|crack|crackeado|keygen|torrent|warez|pirata|pirataria|' +
    'cassino|apostas|bet|tigrinho|arma de fogo|explosivos?|pedofilia|nazismo|terrorismo|' +
    'porra|caralho|merda|puta|buceta|foder|fdp|vtnc)\\b',
)

const CPF = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/
const TELEFONE = /\(?\d{2}\)?\s?9\d{4}-?\d{4}/

export const MOTIVO_TERMOS =
  'O material tem termos impróprios ou ligados a crimes (pirataria, drogas, apostas, conteúdo adulto, ofensas).'
export const MOTIVO_DADOS_PESSOAIS =
  'Não coloque dados pessoais (CPF, e-mail ou telefone) no material. Isso protege você e os colegas (LGPD).'
export const MOTIVO_HTTPS = 'O link precisa começar com https:// e não pode ter espaços.'
export const MOTIVO_DOMINIO =
  'Este site não está na lista de sites permitidos (YouTube, GitHub, MDN, Alura, Udemy, Coursera, entre outros).'

export function semAcento(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// "https://www.youtube.com/watch?v=1" -> "youtube.com"
export function dominioDoLink(link: string) {
  const resultado = /^https:\/\/([^/:?#]+)/i.exec(link)
  return resultado ? resultado[1].toLowerCase().replace(/^www\./, '') : ''
}

export function dominioPermitido(dominio: string) {
  return DOMINIOS_PERMITIDOS.some((d) => dominio === d || dominio.endsWith(`.${d}`))
}

type DadosMaterial = { titulo: string; descricao?: string; link?: string; arquivoNome?: string }

export function motivoBloqueio({ titulo, descricao = '', link = '', arquivoNome = '' }: DadosMaterial) {
  const texto = semAcento([titulo, descricao, arquivoNome].join(' '))
  // "_", "." e "-" viram espaço para pegar nomes como "resumo_keygen.pdf".
  const separado = (s: string) => s.replace(/[_.-]/g, ' ')

  if (TERMOS_PROIBIDOS.test(separado(texto)) || TERMOS_PROIBIDOS.test(separado(semAcento(link)))) return MOTIVO_TERMOS
  if (CPF.test(texto) || EMAIL.test(texto) || TELEFONE.test(texto)) return MOTIVO_DADOS_PESSOAIS

  if (link.trim()) {
    if (!/^https:\/\/\S+$/i.test(link.trim())) return MOTIVO_HTTPS
    if (!dominioPermitido(dominioDoLink(link.trim()))) return MOTIVO_DOMINIO
  }
  return null
}
