// ============================================================
// compartilhado/utilitarios/filtroLogs.ts
// FILTROS DOS REGISTROS DE ATIVIDADE (logs), sem tela. Usado em dois lugares:
// - administracao/Logs.tsx (admin): vira filtros da consulta ao banco (categoria, período, e-mail, tabela);
// - conta/RegistrosAtividade.tsx (Minha conta): filtra no navegador a lista do próprio usuário.
// Testes: testes/compartilhado/.
// ============================================================

import { semAcento } from '../../funcionalidades/materiais/filtroMateriais'
import { ROTULO_ACAO } from '../banco/log'
import type { LogAuditoria } from '../tipos'

export type Categoria = 'todos' | 'acessos' | 'senha' | 'alteracoes' | 'quiz' | 'sistema'

// Cada categoria reúne as ações (códigos gravados pelo banco) de um mesmo assunto.
export const CATEGORIAS_LOG: { valor: Categoria; rotulo: string; acoes: string[] | null }[] = [
  { valor: 'todos', rotulo: 'Todos', acoes: null },
  {
    valor: 'acessos',
    rotulo: 'Acessos',
    acoes: [
      'login', 'login_falhou', 'logout', 'sessoes_encerradas', 'aparelhos_esquecidos',
      'codigo_email_enviado', 'codigo_email_confirmado', 'codigo_email_errado',
      'mfa_ativado', 'mfa_desativado', 'mfa_falhou', 'mfa_bloqueado', 'mfa_redefinido',
    ],
  },
  {
    valor: 'senha',
    rotulo: 'Senha',
    acoes: ['redefinicao_senha_solicitada', 'senha_redefinida', 'senha_alterada', 'senha_atual_incorreta'],
  },
  { valor: 'alteracoes', rotulo: 'Cadastros e alterações', acoes: ['criar', 'editar', 'excluir'] },
  { valor: 'quiz', rotulo: 'Quiz', acoes: ['quiz_finalizado'] },
  { valor: 'sistema', rotulo: 'Sistema', acoes: ['limpeza_automatica', 'limpeza_manual', 'conta_excluida'] },
]

// Os logs ficam guardados 90 dias; por isso o maior período é 90.
export const PERIODOS_LOG = [
  { dias: 1, rotulo: 'Últimas 24 horas' },
  { dias: 7, rotulo: 'Últimos 7 dias' },
  { dias: 30, rotulo: 'Últimos 30 dias' },
  { dias: 90, rotulo: 'Últimos 90 dias (tudo)' },
]

export type FiltroLogs = { categoria: Categoria; dias: number; busca: string }

export const FILTRO_INICIAL: FiltroLogs = { categoria: 'todos', dias: 90, busca: '' }

export function acoesDaCategoria(categoria: Categoria): string[] | null {
  return CATEGORIAS_LOG.find((c) => c.valor === categoria)?.acoes ?? null
}

export function categoriaDaAcao(acao: string): Categoria | null {
  return CATEGORIAS_LOG.find((c) => c.acoes?.includes(acao))?.valor ?? null
}

// Data (ISO) a partir da qual os logs entram no período escolhido.
export function inicioDoPeriodo(dias: number, agora: Date) {
  return new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000).toISOString()
}

// Texto em que a busca procura: nome da ação, tabela, e-mail e aparelho.
export function textoDoLog(log: LogAuditoria) {
  const aparelho = typeof log.detalhes?.aparelho === 'string' ? log.detalhes.aparelho : ''
  return semAcento([ROTULO_ACAO[log.acao] ?? log.acao, log.acao, log.tabela ?? '', log.usuario_email ?? '', aparelho].join(' '))
}

// Filtro no navegador (Minha conta).
export function filtrarLogs(lista: LogAuditoria[], filtro: FiltroLogs, agora: Date) {
  const acoes = acoesDaCategoria(filtro.categoria)
  const inicio = inicioDoPeriodo(filtro.dias, agora)
  const busca = semAcento(filtro.busca.trim())
  return lista.filter(
    (log) =>
      (!acoes || acoes.includes(log.acao)) &&
      log.criado_em >= inicio &&
      (!busca || textoDoLog(log).includes(busca)),
  )
}

// Quantos logs há em cada categoria (para os números nos botões).
export function totaisPorCategoria(lista: LogAuditoria[]) {
  const totais = Object.fromEntries(CATEGORIAS_LOG.map((c) => [c.valor, 0])) as Record<Categoria, number>
  for (const log of lista) {
    totais.todos++
    const categoria = categoriaDaAcao(log.acao)
    if (categoria) totais[categoria]++
  }
  return totais
}
