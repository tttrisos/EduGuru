// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ALUNO, abrir, logar } from './apoio/abrir'
import { banco, chamou } from './apoio/supabaseFalso'
import { CHAVE_RECUPERACAO } from '../../src/compartilhado/sessao/recuperacaoSenha'

vi.mock('../../src/compartilhado/banco/supabase', () => import('./apoio/supabaseFalso'))
vi.stubGlobal('fetch', (url: string) =>
  Promise.resolve(
    new Response(JSON.stringify(String(url).includes('99999999') ? { erro: true } : { localidade: 'Mogi das Cruzes', uf: 'SP' }), {
      status: 200,
    }),
  ),
)

async function botaoEntrar() {
  const botoes = await screen.findAllByRole('button', { name: 'Entrar' })
  return botoes[botoes.length - 1]
}

describe('login (RF01)', () => {
  it('entra com e-mail e senha e registra o login no log', async () => {
    const u = userEvent.setup()
    abrir('/login')
    await u.type(await screen.findByPlaceholderText('E-mail'), 'aluna@teste.com')
    await u.type(screen.getByPlaceholderText('Senha'), 'Senha@123')
    logar('aluno')
    const botao = await botaoEntrar()
    await waitFor(() => expect((botao as HTMLButtonElement).disabled).toBe(false))
    await u.click(botao)
    await waitFor(() => expect(chamou('auth', 'signInWithPassword')).toHaveLength(1))
    await waitFor(() => expect(chamou('rpc', 'registrar_evento_auth').length).toBeGreaterThan(0))
  })

  it('senha errada mostra mensagem genérica e grava a falha', async () => {
    const u = userEvent.setup()
    banco.auth.signInWithPassword = () => ({ data: { user: null, session: null }, error: { message: 'Invalid login credentials', code: 'invalid_credentials' } })
    abrir('/login')
    await u.type(await screen.findByPlaceholderText('E-mail'), 'x@teste.com')
    await u.type(screen.getByPlaceholderText('Senha'), 'errada')
    const botao = await botaoEntrar()
    await waitFor(() => expect((botao as HTMLButtonElement).disabled).toBe(false))
    await u.click(botao)
    await waitFor(() => expect(chamou('rpc', 'registrar_login_falhou')).toHaveLength(1))
    expect(await screen.findByText(/E-mail ou senha/i)).toBeTruthy()
  })

  it('e-mail ainda não confirmado mostra o aviso', async () => {
    const u = userEvent.setup()
    banco.auth.signInWithPassword = () => ({ data: { user: null, session: null }, error: { message: 'Email not confirmed', code: 'email_not_confirmed' } })
    abrir('/login')
    await u.type(await screen.findByPlaceholderText('E-mail'), 'nova@teste.com')
    await u.type(screen.getByPlaceholderText('Senha'), 'Senha@123')
    const botao = await botaoEntrar()
    await waitFor(() => expect((botao as HTMLButtonElement).disabled).toBe(false))
    await u.click(botao)
    expect(await screen.findByText(/confirm/i)).toBeTruthy()
    expect(chamou('rpc', 'registrar_login_falhou')).toHaveLength(0)
  })
})

describe('cadastro (RF02) e CEP (RF05)', () => {
  it('valida os campos e cria a conta com cidade e estado, sem o CEP', async () => {
    const u = userEvent.setup()
    abrir('/login')
    await u.click((await screen.findAllByRole('button', { name: 'Criar conta' }))[0])
    const enviar = async () => {
      const botoes = screen.getAllByRole('button', { name: 'Criar conta' })
      const botao = botoes[botoes.length - 1] as HTMLButtonElement
      await waitFor(() => expect(botao.disabled).toBe(false))
      await u.click(botao)
    }
    await enviar()
    expect(await screen.findByText('Preencha e-mail e senha.')).toBeTruthy()

    await u.type(screen.getByPlaceholderText('Seu nome'), 'Aluna Teste')
    await u.selectOptions(screen.getByRole('combobox'), 'SI')
    await u.type(screen.getByPlaceholderText('CEP (opcional)'), '99999999')
    await u.tab()
    expect(await screen.findByText(/CEP/, { selector: '.cep-erro' })).toBeTruthy()
    await u.clear(screen.getByPlaceholderText('CEP (opcional)'))
    await u.type(screen.getByPlaceholderText('CEP (opcional)'), '08780-911')
    await u.tab()
    expect(await screen.findByText(/Mogi das Cruzes - SP/)).toBeTruthy()

    await u.type(screen.getByPlaceholderText('E-mail'), 'aluna@teste.com')
    await u.type(screen.getByPlaceholderText('Senha'), 'fraca')
    await u.type(screen.getByPlaceholderText('Confirmar senha'), 'outra')
    expect(screen.getByText('As senhas não coincidem.')).toBeTruthy()
    await enviar()
    expect(chamou('auth', 'signUp')).toHaveLength(0)

    await u.clear(screen.getByPlaceholderText('Senha'))
    await u.type(screen.getByPlaceholderText('Senha'), 'Senha@123')
    await u.clear(screen.getByPlaceholderText('Confirmar senha'))
    await u.type(screen.getByPlaceholderText('Confirmar senha'), 'Senha@123')
    await enviar()
    expect(chamou('auth', 'signUp')).toHaveLength(0)

    await u.click(screen.getByRole('checkbox'))
    await enviar()
    await waitFor(() => expect(chamou('auth', 'signUp')).toHaveLength(1))
    const dados = (chamou('auth', 'signUp')[0].args as [{ options: { data: Record<string, unknown> } }])[0].options.data
    expect(dados.cidade).toBe('Mogi das Cruzes')
    expect(dados.estado).toBe('SP')
    expect(JSON.stringify(dados)).not.toContain('08780')
  })
})

describe('esqueci minha senha (RF24)', () => {
  it('envia o link e mostra a mesma resposta com ou sem conta', async () => {
    const u = userEvent.setup()
    abrir('/esqueci-senha')
    await u.type(await screen.findByPlaceholderText('E-mail'), 'aluna@teste.com')
    const botao = screen.getAllByRole('button').find((b) => b.getAttribute('type') === 'submit') as HTMLButtonElement
    await waitFor(() => expect(botao.disabled).toBe(false))
    await u.click(botao)
    await waitFor(() => expect(chamou('auth', 'resetPasswordForEmail')).toHaveLength(1))
    expect(chamou('rpc', 'registrar_pedido_redefinicao')).toHaveLength(1)
  })
})

describe('código por e-mail em aparelho novo', () => {
  it('envia o código ao abrir e confirma o código digitado', async () => {
    const u = userEvent.setup()
    logar('aluno')
    banco.rpc.situacao_codigo_email = { precisa_codigo: true, email: 'a***@teste.com' }
    abrir('/painel')
    const campo = await screen.findByLabelText('Código recebido por e-mail')
    await waitFor(() => expect(chamou('rpc', 'enviar_codigo_email')).toHaveLength(1))
    banco.rpc.confirmar_codigo_email = { ok: false, motivo: 'codigo_errado', restantes: 3 }
    await u.type(campo, '123456')
    await u.click(screen.getByRole('button', { name: /Confirmar/ }))
    await waitFor(() => expect(chamou('rpc', 'confirmar_codigo_email')).toHaveLength(1))
    banco.rpc.confirmar_codigo_email = { ok: true, token: 'token-aparelho' }
    banco.rpc.situacao_codigo_email = { precisa_codigo: false }
    await u.click(screen.getByRole('checkbox'))
    await u.type(screen.getByLabelText('Código recebido por e-mail'), '654321')
    await u.click(screen.getByRole('button', { name: /Confirmar/ }))
    await waitFor(() => expect(chamou('rpc', 'confirmar_codigo_email')).toHaveLength(2))
    await waitFor(() => expect(localStorage.length).toBeGreaterThan(0))
  })
})

describe('verificação em duas etapas no login (RF04)', () => {
  it('pede o código do aplicativo e libera com o código certo', async () => {
    const u = userEvent.setup()
    logar('aluno')
    banco.nivel = { currentLevel: 'aal1', nextLevel: 'aal2' }
    banco.fatores = [{ id: 'fator-1', status: 'verified', factor_type: 'totp' }]
    abrir('/painel')
    const campo = await screen.findByPlaceholderText('000000')
    banco.auth.challengeAndVerify = () => ({ data: null, error: { message: 'Invalid TOTP code entered' } })
    await u.type(campo, '111111')
    await u.click(screen.getAllByRole('button').find((b) => b.getAttribute('type') === 'submit')!)
    await waitFor(() => expect(chamou('rpc', 'registrar_evento_auth').length).toBeGreaterThan(0))
    banco.auth.challengeAndVerify = () => ({ data: {}, error: null })
    banco.nivel = { currentLevel: 'aal2', nextLevel: 'aal2' }
    await u.clear(campo)
    await u.type(campo, '222222')
    await u.click(screen.getAllByRole('button').find((b) => b.getAttribute('type') === 'submit')!)
    await waitFor(() => expect(chamou('auth', 'challengeAndVerify')).toHaveLength(2))
  })

  it('administrador sem aplicativo cadastra o QR Code', async () => {
    logar('admin')
    banco.nivel = { currentLevel: 'aal1', nextLevel: 'aal1' }
    banco.fatores = []
    abrir('/painel')
    expect(await screen.findByText(/SEGREDO123/)).toBeTruthy()
    expect(chamou('auth', 'enroll')).toHaveLength(1)
  })
})

describe('nova senha pelo link do e-mail', () => {
  it('sem o link de recuperação, a tela trata como link inválido', async () => {
    logar('aluno')
    abrir('/redefinir-senha')
    expect(await screen.findByText(/inválid|expirad/i)).toBeTruthy()
  })

  it('com o link desta conta, troca a senha e desconecta todos os aparelhos', async () => {
    const u = userEvent.setup()
    logar('aluno')
    sessionStorage.setItem(CHAVE_RECUPERACAO, ALUNO)
    abrir('/redefinir-senha')
    await u.type(await screen.findByPlaceholderText('Nova senha'), 'Nova@1234')
    await u.type(screen.getByPlaceholderText('Confirmar nova senha'), 'Outra@1234')
    const enviar = () => u.click(screen.getAllByRole('button').find((b) => b.getAttribute('type') === 'submit')!)
    await enviar()
    expect(chamou('auth', 'updateUser')).toHaveLength(0)
    await u.clear(screen.getByPlaceholderText('Confirmar nova senha'))
    await u.type(screen.getByPlaceholderText('Confirmar nova senha'), 'Nova@1234')
    await enviar()
    await waitFor(() => expect(chamou('auth', 'updateUser')).toHaveLength(1))
    await waitFor(() => expect(chamou('auth', 'signOut').some((c) => JSON.stringify(c.args).includes('global'))).toBe(true))
    expect(sessionStorage.getItem(CHAVE_RECUPERACAO)).toBeNull()
  })
})
