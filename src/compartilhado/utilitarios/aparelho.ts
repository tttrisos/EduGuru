// A ordem importa: o Edge e o Opera também dizem "Chrome"; o Chrome também diz "Safari".
const NAVEGADORES: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
]

const SISTEMAS: [RegExp, string][] = [
  [/Android/, 'Android'],
  [/iPhone|iPod/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/CrOS/, 'Chromebook'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'Mac'],
  [/Linux/, 'Linux'],
]

export function descreverAparelho(userAgent: string): string {
  const navegador = NAVEGADORES.find(([regra]) => regra.test(userAgent))?.[1] ?? 'Navegador desconhecido'
  const sistema = SISTEMAS.find(([regra]) => regra.test(userAgent))?.[1]
  return sistema ? `${navegador} no ${sistema}` : navegador
}
