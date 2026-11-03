# EduGuru

Plataforma web acadêmica gamificada para acompanhar e personalizar a jornada de aprendizagem.

Projeto Final de Curso (PFC/TCC) de Sistemas de Informação da Universidade de Mogi das Cruzes (UMC).

**Site publicado (PREVISTO):** https://tttrisos.github.io/EduGuru/

## Sobre o projeto

O EduGuru combate o desengajamento dos alunos com gamificação. O aluno responde quizzes por disciplina, ganha pontos, participa do ranking e recebe do **Guru** indicações de materiais nas disciplinas em que vai mal. A plataforma também centraliza notas e faltas no formato do boletim da UMC.

Público-alvo: alunos da UMC de Sistemas de Informação, Análise e Desenvolvimento de Sistemas e Engenharia de Software.

## Funcionalidades

- **Quiz:** até 10 perguntas sorteadas de uma disciplina, mostradas uma por vez, com a correção logo após cada resposta (feita no banco, sem permitir trocar a resposta).
- **Pontuação e ranking:** Fácil 10, Médio 20, Difícil 30 pontos; ranking geral e por disciplina, com opção de aparecer como "Aluno anônimo".
- **Guru:** indica materiais da disciplina quando o aproveitamento fica abaixo de 60%.
- **Notas e faltas:** campos do boletim da UMC (M1, ND, NI, MS, Exame), cálculo de M2, MD e MF e controle das faltas (limite de 40 por disciplina).
- **Painel:** indicadores e gráficos do aluno e, para o administrador, da plataforma.
- **Cadastros:** disciplinas, banco de perguntas (120 iniciais) e materiais (links e arquivos PDF/DOCX).
- **Segurança e LGPD:** verificação em duas etapas obrigatória, logs de auditoria com limpeza automática em 90 dias, Termo de Aceite, Política de Privacidade e tela Minha conta (acesso, correção e exclusão dos dados).

## Tecnologias

- **Front-end:** React, TypeScript e Vite, com CSS próprio (tema escuro), publicado no GitHub Pages pelo GitHub Actions.
- **Back-end:** Supabase (Auth, banco PostgreSQL com Row Level Security, Storage e pg_cron).
- **API externa:** ViaCEP (cidade e estado no cadastro, opcional).
- **Testes:** Vitest (`npm test`).

## Estrutura do projeto

Cada pasta de `src/funcionalidades/` reúne **tudo** de uma funcionalidade: as telas, as regras de cálculo, os testes e o estilo (CSS). O que é usado por várias telas fica em `src/compartilhado/`.

```
eduguru/
├── src/
│   ├── main.tsx                  Ponto de entrada do site
│   ├── App.tsx                   Rotas (endereço de cada tela)
│   ├── compartilhado/            Usado por todas as telas
│   │   ├── supabase.ts           Conexão com o banco
│   │   ├── tipos.ts              Tipos de dados (Disciplina, Pergunta, Nota...)
│   │   ├── AuthContext.tsx       Sessão do usuário (login, MFA, aluno ou admin)
│   │   ├── RotaProtegida.tsx     Bloqueia telas sem login, sem MFA ou sem permissão
│   │   ├── LayoutLogado.tsx      Barra superior da área logada
│   │   ├── Rodape.tsx, BigNumber.tsx, GraficoBarras.tsx, TextoRico.tsx
│   │   ├── log.ts                Registro dos logs de acesso
│   │   ├── arquivos.ts           Links temporários dos arquivos do Storage
│   │   ├── texto.ts              Negrito nos textos (**assim**) + testes
│   │   └── global.css            Visual comum (cores, botões, campos, tabelas)
│   └── funcionalidades/
│       ├── home/                 Página inicial pública
│       ├── acesso/               Login, cadastro, MFA, esqueci minha senha + regras de senha
│       ├── lgpd/                 Termo, Política, novo aceite e Minha conta
│       ├── disciplinas/          Cadastro de disciplinas
│       ├── perguntas/            Banco de perguntas do quiz (admin)
│       ├── materiais/            Materiais de estudo (links e arquivos)
│       ├── quiz/                 Quiz e ranking
│       ├── notas/                Notas e faltas + cálculo (calculoNotas.ts) e testes
│       ├── painel/               Painel do aluno e do admin
│       └── admin/                Usuários e logs
├── supabase/                     Scripts do banco (rodar em ordem, de 01 a 14)
├── docs/                         Monografia, checklist, diagramas e integração ViaCEP
├── public/                       Ícone do site
└── .github/workflows/            Publicação automática no GitHub Pages
```

## Onde está cada funcionalidade

| Funcionalidade | Pasta em `src/funcionalidades/` | Banco (`supabase/`) |
|---|---|---|
| Página inicial (RF23) | `home/` | — |
| Login e cadastro (RF01, RF02), CEP (ViaCEP) | `acesso/Login.tsx`, `acesso/senha.ts` | `02_perfis_e_logs.sql`, `04_seguranca_lgpd.sql` |
| Verificação em duas etapas (MFA) | `acesso/Mfa.tsx` | `05_verificacao_duas_etapas.sql` |
| Esqueci minha senha (RF24) | `acesso/EsqueciSenha.tsx`, `acesso/RedefinirSenha.tsx` | `09_esqueci_senha.sql` |
| Termo, Política e novo aceite (RF11 a RF13, RF22) | `lgpd/TermoDeAceite.tsx`, `lgpd/Privacidade.tsx`, `lgpd/NovoAceite.tsx` | `08_novo_aceite.sql` |
| Minha conta e exclusão de conta (RF15, RF21) | `lgpd/MinhaConta.tsx`, `lgpd/conta.ts` | `07_minha_conta.sql` |
| Disciplinas | `disciplinas/` | `01_tabelas_base.sql`, `13_disciplinas_cursos.sql` |
| Banco de perguntas, com imagem e explicação | `perguntas/` | `11_quiz_ranking_guru.sql` (`criar_pergunta`), `14_perguntas_iniciais.sql` |
| Materiais (links e arquivos) | `materiais/` | `03_arquivos_materiais.sql`, `04_seguranca_lgpd.sql` |
| Quiz, pontuação e Guru (RF25, RF26, RF28) | `quiz/Quiz.tsx` | `11_quiz_ranking_guru.sql` (`iniciar_quiz`, `responder_pergunta`, `finalizar_quiz`, `recomendacoes_guru`) |
| Ranking (RF27) | `quiz/Ranking.tsx` | `11_quiz_ranking_guru.sql` (`ranking`) |
| Notas e faltas (RF29) | `notas/Notas.tsx`, `notas/calculoNotas.ts` | `12_notas_e_painel.sql` |
| Painel (RF30) | `painel/` | `12_notas_e_painel.sql` (`estatisticas_admin`) |
| Usuários e redefinição de MFA (RF31) | `admin/Usuarios.tsx` | `07_minha_conta.sql`, `10_ajustes_seguranca.sql` |
| Logs de auditoria e limpeza | `admin/Logs.tsx` | `02_perfis_e_logs.sql`, `06_limpeza_automatica_logs.sql`, `10_ajustes_seguranca.sql` |
| Regras de acesso (RLS) | — | `02` (perfis e cadastros), `04` (perfis e materiais), `05` (MFA em todas as tabelas) |

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
| `13_disciplinas_cursos.sql` | Disciplinas da grade de SI, ADS e ES (só as da grade da UMC) |
| `14_perguntas_iniciais.sql` | Banco inicial de 120 perguntas, com negrito e explicações |

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
