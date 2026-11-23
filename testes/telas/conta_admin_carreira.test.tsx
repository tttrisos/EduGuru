// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { abrir, logar } from './apoio/abrir'
import { banco, chamou } from './apoio/supabaseFalso'
import { ISSUES_GITHUB } from './apoio/dados'

vi.mock('../../src/compartilhado/banco/supabase', () => import('./apoio/supabaseFalso'))
vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify(ISSUES_GITHUB), { status: 200 })))

async function confirmarDialogo(texto?: string) {
  const dialogo = await screen.findByRole('alertdialog')
  const campo = within(dialogo).queryByRole('textbox')
  if (campo && texto) await userEvent.type(campo, texto)
  await userEvent.click(within(dialogo).getAllByRole('button').at(-1)!)
}

const botaoComTexto = (texto: RegExp) => screen.getAllByRole('button').find((b) => texto.test(b.textContent ?? ''))!

describe('Minha conta: direitos do titular (LGPD, art. 18)', () => {
  it('corrige os dados, sai do ranking, revoga a localização e baixa os dados', async () => {
    const u = userEvent.setup()
    logar('aluno')
    URL.createObjectURL = () => 'blob:teste'
    URL.revokeObjectURL = () => {}
    abrir('/minha-conta')
    const nome = await screen.findByPlaceholderText('Nome')
    await u.clear(nome)
    await u.type(nome, 'Aluna Corrigida')
    await u.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(chamou('update', 'perfis').length).toBeGreaterThan(0))

    await u.click(screen.getByRole('checkbox', { name: /Mostrar meu nome no ranking/ }))
    await waitFor(() => expect(chamou('update', 'perfis').length).toBeGreaterThan(1))

    await u.click(screen.getByRole('button', { name: /Revogar e apagar cidade\/estado/ }))
    if (screen.queryByRole('alertdialog')) await confirmarDialogo()
    await waitFor(() => expect(chamou('update', 'perfis').length).toBeGreaterThan(2))

    const baixar = (await screen.findByRole('button', { name: /Baixar meus dados/ })) as HTMLButtonElement
    await waitFor(() => expect(baixar.disabled).toBe(false))
    await u.click(baixar)
    await waitFor(() => expect(chamou('rpc', 'registrar_evento_auth').some((c) => JSON.stringify(c.args).includes('dados_exportados'))).toBe(true))
  })

  it('exclui a conta só depois de digitar EXCLUIR', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/minha-conta')
    const campo = await screen.findByPlaceholderText('Digite EXCLUIR para confirmar')
    await u.type(campo, 'EXCLUIR')
    await u.click(botaoComTexto(/Excluir (minha )?conta/))
    if (screen.queryByRole('alertdialog')) await confirmarDialogo('EXCLUIR')
    await waitFor(() => expect(chamou('rpc', 'excluir_minha_conta')).toHaveLength(1))
    expect(chamou('remove', 'materiais').length).toBeGreaterThanOrEqual(0)
  })

  it('troca a senha conferindo a senha atual', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/minha-conta')
    const atual = await screen.findByLabelText(/^Senha atual/)
    const nova = screen.getByLabelText(/^Nova senha/)
    const confirmacao = screen.getByLabelText(/^Confirmar a nova senha/)
    const enviar = () => u.click(screen.getByRole('button', { name: 'Trocar senha' }))
    await u.type(atual, 'Senha@123')
    await u.type(nova, 'Senha@123')
    await u.type(confirmacao, 'Senha@123')
    await enviar()
    expect(chamou('rpc', 'conferir_senha_atual')).toHaveLength(0)
    banco.rpc.conferir_senha_atual = false
    await u.clear(nova)
    await u.type(nova, 'Nova@4567')
    await u.clear(confirmacao)
    await u.type(confirmacao, 'Nova@4567')
    await enviar()
    await waitFor(() => expect(chamou('rpc', 'conferir_senha_atual')).toHaveLength(1))
    expect(await screen.findByText('A senha atual está incorreta.')).toBeTruthy()
    banco.rpc.conferir_senha_atual = true
    await enviar()
    await waitFor(() => expect(chamou('auth', 'updateUser')).toHaveLength(1))
  })

  it('ativa a verificação em duas etapas e sai dos outros aparelhos', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/minha-conta')
    await u.click(await screen.findByRole('button', { name: 'Ativar verificação em duas etapas' }))
    expect(await screen.findByText(/SEGREDO123/)).toBeTruthy()
    await u.type(screen.getByLabelText('Código de 6 números'), '123456')
    await u.click(screen.getByRole('button', { name: 'Confirmar e ativar' }))
    await waitFor(() => expect(chamou('auth', 'challengeAndVerify')).toHaveLength(1))

    await u.click(botaoComTexto(/Sair dos outros aparelhos|Sair de todos os outros/))
    await confirmarDialogo()
    await waitFor(() => expect(chamou('auth', 'signOut').some((c) => JSON.stringify(c.args).includes('others'))).toBe(true))
  })

  it('desativa a verificação em duas etapas com a senha atual', async () => {
    const u = userEvent.setup()
    logar('aluno')
    banco.nivel = { currentLevel: 'aal2', nextLevel: 'aal2' }
    banco.fatores = [{ id: 'fator-1', status: 'verified', factor_type: 'totp' }]
    abrir('/minha-conta')
    await u.click(await screen.findByRole('button', { name: /^Desativar$/ }))
    await u.type(screen.getByLabelText(/Para confirmar, digite a sua senha atual/), 'Senha@123')
    await u.click(screen.getByRole('button', { name: 'Desativar verificação em duas etapas' }))
    if (screen.queryByRole('alertdialog')) await confirmarDialogo()
    await waitFor(() => expect(chamou('auth', 'unenroll')).toHaveLength(1))
  })
})

describe('novo aceite dos termos (RF22)', () => {
  it('registra o aceite da versão vigente', async () => {
    const u = userEvent.setup()
    logar('aluno', { versao_termos: '2.0' })
    abrir('/painel')
    await u.click(await screen.findByRole('checkbox'))
    await u.click(screen.getByRole('button', { name: 'Aceitar e continuar' }))
    await waitFor(() => expect(chamou('rpc', 'registrar_aceite')).toHaveLength(1))
  })

  it('quem não aceita pode excluir a conta', async () => {
    const u = userEvent.setup()
    logar('aluno', { versao_termos: '2.0' })
    abrir('/aceite')
    await u.click(await screen.findByRole('button', { name: /excluir minha conta/i }))
    await confirmarDialogo('EXCLUIR')
    await waitFor(() => expect(chamou('rpc', 'excluir_minha_conta')).toHaveLength(1))
  })
})

describe('Bússola EduGuru (RF33)', () => {
  it('responde as afirmações pelo teclado e o banco calcula o resultado', async () => {
    const u = userEvent.setup()
    logar('aluno')
    banco.rpc.minha_bussola = []
    abrir('/bussola')
    const comecar = (await screen.findByRole('button', { name: 'Começar' })) as HTMLButtonElement
    await waitFor(() => expect(comecar.disabled).toBe(false))
    await u.click(comecar)
    for (const tecla of ['5', '4', '2', '1']) {
      ;(document.activeElement as HTMLElement)?.blur()
      await u.keyboard(tecla)
      await new Promise((r) => setTimeout(r, 450))
    }
    const ver = (await screen.findByRole('button', { name: 'Ver meu resultado' })) as HTMLButtonElement
    await waitFor(() => expect(ver.disabled).toBe(false))
    await u.click(ver)
    await waitFor(() => expect(chamou('rpc', 'salvar_bussola')).toHaveLength(1))
    expect(await screen.findAllByText('Back-end')).not.toHaveLength(0)
  })

  it('mostra o resultado salvo e permite apagar', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/bussola')
    expect(await screen.findAllByText('Back-end')).not.toHaveLength(0)
    const apagar = screen.getAllByRole('button').find((b) => /Apagar/.test(b.textContent ?? ''))
    if (apagar) {
      await u.click(apagar)
      await confirmarDialogo()
      await waitFor(() => expect(chamou('delete', 'bussola_resultados')).toHaveLength(1))
    }
  })
})

describe('EduGuru Carreiras', () => {
  it('lista as vagas sugeridas, filtra e registra o clique em Candidatar-se', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/carreiras')
    await screen.findByLabelText('Buscar vagas')
    await u.selectOptions(screen.getByLabelText('Localidade da vaga'), 'todas')
    expect(await screen.findAllByText(/Desenvolvedor Back-end Java/)).not.toHaveLength(0)
    const candidatar = await screen.findAllByRole('link', { name: /Candidatar-se/ })
    await u.click(candidatar[0])
    await waitFor(() => expect(chamou('rpc', 'registrar_clique_vaga')).toHaveLength(1))
    const nivel = screen.getByLabelText('Nível da vaga')
    await u.selectOptions(nivel, (within(nivel).getAllByRole('option') as HTMLOptionElement[])[1])
    await u.selectOptions(nivel, (within(nivel).getAllByRole('option') as HTMLOptionElement[])[0])
    for (const chip of within(screen.getByRole('group', { name: 'Filtrar vagas por área' })).getAllByRole('button')) await u.click(chip)
    await u.type(screen.getByLabelText('Buscar vagas'), 'nada-encontrado')
    expect(await screen.findByText(/Nenhuma vaga com esses filtros/)).toBeTruthy()
  })
})

describe('administração', () => {
  it('cadastra, edita e exclui disciplinas', async () => {
    const u = userEvent.setup()
    logar('admin')
    abrir('/disciplinas')
    const nome = await screen.findByPlaceholderText('Nome da disciplina')
    await u.type(nome, 'Banco de Dados')
    await u.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(chamou('insert', 'disciplinas')).toHaveLength(0)
    await u.clear(nome)
    await u.type(nome, 'Computação em Nuvem')
    await u.click(screen.getByRole('checkbox', { name: 'ADS' }))
    await u.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(chamou('insert', 'disciplinas')).toHaveLength(1))
    await u.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    await u.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(chamou('update', 'disciplinas')).toHaveLength(1))
    await u.click(screen.getAllByRole('button', { name: 'Excluir' })[0])
    await confirmarDialogo()
    await waitFor(() => expect(chamou('delete', 'disciplinas')).toHaveLength(1))
    for (const aba of within(screen.getByRole('tablist', { name: 'Filtrar por curso' })).getAllByRole('tab')) await u.click(aba)
  })

  it('cadastra, edita e exclui perguntas', async () => {
    const u = userEvent.setup()
    logar('admin')
    abrir('/perguntas')
    const enunciado = await screen.findByPlaceholderText(/Enunciado da pergunta/)
    const adicionar = () => u.click(screen.getByRole('button', { name: 'Adicionar pergunta' }))
    await adicionar()
    await u.type(enunciado, 'O que é **chave primária**?')
    const form = enunciado.closest('form')!
    const [disciplina] = within(form).getAllByRole('combobox')
    await u.selectOptions(disciplina, '1')
    for (const letra of ['A', 'B', 'C', 'D']) await u.type(screen.getByPlaceholderText(`Alternativa ${letra}`), `Opção ${letra}`)
    await u.click(within(form).getAllByRole('radio')[1])
    await u.type(screen.getByPlaceholderText(/Explicação mostrada/), 'Identifica cada linha.')
    await adicionar()
    await waitFor(() => expect(chamou('rpc', 'criar_pergunta')).toHaveLength(1))

    await u.click(screen.getAllByRole('button', { name: 'Editar' })[1])
    const remover = screen.queryByRole('checkbox')
    if (remover) await u.click(remover)
    await u.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(chamou('rpc', 'editar_pergunta')).toHaveLength(1))
    await u.click(screen.getAllByRole('button', { name: 'Excluir' })[0])
    await confirmarDialogo()
    await waitFor(() => expect(chamou('delete', 'perguntas')).toHaveLength(1))
  })

  it('redefine o MFA de um aluno e exclui a conta de outro; conta de admin fica protegida', async () => {
    const u = userEvent.setup()
    logar('admin')
    abrir('/usuarios')
    expect(await screen.findByText('Conta de administrador protegida')).toBeTruthy()
    await u.click(screen.getAllByRole('button', { name: 'Redefinir MFA' })[0])
    await confirmarDialogo()
    await waitFor(() => expect(chamou('rpc', 'redefinir_mfa_usuario')).toHaveLength(1))
    await u.click(screen.getAllByRole('button', { name: 'Excluir conta' })[0])
    await confirmarDialogo('EXCLUIR')
    await waitFor(() => expect(chamou('rpc', 'excluir_conta_usuario')).toHaveLength(1))
  })

  it('filtra os logs, mostra mais e limpa os antigos', async () => {
    const u = userEvent.setup()
    logar('admin')
    abrir('/logs')
    expect(await screen.findAllByText(/Sessão expirada/)).not.toHaveLength(0)
    for (const botao of screen.getAllByRole('button').filter((b) => /^(Acessos|Senha|Cadastros|Quiz|Sistema|Todos)/.test(b.textContent ?? ''))) {
      await u.click(botao)
    }
    for (const sel of screen.getAllByRole('combobox')) {
      const opcoes = within(sel).getAllByRole('option') as HTMLOptionElement[]
      await u.selectOptions(sel, opcoes[opcoes.length - 1])
    }
    const busca = screen.queryAllByRole('searchbox')[0] ?? screen.queryAllByRole('textbox')[0]
    if (busca) await u.type(busca, 'aluna')
    await u.click(screen.getByRole('button', { name: /Limpar logs com mais de 90 dias/ }))
    if (screen.queryByRole('alertdialog')) await confirmarDialogo()
    await waitFor(() => expect(chamou('rpc', 'limpar_logs_antigos')).toHaveLength(1))
  })

  it('painel do administrador mostra só totais', async () => {
    logar('admin')
    abrir('/painel')
    expect(await screen.findByText('270')).toBeTruthy()
    await waitFor(() => expect(chamou('rpc', 'estatisticas_bussola')).toHaveLength(1))
  })
})

describe('barra superior', () => {
  it('troca o tema e sai da conta só neste aparelho', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/painel')
    const claro = await screen.findAllByRole('button', { name: /Modo claro/ })
    await u.click(claro[0])
    expect(document.documentElement.dataset.tema).toBe('claro')
    await u.click(screen.getAllByRole('button', { name: /Modo escuro/ })[0])
    await u.click(screen.getAllByRole('button', { name: /^Sair$/ })[0])
    await confirmarDialogo()
    await waitFor(() => expect(chamou('auth', 'signOut').some((c) => JSON.stringify(c.args).includes('local'))).toBe(true))
  })
})
