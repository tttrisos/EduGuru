# EduGuru

Plataforma web acadêmica gamificada para acompanhar e personalizar a jornada de aprendizagem.

Projeto Final de Curso (PFC/TCC) de Sistemas de Informação da Universidade de Mogi das Cruzes (UMC).

**Site publicado:** https://tttrisos.github.io/EduGuru/

## Sobre o projeto

O EduGuru combate o desengajamento dos alunos com gamificação. O aluno responde quizzes por disciplina, ganha pontos, participa do ranking e recebe do **Guru** indicações de materiais nas disciplinas em que vai mal. A plataforma também centraliza notas e faltas no formato do boletim da UMC.

Público-alvo: alunos da UMC de Sistemas de Informação, Análise e Desenvolvimento de Sistemas e Engenharia de Software.

## Funcionalidades

- **Quiz:** até 10 perguntas sorteadas de uma disciplina, mostradas uma por vez, com a correção logo após cada resposta (feita no banco, sem permitir trocar a resposta). Filtro de disciplinas por curso e busca pelo nome, ilustrações nas perguntas (com zoom), dica 50/50 por rodada, sons, comemoração de sequências de acertos.
- **Pontuação e ranking:** Fácil 10, Médio 20, Difícil 30 pontos; ranking geral e por disciplina, com opção de aparecer como "Aluno anônimo".
- **Guru:** indica materiais da disciplina quando o aproveitamento fica abaixo de 60%.
- **Materiais da comunidade:** cada aluno cadastra os próprios links e arquivos; os aprovados aparecem para os colegas no fim do quiz e no perfil público de quem enviou (nome abreviado e curso). Filtro automático (sites permitidos, termos impróprios e dados pessoais), análise dos arquivos pelo admin e denúncias.
- **Carreiras:** vagas de tecnologia das comunidades backend-br e frontendbr (API do GitHub), ligadas ao desempenho no quiz: quem acerta 60% ou mais em uma disciplina recebe as vagas das áreas ligadas a ela (ex.: Banco de Dados → Dados e Back-end), com os materiais dessas disciplinas. Filtros por área, nível e busca; cache de 30 minutos e aviso amigável quando o GitHub está fora do ar. O botão "Candidatar-se" abre a vaga no site de origem (o EduGuru não recebe currículo) e os cliques aparecem no painel do admin.
- **Bússola EduGuru:** autoavaliação de interesses opcional (16 afirmações de 1 a 5, cerca de 3 minutos), que calcula a afinidade com cada área e entra nas sugestões do Carreiras ao lado do desempenho no quiz. Não é teste vocacional: é uma orientação simples, e o aluno pode refazer ou apagar o resultado.
- **Notas e faltas:** campos do boletim da UMC (M1, ND, NI, MS, Exame), cálculo de M2, MD e MF e controle das faltas (limite de 40 por disciplina).
- **Painel:** indicadores e gráficos do aluno e, para o administrador, da plataforma.
- **Cadastros:** disciplinas, banco de perguntas (120 iniciais) e materiais (links e arquivos PDF/DOCX).
- **Segurança e LGPD:** verificação em duas etapas obrigatória, logs de auditoria com limpeza automática em 90 dias, Termo de Aceite, Política de Privacidade e tela Minha conta (acesso, correção e exclusão dos dados).

## Tecnologias

- **Front-end:** React, TypeScript e Vite, com CSS próprio (tema escuro), publicado no GitHub Pages pelo GitHub Actions.
- **Back-end:** Supabase (Auth, banco PostgreSQL com Row Level Security, Storage e pg_cron).
- **APIs externas:** API do GitHub (vagas do EduGuru Carreiras) e ViaCEP (cidade e estado no cadastro, opcional).
- **Testes:** Vitest (`npm test`).

## Estrutura do projeto

Cada pasta de `src/funcionalidades/` reúne **tudo** de uma funcionalidade: as telas, as regras de cálculo e o estilo (CSS). O que é usado por várias telas fica em `src/compartilhado/`, e os testes unitários ficam todos em `testes/`.

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
│   │   ├── Dialogo.tsx           Janela de confirmação (no lugar dos avisos do navegador)
│   │   ├── Ajuda.tsx             Caixa de ajuda dos formulários (regras em tópicos)
│   │   ├── tema.ts               Modo escuro (padrão) ou claro, salvo no navegador
│   │   ├── Rodape.tsx, BigNumber.tsx, GraficoBarras.tsx, TextoRico.tsx
│   │   ├── log.ts                Registro dos logs de acesso
│   │   ├── arquivos.ts           Links temporários dos arquivos e imagens das perguntas
│   │   ├── texto.ts              Negrito nos textos (**assim**)
│   │   └── global.css            Visual comum (cores, botões, campos, tabelas)
│   └── funcionalidades/
│       ├── home/                 Página inicial pública
│       ├── acesso/               Login, cadastro, MFA, esqueci minha senha + regras de senha
│       ├── lgpd/                 Termo, Política, novo aceite e Minha conta
│       ├── disciplinas/          Cadastro de disciplinas
│       ├── perguntas/            Banco de perguntas do quiz (admin)
│       ├── materiais/            Meus materiais, filtro, moderação, denúncias e perfil público
│       ├── quiz/                 Quiz, efeitos (sons e comemorações) e ranking
│       ├── carreiras/            Carreiras (vagas do GitHub, localidade, áreas) e Bússola EduGuru
│       ├── notas/                Notas e faltas + cálculo (calculoNotas.ts)
│       ├── painel/               Painel do aluno e do admin
│       └── admin/                Usuários e logs
├── testes/                       Testes unitários (Vitest): notas, senha, negrito, filtro de materiais, efeitos do quiz, vagas, localidade e Bússola
├── supabase/                     Scripts do banco (rodar em ordem, de 01 a 18)
├── docs/                         Integrações com as APIs externas (GitHub e ViaCEP)
├── public/                       Ícone do site e ilustrações das perguntas (ilustracoes/)
└── .github/workflows/            Publicação automática no GitHub Pages
```

## Onde está cada funcionalidade

| Funcionalidade | Pasta em `src/funcionalidades/` | Banco (`supabase/`) |
|---|---|---|
| Página inicial (RF23) | `home/` | — |
| Login e cadastro (RF01, RF02), CEP via ViaCEP (RF05) | `acesso/Login.tsx`, `acesso/senha.ts` | `02_perfis_e_logs.sql`, `04_seguranca_lgpd.sql` |
| Verificação em duas etapas (RF03, RF04) | `acesso/Mfa.tsx` | `05_verificacao_duas_etapas.sql` |
| Esqueci minha senha (RF24) | `acesso/EsqueciSenha.tsx`, `acesso/RedefinirSenha.tsx` | `09_esqueci_senha.sql` |
| Termo, Política e novo aceite (RF11 a RF13, RF22) | `lgpd/TermoDeAceite.tsx`, `lgpd/Privacidade.tsx`, `lgpd/NovoAceite.tsx` | `08_novo_aceite.sql` |
| Minha conta e exclusão de conta (RF15, RF21) | `lgpd/MinhaConta.tsx`, `lgpd/conta.ts` | `07_minha_conta.sql` |
| Disciplinas (RF06) | `disciplinas/` | `01_tabelas_base.sql`, `13_disciplinas_cursos.sql` |
| Banco de perguntas, com imagem e explicação (RF07) | `perguntas/` | `11_quiz_ranking_guru.sql` (`criar_pergunta`), `14_perguntas_iniciais.sql`, `16_editar_perguntas.sql` (`editar_pergunta`) |
| Meus materiais, links e arquivos (RF08) | `materiais/Materiais.tsx` | `03_arquivos_materiais.sql`, `04_seguranca_lgpd.sql`, `15_materiais_comunidade_quiz.sql` |
| Filtro de materiais (sites permitidos, termos impróprios, dados pessoais) | `materiais/filtroMateriais.ts` | `15_materiais_comunidade_quiz.sql` (`motivo_bloqueio_material`, gatilho `moderar_material`) |
| Materiais dos colegas, denúncia e perfil público (RF28, RF29) | `materiais/ListaComunidade.tsx`, `materiais/PerfilAutor.tsx` | `15_materiais_comunidade_quiz.sql` (`materiais_da_comunidade`, `denunciar_material`, `perfil_publico`) |
| Moderação de materiais, admin (RF27) | `materiais/Moderacao.tsx` | `15_materiais_comunidade_quiz.sql` (`materiais_em_moderacao`, `moderar_material`) |
| Quiz, pontuação e Guru (RF16, RF17, RF19) | `quiz/Quiz.tsx`, `quiz/efeitos.ts` | `11_quiz_ranking_guru.sql` (`iniciar_quiz`, `responder_pergunta`, `finalizar_quiz`, `recomendacoes_guru`), `15_materiais_comunidade_quiz.sql` (`pedir_dica`, ilustrações) |
| Ranking (RF18) | `quiz/Ranking.tsx` | `11_quiz_ranking_guru.sql` (`ranking`) |
| Notas e faltas (RF20) | `notas/Notas.tsx`, `notas/calculoNotas.ts` | `12_notas_e_painel.sql` |
| Painel (RF25) | `painel/` | `12_notas_e_painel.sql` (`estatisticas_admin`) |
| Usuários e redefinição de MFA (RF26) | `admin/Usuarios.tsx` | `07_minha_conta.sql`, `10_ajustes_seguranca.sql` |
| Logs de auditoria e limpeza (RF09, RF10) | `admin/Logs.tsx` | `02_perfis_e_logs.sql`, `06_limpeza_automatica_logs.sql`, `10_ajustes_seguranca.sql` |
| Carreiras: vagas ligadas ao desempenho (RF30) | `carreiras/Carreiras.tsx`, `carreiras/ListaVagas.tsx`, `carreiras/vagas.ts` | `17_carreiras.sql` (`minhas_areas_carreira`, `registrar_clique_vaga`) |
| Áreas de carreira e ligação com as disciplinas, admin (RF31) | `carreiras/AreasAdmin.tsx`, `carreiras/areas.ts` | `17_carreiras.sql` (`areas_carreira`, `disciplinas_areas`) |
| Cliques em "Candidatar-se" no painel do admin (RF32) | `painel/Painel.tsx` (`PainelCarreiras`) | `17_carreiras.sql` (`estatisticas_carreiras`) |
| Bússola EduGuru: autoavaliação de interesses (RF33) | `carreiras/Bussola.tsx`, `carreiras/afinidadeBussola.ts` | `18_bussola.sql` (`salvar_bussola`, `minha_bussola`, `estatisticas_bussola`) |
| Regras de acesso, RLS (RF14) | — | `02` (perfis e cadastros), `04` (perfis e materiais), `05` (MFA em todas as tabelas) |

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
| `13_disciplinas_cursos.sql` | Disciplinas da grade de SI, ADS e ES (só as da grade da UMC; a comum a mais de um curso guarda todos eles) |
| `14_perguntas_iniciais.sql` | Banco inicial de 120 perguntas, com negrito e explicações |
| `15_materiais_comunidade_quiz.sql` | Materiais da comunidade (filtro, moderação, denúncias, perfil público), dica 50/50 e ilustrações das perguntas |
| `16_editar_perguntas.sql` | Edição de perguntas (pergunta, gabarito e explicação juntos), completando o CRUD |
| `17_carreiras.sql` | EduGuru Carreiras: áreas de carreira, ligação disciplina → área, áreas sugeridas pelo desempenho, cliques em "Candidatar-se" (retenção de 12 meses) e totais do painel |
| `18_bussola.sql` | Bússola EduGuru: afirmações por área, resultado do aluno (só o mais recente), cálculo da afinidade e totais do painel |

Antes dos scripts 05, 06 e 17, habilitar no painel do Supabase o **TOTP** (Authentication → Multi-Factor) e a extensão **pg_cron** (Database → Extensions). Para tornar alguém administrador, ver o fim do script 02.

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

- `docs/INTEGRACAO_GITHUB_VAGAS.md` — integração com a API do GitHub (vagas do EduGuru Carreiras).
- `docs/INTEGRACAO_VIACEP.md` — integração com a API ViaCEP.
