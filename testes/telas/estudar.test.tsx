// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { abrir, logar } from './apoio/abrir'
import { banco, chamou } from './apoio/supabaseFalso'

vi.mock('../../src/compartilhado/banco/supabase', () => import('./apoio/supabaseFalso'))

async function cartaoPronto(nome: RegExp) {
  const cartao = (await screen.findByRole('button', { name: nome })) as HTMLButtonElement
  await waitFor(() => expect(cartao.disabled).toBe(false))
  return cartao
}

async function confirmarDialogo(texto?: string) {
  const dialogo = await screen.findByRole('alertdialog')
  const campo = within(dialogo).queryByRole('textbox')
  if (campo && texto) await userEvent.type(campo, texto)
  await userEvent.click(within(dialogo).getAllByRole('button').at(-1)!)
}

describe('quiz (RF16, RF17, RF19)', () => {
  it('joga uma rodada inteira: acerta, usa a dica, erra e vê o resultado com o Guru', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/quiz')
    await u.type(await screen.findByLabelText('Buscar disciplina'), 'banco')
    await u.click(await cartaoPronto(/Banco de Dados/))
    await waitFor(() => expect(chamou('rpc', 'iniciar_quiz')).toHaveLength(1))

    // 1ª pergunta: tecla 1 escolhe a alternativa e Enter verifica.
    expect(await screen.findByText('RLS')).toBeTruthy()
    await u.click(screen.getByLabelText('Desligar o som'))
    ;(document.activeElement as HTMLElement).blur()
    await u.keyboard('2')
    await u.keyboard('1')
    await u.keyboard('{Enter}')
    await waitFor(() => expect(chamou('rpc', 'responder_pergunta')).toHaveLength(1))
    expect(await screen.findByText('+10')).toBeTruthy()
    ;(document.activeElement as HTMLElement).blur()
    await u.keyboard('{Enter}')

    // 2ª pergunta: dica 50/50, depois resposta errada.
    expect(await screen.findByText('Qual comando lê dados?')).toBeTruthy()
    await u.click(screen.getByRole('button', { name: /Usar dica 50\/50/ }))
    await waitFor(() => expect(chamou('rpc', 'pedir_dica')).toHaveLength(1))
    const alternativas = within(screen.getByRole('radiogroup', { name: 'Alternativas' })).getAllByRole('radio')
    await u.click(alternativas[1])
    await u.click(screen.getByRole('button', { name: /Verificar/ }))
    expect(await screen.findAllByText(/SELECT lê os dados/)).not.toHaveLength(0)
    await u.click(screen.getByRole('button', { name: 'Ver resultado' }))
    await waitFor(() => expect(chamou('rpc', 'finalizar_quiz')).toHaveLength(1))
    expect(await screen.findAllByText(/Guru/)).not.toHaveLength(0)
  })

  it('sair no meio da rodada pede confirmação', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/quiz')
    await u.click(await cartaoPronto(/Banco de Dados/))
    await u.click(await screen.findByLabelText('Sair do quiz'))
    await confirmarDialogo()
    expect(await screen.findByLabelText('Buscar disciplina')).toBeTruthy()
  })

  it('filtra as disciplinas pelo curso e pela busca', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/quiz')
    await cartaoPronto(/Banco de Dados/)
    const abas = within(screen.getByRole('tablist', { name: 'Filtrar por curso' })).getAllByRole('tab')
    for (const aba of abas) await u.click(aba)
    await u.type(screen.getByLabelText('Buscar disciplina'), 'xyz')
    expect(screen.getByText(/Nenhuma disciplina encontrada/)).toBeTruthy()
  })
})

describe('ranking (RF18)', () => {
  it('mostra o geral e troca para uma disciplina', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/ranking')
    expect(await screen.findByText('Aluno anônimo')).toBeTruthy()
    const selecao = screen.queryAllByRole('combobox')[0]
    if (selecao) await u.selectOptions(selecao, '1')
    await waitFor(() => expect(chamou('rpc', 'ranking').length).toBeGreaterThan(0))
  })
})

describe('materiais (RF08)', () => {
  it('valida e compartilha um link; site novo pede confirmação', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/materiais')
    const titulo = await screen.findByPlaceholderText('Ex.: Videoaula de JOIN no PostgreSQL')
    const enviar = () => u.click(screen.getByRole('button', { name: 'Compartilhar material' }))
    await enviar()
    expect(await screen.findByText(/Preencha o título/)).toBeTruthy()
    await u.type(titulo, 'Aula de JOIN')
    await enviar()
    expect(await screen.findAllByText(/Escolha a disciplina/)).not.toHaveLength(0)
    await u.selectOptions(within(titulo.closest('form')!).getByRole('combobox'), '1')
    await enviar()
    expect(await screen.findByText(/Informe um link OU anexe/)).toBeTruthy()

    await u.type(screen.getByPlaceholderText(/https:\/\/www.youtube.com/), 'https://youtube.com/watch?v=abc')
    await u.type(screen.getByPlaceholderText(/Explica LEFT JOIN/), 'Explica JOIN')
    banco.rpc.verificar_material = { motivo: 'Dados pessoais não são permitidos.', site_novo: false }
    await enviar()
    expect(await screen.findByText('Dados pessoais não são permitidos.')).toBeTruthy()

    banco.rpc.verificar_material = { motivo: null, site_novo: true }
    await enviar()
    await confirmarDialogo()
    await waitFor(() => expect(chamou('insert', 'materiais')).toHaveLength(1))
    expect(await screen.findByText(/site é novo/)).toBeTruthy()
  })

  it('anexa um arquivo PDF, que sobe para o armazenamento privado', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/materiais')
    const titulo = await screen.findByPlaceholderText('Ex.: Videoaula de JOIN no PostgreSQL')
    await u.type(titulo, 'Lista resolvida')
    await u.selectOptions(within(titulo.closest('form')!).getByRole('combobox'), '2')
    const entrada = titulo.closest('form')!.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(entrada, { target: { files: [new File(['x'.repeat(6 * 1024 * 1024)], 'grande.pdf', { type: 'application/pdf' })] } })
    expect(await screen.findAllByText(/MB/)).not.toHaveLength(0)
    fireEvent.change(entrada, { target: { files: [new File(['%PDF'], 'lista final.pdf', { type: 'application/pdf' })] } })
    await u.click(screen.getByRole('button', { name: 'Compartilhar material' }))
    await waitFor(() => expect(chamou('upload', 'materiais')).toHaveLength(1))
    expect(await screen.findByText(/Arquivos passam pela análise/)).toBeTruthy()
  })

  it('edita e exclui um material próprio', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/materiais')
    const editar = await screen.findAllByRole('button', { name: 'Editar' })
    await u.click(editar[0])
    await u.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(chamou('update', 'materiais')).toHaveLength(1))
    const excluir = screen.getAllByRole('button', { name: 'Excluir' })
    await u.click(excluir[excluir.length - 1])
    await confirmarDialogo()
    await waitFor(() => expect(chamou('delete', 'materiais')).toHaveLength(1))
  })

  it('perfil público de quem compartilhou e denúncia de material', async () => {
    const u = userEvent.setup()
    logar('aluno')
    abrir('/perfil/33333333-3333-3333-3333-333333333333')
    expect(await screen.findAllByText('Bruno C.')).not.toHaveLength(0)
    const denunciar = await screen.findAllByRole('button', { name: /Denunciar/ })
    await u.click(denunciar[0])
    const motivo = screen.queryAllByRole('combobox').at(-1)
    if (motivo) await u.selectOptions(motivo, (within(motivo).getAllByRole('option') as HTMLOptionElement[]).at(-1)!)
    const botoes = screen.getAllByRole('button').filter((b) => b.className.includes('btn-perigo'))
    await u.click(botoes[0])
    await waitFor(() => expect(chamou('rpc', 'denunciar_material')).toHaveLength(1))
  })
})

describe('materiais do administrador (RF27)', () => {
  it('modera: aprova, aprova e libera o site e recusa com motivo', async () => {
    const u = userEvent.setup()
    logar('admin')
    abrir('/materiais')
    const aprovar = await screen.findAllByRole('button', { name: 'Aprovar' })
    await u.click(aprovar[0])
    await waitFor(() => expect(chamou('rpc', 'moderar_material')).toHaveLength(1))
    await u.click(screen.getAllByRole('button', { name: 'Aprovar e liberar o site' })[0])
    await confirmarDialogo()
    await waitFor(() => expect(chamou('rpc', 'aprovar_e_liberar_site')).toHaveLength(1))
    await u.click(screen.getAllByRole('button', { name: 'Recusar' })[0])
    await confirmarDialogo('Fora do tema')
    await waitFor(() => expect(chamou('rpc', 'moderar_material').length).toBeGreaterThan(1))
  })

  it('lista todos os materiais, filtra e executa ação em massa', async () => {
    const u = userEvent.setup()
    logar('admin')
    abrir('/materiais')
    const buscas = await screen.findAllByRole('searchbox')
    await u.type(buscas[0], 'SQL')
    await u.clear(buscas[0])
    const chips = screen.getAllByRole('button').filter((b) => /^(Publicados|Em análise|Recusados|Todos)/.test(b.textContent ?? ''))
    for (const chip of chips) await u.click(chip)
    for (const sel of screen.getAllByRole('combobox')) {
      const opcoes = within(sel).getAllByRole('option') as HTMLOptionElement[]
      if (opcoes.length > 1) await u.selectOptions(sel, opcoes[1])
      await u.selectOptions(sel, opcoes[0])
    }
    const massa = screen.getAllByRole('button').filter((b) => /^(Excluir|Retirar|Publicar)/.test(b.textContent ?? '') && /todos/i.test(b.textContent ?? ''))
    if (massa.length) {
      await u.click(massa[0])
      const dialogo = await screen.findByRole('alertdialog')
      const exigido = dialogo.textContent?.match(/(EXCLUIR|RETIRAR|PUBLICAR) \d+/)?.[0]
      await confirmarDialogo(exigido)
    }
    expect(screen.getAllByText(/Resumo de SQL/).length).toBeGreaterThan(0)
  })

  it('testa o filtro e edita as listas de sites e termos', async () => {
    const u = userEvent.setup()
    logar('admin')
    abrir('/materiais')
    await u.type(await screen.findByLabelText('Título para testar'), 'Título suspeito')
    await u.type(screen.getByLabelText('Link para testar'), 'https://site.dev')
    await u.click(within(screen.getByRole('form', { name: 'Testar o filtro' })).getByRole('button'))
    await waitFor(() => expect(chamou('rpc', 'verificar_material')).toHaveLength(1))

    const incluir = async (rotulo: string, valor: string) => {
      const campo = screen.getByLabelText(rotulo)
      await u.type(campo, valor)
      await u.click(within(campo.closest('form')!).getByRole('button'))
    }
    banco.tabelas.filtro_sites = [{ id: 3, dominio: 'mdn.dev' }]
    await incluir('Incluir em Sites permitidos', 'mdn.dev')
    await waitFor(() => expect(chamou('insert', 'filtro_sites')).toHaveLength(1))
    banco.tabelas.filtro_termos = [{ id: 2, termo: 'aposta' }]
    await incluir('Incluir em Termos bloqueados', 'aposta')
    await waitFor(() => expect(chamou('insert', 'filtro_termos')).toHaveLength(1))

    await u.click(await screen.findByLabelText('Tirar mdn.dev da lista'))
    await confirmarDialogo()
    await waitFor(() => expect(chamou('delete', 'filtro_sites')).toHaveLength(1))
  })
})
