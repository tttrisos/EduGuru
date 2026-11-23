import { banco } from './supabaseFalso'

// Dados de exemplo, inventados (o guia de LGPD pede que os testes não usem dados reais).
export const DISCIPLINAS = [
  { id: 1, nome: 'Banco de Dados', curso: 'SI', cursos: ['SI', 'ADS', 'ES'] },
  { id: 2, nome: 'Engenharia de Software', curso: 'ES', cursos: ['ES'] },
  { id: 3, nome: 'Redes de Computadores', curso: 'SI', cursos: ['SI'] },
]

export const PERGUNTAS = [
  {
    id: 10, enunciado: 'O que o **RLS** controla?', disciplina_id: 1, nivel: 'Fácil',
    alternativa_a: 'Linhas que cada usuário acessa', alternativa_b: 'O tema do site',
    alternativa_c: 'O tamanho da fonte', alternativa_d: 'A cor dos botões', imagem_path: null,
  },
  {
    id: 11, enunciado: 'O que é um teste unitário?', disciplina_id: 2, nivel: 'Médio',
    alternativa_a: 'Testa uma função isolada', alternativa_b: 'Testa a rede',
    alternativa_c: 'Testa o servidor inteiro', alternativa_d: 'Testa o monitor', imagem_path: 'ilustracoes/teste.svg',
  },
]

export const GABARITOS = [
  { pergunta_id: 10, correta: 'A', explicacao: 'O RLS filtra as linhas.' },
  { pergunta_id: 11, correta: 'A', explicacao: null },
]

export const QUESTOES = [
  {
    tentativa_id: 500, pergunta_id: 10, enunciado: 'O que o **RLS** controla?',
    alternativa_a: 'Linhas que cada usuário acessa', alternativa_b: 'O tema do site',
    alternativa_c: 'O tamanho da fonte', alternativa_d: 'A cor dos botões', nivel: 'Fácil', imagem_path: null,
  },
  {
    tentativa_id: 500, pergunta_id: 12, enunciado: 'Qual comando lê dados?',
    alternativa_a: 'DELETE', alternativa_b: 'SELECT', alternativa_c: 'DROP', alternativa_d: 'GRANT',
    nivel: 'Difícil', imagem_path: 'ilustracoes/sql.svg',
  },
]

export const MATERIAIS = [
  {
    id: 1, titulo: 'Resumo de SQL', link: 'https://pt.wikipedia.org/wiki/SQL', arquivo_path: null, arquivo_nome: null,
    arquivo_tamanho: null, enviado_por: '11111111-1111-1111-1111-111111111111', disciplina_id: 1,
    descricao: 'Comandos básicos', status: 'aprovado', motivo_moderacao: null, criado_em: '2026-11-10T10:00:00Z',
  },
  {
    id: 2, titulo: 'Lista de exercícios', link: null, arquivo_path: 'u1/abc-lista.pdf', arquivo_nome: 'lista.pdf',
    arquivo_tamanho: 120000, enviado_por: '11111111-1111-1111-1111-111111111111', disciplina_id: 2,
    descricao: null, status: 'pendente', motivo_moderacao: 'Arquivo: aguardando a análise da equipe.', criado_em: '2026-11-11T10:00:00Z',
  },
  {
    id: 3, titulo: 'Vídeo recusado', link: 'https://site-desconhecido.com/x', arquivo_path: null, arquivo_nome: null,
    arquivo_tamanho: null, enviado_por: '33333333-3333-3333-3333-333333333333', disciplina_id: null,
    descricao: 'Sem relação', status: 'recusado', motivo_moderacao: 'Conteúdo fora do tema.', criado_em: '2026-11-12T10:00:00Z',
  },
]

export const COMUNIDADE = [
  {
    id: 1, titulo: 'Resumo de SQL', descricao: 'Comandos básicos', link: 'https://pt.wikipedia.org/wiki/SQL',
    arquivo_path: null, arquivo_nome: null, arquivo_tamanho: null, disciplina_id: 1, disciplina: 'Banco de Dados',
    autor_id: '33333333-3333-3333-3333-333333333333', autor_nome: 'Bruno C.', autor_curso: 'ADS', criado_em: '2026-11-10T10:00:00Z',
  },
  {
    id: 4, titulo: 'Apostila de normalização', descricao: null, link: null, arquivo_path: 'u3/apostila.pdf',
    arquivo_nome: 'apostila.pdf', arquivo_tamanho: 300000, disciplina_id: 1, disciplina: 'Banco de Dados',
    autor_id: '33333333-3333-3333-3333-333333333333', autor_nome: 'Bruno C.', autor_curso: 'ADS', criado_em: '2026-11-09T10:00:00Z',
  },
]

export const USUARIOS = [
  { id: '11111111-1111-1111-1111-111111111111', nome: 'Aluna Teste', email: 'aluna@teste.com', curso: 'SI', papel: 'aluno', criado_em: '2026-11-01T10:00:00Z', mfa_ativo: true },
  { id: '22222222-2222-2222-2222-222222222222', nome: 'Admin Teste', email: 'admin@teste.com', curso: null, papel: 'admin', criado_em: '2026-10-01T10:00:00Z', mfa_ativo: true },
  { id: '44444444-4444-4444-4444-444444444444', nome: 'Outra Admin', email: 'outra@teste.com', curso: null, papel: 'admin', criado_em: '2026-10-02T10:00:00Z', mfa_ativo: true },
  { id: '33333333-3333-3333-3333-333333333333', nome: 'Bruno Costa', email: 'bruno@teste.com', curso: 'ADS', papel: 'aluno', criado_em: '2026-11-02T10:00:00Z', mfa_ativo: false },
]

const agora = Date.now()
const diasAtras = (d: number) => new Date(agora - d * 86400000).toISOString()

export const LOGS = [
  { id: 1, usuario_id: '11111111-1111-1111-1111-111111111111', usuario_email: 'aluna@teste.com', acao: 'login', tabela: null, registro_id: null, detalhes: { aparelho: 'Chrome no Windows', mfa: 'nao' }, criado_em: diasAtras(0) },
  { id: 2, usuario_id: '11111111-1111-1111-1111-111111111111', usuario_email: 'aluna@teste.com', acao: 'editar', tabela: 'perfis', registro_id: 'x', detalhes: { campos: ['nome'] }, criado_em: diasAtras(1) },
  { id: 3, usuario_id: '11111111-1111-1111-1111-111111111111', usuario_email: 'aluna@teste.com', acao: 'logout', tabela: null, registro_id: null, detalhes: { motivo: 'sessao_expirada' }, criado_em: diasAtras(2) },
  { id: 4, usuario_id: null, usuario_email: null, acao: 'limpeza_automatica', tabela: null, registro_id: null, detalhes: null, criado_em: diasAtras(3) },
]

export const AREAS = [
  { id: 1, nome: 'Back-end', descricao: 'Servidores, APIs e regras de negócio.', palavras_chave: ['backend', 'back-end', 'java', 'node'] },
  { id: 2, nome: 'Dados', descricao: 'Bancos de dados e análise.', palavras_chave: ['dados', 'sql', 'dba'] },
]

export const AFIRMACOES = [
  { id: 1, texto: 'Gosto de criar APIs', area_id: 1, ordem: 1 },
  { id: 2, texto: 'Gosto de regras de negócio', area_id: 1, ordem: 2 },
  { id: 3, texto: 'Gosto de consultas SQL', area_id: 2, ordem: 3 },
  { id: 4, texto: 'Gosto de gráficos', area_id: 2, ordem: 4 },
]

export const AFINIDADES = [
  { area_id: 1, area: 'Back-end', afinidade: 75 },
  { area_id: 2, area: 'Dados', afinidade: 50 },
]

export const ISSUES_GITHUB = [
  { number: 1, title: '[Remoto] Desenvolvedor Back-end Java Júnior', html_url: 'https://github.com/backend-br/vagas/issues/1', created_at: new Date(agora - 86400000).toISOString(), labels: [{ name: 'Júnior' }, { name: 'Remoto' }], state: 'open' },
  { number: 2, title: '[Mogi das Cruzes/SP] Analista de Dados SQL Estágio', html_url: 'https://github.com/backend-br/vagas/issues/2', created_at: new Date(agora - 2 * 86400000).toISOString(), labels: [{ name: 'Estágio' }], state: 'open' },
  { number: 3, title: '[Joinville/SC] Dev Node Pleno', html_url: 'https://github.com/backend-br/vagas/issues/3', created_at: new Date(agora - 3 * 86400000).toISOString(), labels: [], state: 'open' },
]

export function carregarDados() {
  banco.tabelas = {
    disciplinas: DISCIPLINAS,
    perguntas: PERGUNTAS,
    gabaritos: GABARITOS,
    materiais: MATERIAIS,
    filtro_sites: [{ id: 1, dominio: 'wikipedia.org' }, { id: 2, dominio: 'youtube.com' }],
    filtro_termos: [{ id: 1, termo: 'cassino' }],
    tentativas_quiz: [
      { id: 1, disciplina_id: 1, iniciada_em: diasAtras(1), finalizada_em: diasAtras(1), total_perguntas: 10, acertos: 8, pontos: 120 },
      { id: 2, disciplina_id: 2, iniciada_em: diasAtras(2), finalizada_em: diasAtras(2), total_perguntas: 10, acertos: 3, pontos: 30 },
    ],
    respostas_quiz: [{ tentativa_id: 1, pergunta_id: 10, resposta: 'A', acertou: true, pontos: 10 }],
    logs_auditoria: LOGS,
    bussola_afirmacoes: AFIRMACOES,
    bussola_resultados: [{ respostas: { 1: 4, 2: 4, 3: 3, 4: 3 }, afinidades: AFINIDADES, respondida_em: diasAtras(1) }],
    areas_carreira: AREAS,
    disciplinas_areas: [{ disciplina_id: 1, area_id: 2 }, { disciplina_id: 2, area_id: 1 }],
    cliques_vagas: [{ vaga_titulo: 'Dev Java', area: 'Back-end', clicado_em: diasAtras(1) }],
    denuncias_materiais: [{ material_id: 1 }, { material_id: 1 }],
  }
  banco.rpc = {
    meu_desempenho: [
      { disciplina_id: 1, disciplina: 'Banco de Dados', respondidas: 10, acertos: 8, aproveitamento: 80 },
      { disciplina_id: 2, disciplina: 'Engenharia de Software', respondidas: 10, acertos: 3, aproveitamento: 30 },
      { disciplina_id: 3, disciplina: 'Redes de Computadores', respondidas: 2, acertos: 1, aproveitamento: 50 },
    ],
    ranking: [
      { posicao: 1, nome: 'Bruno C.', pontos: 300, eh_voce: false },
      { posicao: 2, nome: 'Aluna T.', pontos: 150, eh_voce: true },
      { posicao: 3, nome: 'Aluno anônimo', pontos: 90, eh_voce: false },
    ],
    recomendacoes_guru: [
      { disciplina_id: 2, disciplina: 'Engenharia de Software', aproveitamento: 30, material_id: 4, titulo: 'Apostila', link: null, arquivo_path: 'u3/apostila.pdf', arquivo_nome: 'apostila.pdf' },
      { disciplina_id: 2, disciplina: 'Engenharia de Software', aproveitamento: 30, material_id: 5, titulo: 'Vídeo', link: 'https://youtube.com/watch?v=1', arquivo_path: null, arquivo_nome: null },
    ],
    minha_bussola: AFINIDADES,
    minhas_areas_carreira: [{ area_id: 2, area: 'Dados', aproveitamento: 80, disciplinas: ['Banco de Dados'] }],
    materiais_da_comunidade: COMUNIDADE,
    materiais_em_moderacao: [
      { id: 2, titulo: 'Lista de exercícios', descricao: null, link: null, arquivo_path: 'u1/abc-lista.pdf', arquivo_nome: 'lista.pdf', arquivo_tamanho: 120000, disciplina_id: 2, status: 'pendente', motivo_moderacao: 'Arquivo: aguardando a análise da equipe.', autor_nome: 'Aluna T.', denuncias: 0, motivos_denuncias: null },
      { id: 6, titulo: 'Link novo', descricao: 'Blog', link: 'https://blog-novo.dev/post', arquivo_path: null, arquivo_nome: null, arquivo_tamanho: null, disciplina_id: 1, status: 'pendente', motivo_moderacao: 'Site novo: aguardando a análise da equipe.', autor_nome: 'Bruno C.', denuncias: 3, motivos_denuncias: 'Spam; Link quebrado' },
    ],
    perfil_publico: [{ nome: 'Bruno C.', curso: 'ADS', equipe: false, materiais: 2 }],
    iniciar_quiz: QUESTOES,
    pedir_dica: ['C', 'D'],
    responder_pergunta: (args: Record<string, unknown> | undefined) => [
      args?.p_resposta === 'A'
        ? { gabarito: 'A', acertou: true, pontos: 10, explicacao: 'O RLS filtra as linhas.' }
        : { gabarito: 'B', acertou: false, pontos: 0, explicacao: 'SELECT lê os dados.' },
    ],
    finalizar_quiz: [
      { pergunta_id: 10, resposta: 'A', gabarito: 'A', acertou: true, pontos: 10 },
      { pergunta_id: 12, resposta: 'C', gabarito: 'B', acertou: false, pontos: 0 },
    ],
    listar_usuarios_admin: USUARIOS,
    meus_acessos: {
      logins: [
        { quando: diasAtras(0), aparelho: 'Chrome no Windows', com_codigo: false, verificacao: 'email' },
        { quando: diasAtras(1), aparelho: 'Safari no iPhone', com_codigo: true, verificacao: 'totp' },
      ],
      aparelhos_lembrados: [{ aparelho: 'Chrome no Windows', ultimo_uso: diasAtras(0), expira_em: diasAtras(-29), este: true }],
      senhas_erradas_30_dias: 2,
      ultima_senha_errada: diasAtras(3),
    },
    estatisticas_admin: {
      alunos: 12, disciplinas: 39, perguntas_prontas: 270, materiais: 15, quizzes: 40, aproveitamento_geral: 64,
      quizzes_por_dia: [{ dia: '2026-11-20', total: 5 }, { dia: '2026-11-21', total: 8 }],
      aproveitamento_por_disciplina: [{ disciplina: 'Banco de Dados', aproveitamento: 72 }, { disciplina: 'Redes', aproveitamento: 45 }],
    },
    total_alunos_com_mfa: [{ com_mfa: 3, alunos: 12 }],
    estatisticas_carreiras: {
      cliques: 9, cliques_30_dias: 7, alunos_que_clicaram: 4,
      cliques_por_area: [{ area: 'Back-end', total: 5 }], vagas_mais_clicadas: [{ titulo: 'Dev Java', total: 3 }],
    },
    estatisticas_bussola: { respondidas: 6, area_preferida: [{ area: 'Back-end', total: 4 }] },
    verificar_material: { motivo: null, site_novo: false },
    salvar_bussola: AFINIDADES,
    conferir_senha_atual: true,
    registrar_aceite: true,
    enviar_codigo_email: { ok: true, email: 'a***@teste.com' },
    confirmar_codigo_email: { ok: true },
    denunciar_material: 'Denúncia registrada. Obrigado!',
    limpar_logs_antigos: 0,
    moderar_material: true,
    aprovar_e_liberar_site: true,
    reanalisar_materiais_publicados: 0,
    esquecer_outros_aparelhos: true,
    redefinir_mfa_usuario: true,
    excluir_conta_usuario: true,
    excluir_minha_conta: true,
    criar_pergunta: 99,
    editar_pergunta: true,
    situacao_codigo_email: { precisa_codigo: false },
  }
}
