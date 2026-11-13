import { Bot, Bug, Compass, Database, Layers, type LucideIcon, Palette, Server, ShieldCheck, Users } from 'lucide-react'
import { normalizar } from './vagas'

// Ícone de cada área de carreira, pelo nome (sem acento e sem diferenciar maiúsculas).
// Áreas novas cadastradas pelo admin usam a bússola.
const ICONES: [string, LucideIcon][] = [
  ['back-end', Server],
  ['front-end', Palette],
  ['full stack', Layers],
  ['dados', Database],
  ['infraestrutura', ShieldCheck],
  ['seguranca', ShieldCheck],
  ['qualidade', Bug],
  ['testes', Bug],
  ['gestao', Users],
  ['produto', Users],
  ['inteligencia artificial', Bot],
]

export function iconeDaArea(nome: string): LucideIcon {
  const n = normalizar(nome)
  return ICONES.find(([termo]) => n.includes(termo))?.[1] ?? Compass
}
