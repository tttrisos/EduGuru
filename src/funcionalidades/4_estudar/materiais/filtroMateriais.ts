// ============================================================
// funcionalidades/4_estudar/materiais/filtroMateriais.ts
// AJUDAS DO FILTRO DE MATERIAIS: textos de links e o formato da resposta do banco.
// O filtro em si (sites permitidos, termos bloqueados, dados pessoais) fica SÓ no banco,
// em tabelas que o admin edita: supabase/22 (verificar_material, filtro_sites, filtro_termos).
// Testes: testes/4_estudar/materiais/.
// ============================================================

// Resposta de verificar_material(): motivo para recusar (ou null) e se o site ainda não está na lista.
export type ResultadoFiltro = { motivo: string | null; site_novo: boolean }

// Motivo gravado pelo banco quando o link é de um site fora da lista (supabase/22).
export const MOTIVO_SITE_NOVO = 'Site novo: aguardando a análise da equipe.'

export function ehSiteNovo(motivoModeracao: string | null | undefined) {
  return motivoModeracao === MOTIVO_SITE_NOVO
}

export function semAcento(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// "https://www.youtube.com/watch?v=1" -> "youtube.com"
export function dominioDoLink(link: string) {
  const resultado = /^https:\/\/([^/:?#]+)/i.exec(link)
  return resultado ? resultado[1].toLowerCase().replace(/^www\./, '') : ''
}

// Texto curto para exibir um link (o href continua completo):
// "https://pt.khanacademy.org/computing/html-css?utm_source=x&gclid=y" -> "pt.khanacademy.org/computing/html-css"
// Tira o "www.", os parâmetros de rastreamento e o "#"; mantém só o "v=" do YouTube. Corta em 70 letras.
export function linkCurto(link: string, limite = 70) {
  let texto: string
  try {
    const url = new URL(link)
    const video = url.searchParams.get('v')
    texto = url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/$/, '') + (video ? `?v=${video}` : '')
  } catch {
    texto = link
  }
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto
}
