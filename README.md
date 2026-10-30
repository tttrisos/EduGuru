# EduGuru

Plataforma web acadêmica gamificada para acompanhar e personalizar a jornada de aprendizagem.

Projeto Final de Curso (PFC/TCC) de Sistemas de Informação da Universidade de Mogi das Cruzes (UMC).

**Site publicado:** https://tttrisos.github.io/EduGuru/

## Sobre o projeto

O EduGuru combate o desengajamento dos alunos com gamificação. O aluno responde quizzes por disciplina, ganha pontos, participa do ranking e recebe do **Guru** indicações de materiais nas disciplinas em que vai mal. A plataforma também centraliza notas e faltas no formato do boletim da UMC.

Público-alvo: alunos da UMC de Sistemas de Informação, Análise e Desenvolvimento de Sistemas e Engenharia de Software.

## Funcionalidades

- **Quiz:** até 10 perguntas sorteadas de uma disciplina, com correção feita no banco (o aluno nunca recebe o gabarito antes de finalizar).
- **Pontuação e ranking:** Fácil 10, Médio 20, Difícil 30 pontos; ranking geral e por disciplina, com opção de aparecer como "Aluno anônimo".
- **Guru:** indica materiais da disciplina quando o aproveitamento fica abaixo de 60%.
- **Notas e faltas:** campos do boletim da UMC (M1, ND, NI, MS, Exame), cálculo de M2, MD e MF e limite de 25% de faltas.
- **Painel:** indicadores e gráficos do aluno e, para o administrador, da plataforma.
- **Cadastros:** disciplinas, banco de perguntas (120 iniciais) e materiais (links e arquivos PDF/DOCX).
- **Segurança e LGPD:** verificação em duas etapas obrigatória, logs de auditoria com limpeza automática em 90 dias, Termo de Aceite, Política de Privacidade e tela Minha conta (acesso, correção e exclusão dos dados).

## Tecnologias

- **Front-end:** React, TypeScript e Vite, com CSS próprio (tema escuro), publicado no GitHub Pages pelo GitHub Actions.
- **Back-end:** Supabase (Auth, banco PostgreSQL com Row Level Security, Storage e pg_cron).
- **API externa:** ViaCEP (cidade e estado no cadastro, opcional).
- **Testes:** Vitest (`npm test`).

## Estrutura do projeto

```
eduguru/
├── src/
│   ├── main.tsx              Ponto de entrada do site
│   ├── App.tsx               Rotas (endereço de cada tela)
│   ├── supabase.ts           Conexão com o Supabase
│   ├── types.ts              Tipos de dados (Disciplina, Pergunta, Nota...)
│   ├── index.css             Estilos de todas as telas
│   ├── contexts/             Sessão do usuário (login, MFA, papel)
│   ├── layouts/              Barra superior da área logada
│   ├── components/           Peças reutilizadas (gráfico, indicador, rodapé, rota protegida)
│   ├── lib/                  Regras de negócio sem tela e seus testes
│   └── pages/                Telas, separadas por funcionalidade
│       ├── publico/          Página inicial
│       ├── autenticacao/     Login, cadastro, MFA e redefinição de senha
│       ├── lgpd/             Termo, Política, novo aceite e Minha conta
│       ├── painel/           Painel e notas/faltas
│       ├── cadastros/        Disciplinas, perguntas e materiais
│       ├── quiz/             Quiz e ranking
│       └── admin/            Usuários e logs
├── supabase/                 Scripts do banco (rodar em ordem, de 01 a 13)
├── docs/                     Monografia, checklist, diagramas e integração ViaCEP
├── public/                   Ícone do site
└── .github/workflows/        Publicação automática no GitHub Pages
```

## Onde está cada funcionalidade

| Funcionalidade | Tela | Regras / lógica | Banco (`supabase/`) |
|---|---|---|---|
| Página inicial | `pages/publico/Home.tsx` | — | — |
| Login e cadastro (RF01, RF02) | `pages/autenticacao/Login.tsx` | `contexts/AuthContext.tsx`, `lib/senha.ts` | `02_perfis_e_logs.sql`, `04_seguranca_lgpd.sql` |
| Consulta de CEP (ViaCEP) | `pages/autenticacao/Login.tsx` | `docs/INTEGRACAO_VIACEP.md` | `04_seguranca_lgpd.sql` |
| Verificação em duas etapas (MFA) | `pages/autenticacao/Mfa.tsx` | `components/RotaProtegida.tsx` | `05_verificacao_duas_etapas.sql` |
| Esqueci minha senha (RF24) | `pages/autenticacao/EsqueciSenha.tsx`, `RedefinirSenha.tsx` | `lib/log.ts` | `09_esqueci_senha.sql` |
| Disciplinas | `pages/cadastros/Disciplinas.tsx` | — | `01_tabelas_base.sql`, `12_notas_e_painel.sql` |
| Banco de perguntas (admin) | `pages/cadastros/Perguntas.tsx` | — | `11_quiz_ranking_guru.sql` (`criar_pergunta`), `13_perguntas_iniciais.sql` |
| Materiais (links e arquivos) | `pages/cadastros/Materiais.tsx` | `lib/materiais.ts` | `03_arquivos_materiais.sql`, `04_seguranca_lgpd.sql` |
| Quiz e pontuação (RF25, RF26) | `pages/quiz/Quiz.tsx` | — | `11_quiz_ranking_guru.sql` (`iniciar_quiz`, `finalizar_quiz`) |
| Ranking (RF27) | `pages/quiz/Ranking.tsx` | — | `11_quiz_ranking_guru.sql` (`ranking`) |
| Guru (RF28) | `pages/quiz/Quiz.tsx`, `pages/painel/Painel.tsx` | — | `11_quiz_ranking_guru.sql` (`recomendacoes_guru`) |
| Notas e faltas (RF29) | `pages/painel/Notas.tsx` | `lib/notas.ts` | `12_notas_e_painel.sql` |
| Painel (RF30) | `pages/painel/Painel.tsx` | `components/BigNumber.tsx`, `GraficoBarras.tsx` | `12_notas_e_painel.sql` (`estatisticas_admin`) |
| Termo e Política | `pages/lgpd/TermoDeAceite.tsx`, `Privacidade.tsx` | `types.ts` (`VERSAO_TERMOS`) | — |
| Novo aceite dos termos (RF22) | `pages/lgpd/NovoAceite.tsx` | — | `08_novo_aceite.sql` |
| Minha conta (LGPD, RF15, RF21) | `pages/lgpd/MinhaConta.tsx` | `lib/conta.ts` | `07_minha_conta.sql` |
| Usuários e MFA pelo admin (RF31) | `pages/admin/Usuarios.tsx` | `lib/conta.ts` | `07_minha_conta.sql`, `10_ajustes_seguranca.sql` |
| Logs de auditoria e limpeza | `pages/admin/Logs.tsx` | `lib/log.ts` | `02_perfis_e_logs.sql`, `06_limpeza_automatica_logs.sql`, `10_ajustes_seguranca.sql` |
| Regras de acesso (RLS) | — | — | `02` (perfis e cadastros), `04` (perfis e materiais), `05` (MFA em todas as tabelas) |

## Banco de dados

Os scripts da pasta `supabase/` criam o banco completo quando executados **em ordem** no SQL Editor do Supabase:

| Script | O que cria |
|---|---|
| `01_tabelas_base.sql` | Tabelas de disciplinas, perguntas e materiais |
| `02_perfis_e_logs.sql` | Perfis (aluno/admin), regras de acesso e logs de auditoria |
| `03_arquivos_materiais.sql` | Envio de arquivos PDF/DOCX (bucket privado) |
| `04_seguranca_lgpd.sql` | Cidade/estado, aceite dos termos, permissões do perfil, dono dos materiais |
| `05_verificacao_duas_etapas.sql` | MFA exigido pelo banco em todas as tabelas |
| `06_limpeza_automatica_logs.sql` | Exclusão diária dos logs com mais de 90 dias |
| `07_minha_conta.sql` | Exclusão de conta pelo titular e pelo admin |
| `08_novo_aceite.sql` | Novo aceite quando os termos mudam de versão |
| `09_esqueci_senha.sql` | Log do pedido de redefinição de senha |
| `10_ajustes_seguranca.sql` | Logs de acesso, limpeza manual, redefinição de MFA e lista de usuários |
| `11_quiz_ranking_guru.sql` | Quiz, gabaritos, pontuação, ranking e Guru |
| `12_notas_e_painel.sql` | Notas e faltas e indicadores do painel do admin |
| `13_perguntas_iniciais.sql` | Banco inicial de 120 perguntas |

Antes dos scripts 05 e 06, habilitar no painel do Supabase o **TOTP** (Authentication → Multi-Factor) e a extensão **pg_cron** (Database → Extensions). Para tornar alguém administrador, ver o fim do script 02.

## Como rodar localmente

Requisitos: Node.js 22 ou superior.

```bash
git clone https://github.com/tttrisos/EduGuru.git
cd EduGuru
npm install
npm run dev          # abre o site em http://localhost:5173
```

Outros comandos:

```bash
npm test             # testes unitários
npm run test:cobertura
npm run lint
npm run build        # gera a versão de publicação em dist/
```

## Documentação

- `docs/ATUALIZACOES_MONOGRAFIA.md` — o que muda no texto da monografia a cada entrega.
- `docs/CHECKLIST_ENTREGAS.md` — andamento das entregas.
- `docs/diagramas/` — diagrama de classes e BPMN.
- `docs/INTEGRACAO_VIACEP.md` — integração com a API ViaCEP.
