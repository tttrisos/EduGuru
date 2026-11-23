import { afterEach, beforeEach } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import Rotas from '../../../src/Rotas'
import { AuthProvider } from '../../../src/compartilhado/sessao/ContextoSessao'
import { DialogoProvider } from '../../../src/compartilhado/componentes/Dialogo'
import { VERSAO_TERMOS, type Perfil } from '../../../src/compartilhado/tipos'
import { banco, limparBanco } from './supabaseFalso'
import { carregarDados } from './dados'

// O jsdom não implementa rolagem nem som; as telas só chamam essas funções.
Element.prototype.scrollIntoView = () => {}
window.scrollTo = () => {}

// "Não sou um robô" falso: devolve um token na hora, sem carregar o script da Cloudflare.
window.turnstile = {
  render: (_el, opcoes) => {
    setTimeout(() => (opcoes.callback as (t: string) => void)('token-teste'), 0)
    return 'widget-teste'
  },
  reset: () => {},
  remove: () => {},
}

beforeEach(() => {
  limparBanco()
  localStorage.clear()
  sessionStorage.clear()
  window.location.hash = ''
})

afterEach(() => cleanup())

export const ALUNO = '11111111-1111-1111-1111-111111111111'
export const ADMIN = '22222222-2222-2222-2222-222222222222'

export function perfilDe(papel: 'aluno' | 'admin', extra: Partial<Perfil> = {}): Perfil {
  return {
    id: papel === 'admin' ? ADMIN : ALUNO,
    nome: papel === 'admin' ? 'Admin Teste' : 'Aluna Teste',
    papel,
    curso: 'SI',
    cidade: 'Mogi das Cruzes',
    estado: 'SP',
    consentimento_aceito: true,
    consentimento_em: '2026-11-01T10:00:00Z',
    versao_termos: VERSAO_TERMOS,
    aparecer_no_ranking: true,
    criado_em: '2026-11-01T10:00:00Z',
    ...extra,
  }
}

// Entra como aluno ou admin (sessão completa) com os dados de exemplo.
export function logar(papel: 'aluno' | 'admin' = 'aluno', extra: Partial<Perfil> = {}) {
  const perfil = perfilDe(papel, extra)
  banco.sessao = {
    user: { id: perfil.id, email: papel === 'admin' ? 'admin@teste.com' : 'aluna@teste.com', created_at: '2026-11-01T10:00:00Z' },
  }
  if (papel === 'admin') {
    banco.nivel = { currentLevel: 'aal2', nextLevel: 'aal2' }
    banco.fatores = [{ id: 'fator-1', status: 'verified', factor_type: 'totp' }]
  }
  carregarDados()
  banco.tabelas.perfis = [perfil]
  banco.rpc.situacao_codigo_email = { precisa_codigo: false }
  return perfil
}

// Abre o site inteiro (sessão, diálogos e rotas, como em principal.tsx) já na rota pedida.
export function abrir(rota: string) {
  window.location.hash = `#${rota}`
  return render(
    <AuthProvider>
      <DialogoProvider>
        <Rotas />
      </DialogoProvider>
    </AuthProvider>,
  )
}
