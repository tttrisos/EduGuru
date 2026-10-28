# 🚀 EduGuru

Plataforma Web acadêmica gamificada para gerenciamento, acompanhamento e personalização da jornada de aprendizagem.

## 📖 Sobre o projeto

O EduGuru é um projeto desenvolvido como Projeto Final de Curso (PFC/TCC) do curso de Sistemas de Informação da Universidade de Mogi das Cruzes (UMC).

Diferente de sistemas acadêmicos tradicionais que funcionam apenas como repositórios passivos, o objetivo do EduGuru é combater o desengajamento através da gamificação. A plataforma centraliza o acompanhamento de notas e faltas, mas utiliza um **sistema de quizzes interativos** como principal mecanismo de engajamento. Ao estudar e responder aos quizzes, o aluno ganha pontos, participa de rankings e recebe recomendações direcionadas de materiais de estudo para suprir suas dificuldades.

**Identidade Visual e UX:** Focada no público jovem-adulto e imersivo, a aplicação adota uma identidade visual "Dark Mode nativa" (tons de grafite, preto e roxo), priorizando o conforto visual e uma experiência de usuário premium, inspirada em plataformas de tecnologia modernas.

## 🎯 Público-Alvo

O escopo inicial da aplicação é voltado exclusivamente para estudantes da UMC dos seguintes cursos de tecnologia:
- Sistemas de Informação
- Análise e Desenvolvimento de Sistemas (ADS)
- Engenharia de Software

## 🧩 Principais Funcionalidades

- **Dashboard Acadêmico:** Registro manual das notas com os campos do boletim da UMC (M1, ND, NI, MS, Exame), cálculo de M2, MD e MF e controle do limite de faltas.
- **Quiz Gamificado:** Perguntas categorizadas por curso, disciplina, assunto e nível de dificuldade (iniciante, intermediário, avançado).
- **Pontuação e Rankings:** Pontos por acerto conforme o nível (Fácil 10, Médio 20, Difícil 30), alimentando um Ranking Geral e um Ranking por Disciplina.
- **O "Guru" (Recomendações):** Sistema leve de indicação de conteúdos de estudo com base nas lacunas de conhecimento identificadas nos quizzes.
- **Gestão de Materiais e Disciplinas:** Organização de PDFs, links e anotações atreladas às grades curriculares.

## 📱 Escopo e Plataformas

O projeto será desenvolvido como uma aplicação Web responsiva, projetada para funcionar de forma fluida em computadores, notebooks, tablets e celulares através do navegador. 
O desenvolvimento de aplicativos mobile nativos (Android/iOS) ou aplicações desktop não faz parte do escopo atual de implementação deste PFC.

## 🛠️ Tecnologias e Arquitetura

O projeto utiliza uma arquitetura moderna baseada em serviços de Backend-as-a-Service (BaaS):
- **Front-end:** React e TypeScript, com CSS global (hospedado no GitHub Pages).
- **Back-end e Autenticação:** Supabase (Auth e Data API nativa).
- **Banco de Dados:** PostgreSQL (gerenciado pelo Supabase com Row Level Security).
- **Controle de Versão:** Git e GitHub.

## 📈 Status do Projeto

**Fase 1 Concluída (Setembro/2026):** Módulos iniciais de Cadastros (Disciplinas, Perguntas e Materiais) integrados ao Supabase e entregues com sucesso.

**Fase 2 Concluída (Entrega 28/09/2026):**
- Autenticação (login/cadastro), com perfis de aluno/admin e controle de acesso por papel (RLS no Supabase)
- Logs de auditoria de login, logout e alterações em disciplinas/perguntas/materiais, com rotina de limpeza de registros antigos
- Integração com a API externa ViaCEP (consulta opcional de cidade/estado no cadastro) — documentação em `INTEGRACAO_VIACEP.md`
- Termo de Aceite e Política de Privacidade, acessíveis a qualquer momento pelo rodapé do sistema

**Etapa 2 (em andamento, outubro/2026)** — já implementado:
- Verificação em duas etapas (MFA/TOTP) obrigatória, exigida também pelo banco (RLS)
- Exclusão automática diária dos logs com mais de 90 dias (pg_cron)
- Tela "Minha conta" (direitos LGPD: acesso, correção, revogação, exclusão de conta) e exclusão de contas por admin
- Novo aceite do Termo/Política quando a versão muda; "Esqueci minha senha"
- Home pública, login novo e barra de navegação no topo

**Etapa 3 (entrega 09/11/2026)** — já implementado:
- Quiz por disciplina (até 10 perguntas), com correção e pontuação feitas no banco; o aluno nunca lê o gabarito
- Ranking geral e por disciplina (nome abreviado, com opção de aparecer como "Aluno anônimo")
- Guru: indica materiais da disciplina quando o aproveitamento fica abaixo de 60%
- Notas e faltas no formato do boletim da UMC (M2 = ND×70% + NI×30%; MD = (M1 + 2×M2)/3; limite de 25% de faltas) e Painel com indicadores e gráficos (aluno e admin)
- Banco inicial de 120 perguntas (8 disciplinas × 15), que será ampliado ao longo do projeto
- Ajustes de segurança da validação de 05/10 (limpeza de logs com prazo fixo, recuperação do MFA, limite de tentativas)
- Testes unitários (`npm test`) e testes de banco em `testes/`

O andamento das entregas está em `docs/CHECKLIST_ENTREGAS.md`.

O que muda no texto da monografia a cada entrega fica em `docs/ATUALIZACOES_MONOGRAFIA.md`.

## 🌐 Site publicado

https://tttrisos.github.io/EduGuru/ (publicado automaticamente pelo GitHub Actions a cada push na `main`).

## 🗄️ Banco de dados (Supabase)

Os scripts SQL ficam na raiz e devem ser rodados **em ordem** no SQL Editor do Supabase:
`supabase_00_tabelas_base.sql`, `supabase_setup_auth_logs.sql`, `supabase_atualizacao_2.sql` … `supabase_atualizacao_13.sql` (a 13 carrega o banco inicial de perguntas).
Os testes automáticos do banco ficam em `testes/` (cada um termina com um erro proposital que mostra o relatório e desfaz tudo).

Testes unitários do front-end: `npm test` (cobertura: `npm run test:cobertura`).

Diagramas (classes e BPMN) para a monografia: `docs/diagramas/`.

## 🚀 Como rodar o projeto localmente

1. Clone o repositório:
   ```bash
   git clone [https://github.com/tttrisos/EduGuru.git](https://github.com/tttrisos/EduGuru.git)