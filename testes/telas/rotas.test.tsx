// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { abrir, logar } from './apoio/abrir'
import { banco } from './apoio/supabaseFalso'
import { ISSUES_GITHUB } from './apoio/dados'

vi.mock('../../src/compartilhado/banco/supabase', () => import('./apoio/supabaseFalso'))
vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify(ISSUES_GITHUB), { status: 200 })))

describe('rotas e proteção de acesso', () => {
  it('página inicial abre sem login', async () => {
    abrir('/')
    expect(await screen.findAllByText(/EduGuru/)).not.toHaveLength(0)
  })

  it('Termo e Política abrem sem login', async () => {
    abrir('/termos')
    expect(await screen.findByRole('heading', { name: 'Termo de Aceite' })).toBeTruthy()
    abrir('/privacidade')
    expect(await screen.findByRole('heading', { name: /Política de Privacidade/ })).toBeTruthy()
  })

  it('tela protegida sem login manda para o login', async () => {
    abrir('/painel')
    expect(await screen.findAllByRole('button', { name: 'Entrar' })).not.toHaveLength(0)
  })

  it('aluno não entra nas telas de administrador', async () => {
    logar('aluno')
    abrir('/usuarios')
    expect(await screen.findByText('Acesso restrito')).toBeTruthy()
  })

  it('conta com termos de versão antiga vai para o novo aceite', async () => {
    logar('aluno', { versao_termos: '1.7' })
    abrir('/painel')
    expect(await screen.findByText(/Principais mudanças/)).toBeTruthy()
  })

  it('admin sem o código do aplicativo vai para a tela do MFA', async () => {
    logar('admin')
    banco.nivel = { currentLevel: 'aal1', nextLevel: 'aal2' }
    abrir('/painel')
    expect(await screen.findByText(/código/i, {}, { timeout: 3000 })).toBeTruthy()
  })

  const telasAluno = ['/painel', '/disciplinas', '/materiais', '/quiz', '/ranking', '/carreiras', '/bussola', '/minha-conta', '/perfil/33333333-3333-3333-3333-333333333333']
  for (const rota of telasAluno) {
    it(`aluno abre ${rota}`, async () => {
      logar('aluno')
      abrir(rota)
      expect(await screen.findAllByRole('button', { name: /Sair/ })).not.toHaveLength(0)
    })
  }

  const telasAdmin = ['/painel', '/materiais', '/perguntas', '/usuarios', '/logs', '/disciplinas', '/ranking', '/carreiras']
  for (const rota of telasAdmin) {
    it(`admin abre ${rota}`, async () => {
      logar('admin')
      abrir(rota)
      expect(await screen.findAllByRole('button', { name: /Sair/ })).not.toHaveLength(0)
    })
  }
})
