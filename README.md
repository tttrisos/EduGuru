# EduGuru

Plataforma web acadêmica gamificada para acompanhar e personalizar a jornada de aprendizagem.

Projeto Final de Curso (PFC/TCC) de Sistemas de Informação da Universidade de Mogi das Cruzes (UMC).

**Site publicado:** https://tttrisos.github.io/EduGuru/

## Sobre o projeto

O EduGuru coloca o **aluno e a evolução da aprendizagem** no centro. Na tela **Minha evolução**, o aluno acompanha uma jornada em quatro etapas:

1. **Aprender:** pratica as disciplinas do curso (quiz) e vê o que já domina (60% ou mais de acertos).
2. **Revisar:** abaixo de 60%, o **Guru** indica materiais da disciplina.
3. **Descobrir:** a **Bússola EduGuru** (autoavaliação de interesses) mostra as áreas da tecnologia que combinam com ele.
4. **Direcionar:** o **EduGuru Carreiras** mostra vagas reais dessas áreas, remotas ou em SP.

A plataforma também centraliza notas e faltas no formato do boletim da UMC. Pontos e ranking motivam, mas não são o centro.

Público-alvo: alunos da UMC de Sistemas de Informação, Análise e Desenvolvimento de Sistemas e Engenharia de Software.

## Funcionalidades

- **Minha evolução (painel do aluno):** jornada Aprender → Revisar → Descobrir → Direcionar, aproveitamento geral, disciplinas dominadas e para revisar, média da faculdade, gráficos e o Guru.
- **Prática com quiz:** até 10 perguntas de uma disciplina, uma por vez, com correção na hora (feita no banco). Perguntas e **alternativas embaralhadas para cada aluno a cada rodada**, com prioridade para as que ele ainda não acertou, o que impede decorar a posição da resposta. Dica 50/50, ilustrações e sons.
- **Pontuação e ranking:** Fácil 10, Médio 20, Difícil 30, só no 1º acerto de cada pergunta; ranking geral e por disciplina, com opção de aparecer como "Aluno anônimo".
- **Guru:** indica materiais da disciplina quando o aproveitamento fica abaixo de 60%.
- **Materiais da comunidade:** links e arquivos dos alunos, com filtro automático, moderação, denúncias e perfil público; o admin gerencia todos, inclusive em massa. As **listas do filtro** (sites permitidos e termos bloqueados) ficam no banco e o admin as edita pela tela, sem mexer no código; link de site novo vai para a análise e pode ser liberado com um clique.
- **Bússola EduGuru:** autoavaliação de interesses opcional (16 afirmações de 1 a 5). Não é teste vocacional: é uma orientação simples.
- **EduGuru Carreiras:** vagas das comunidades backend-br e frontendbr (API do GitHub), ligadas ao desempenho e aos interesses, com filtros de área, nível e localidade.
- **Notas e faltas:** campos do boletim da UMC (M1, ND, NI, MS, Exame), cálculo de M2, MD e MF e limite de 40 faltas.
- **Minha conta:** ver, corrigir, baixar e excluir os dados, **trocar a senha estando logado** (com a senha atual; a nova precisa ser diferente) e sair do ranking.
- **Segurança e LGPD:** verificação em duas etapas **opcional para alunos** (ativada e desativada em Minha conta; quem ativa precisa do código em todo login) e **obrigatória para administradores**, RLS em todas as tabelas, logs de auditoria (90 dias), Termo e Política com novo aceite a cada versão; conta de administrador protegida contra exclusão.

## Tecnologias

- **Front-end:** React, TypeScript e Vite, com CSS próprio (tema escuro e claro), publicado no GitHub Pages pelo GitHub Actions.
- **Back-end:** Supabase (Auth, banco PostgreSQL com Row Level Security, Storage e pg_cron).
- **Captcha:** Cloudflare Turnstile (grátis) no login, no cadastro e no "esqueci a senha". A chave pública fica em `compartilhado/componentes/Captcha.tsx`; a secreta, só no Supabase (Authentication → Attack Protection).
- **E-mails (confirmação de cadastro e redefinição de senha):** Brevo, ligado ao Supabase Auth por SMTP (o envio padrão do Supabase tem limite muito baixo). Configuração: Supabase → Authentication → Emails → SMTP Settings; não há chave no código.
- **Código por e-mail em aparelho novo:** o próprio banco envia pela API do Brevo (extensão `pg_net`); a chave fica no Vault do Supabase e a proteção é ligada em `config_seguranca` (passo a passo no topo do script `25`).
- **APIs externas:** API do GitHub (vagas do EduGuru Carreiras) e ViaCEP (cidade e estado no cadastro, opcional).
- **Testes:** Vitest (`npm test`).

## Estrutura do projeto

Tudo em português. As pastas de `src/funcionalidades/` são numeradas na **ordem do menu do site** (1 = público, 2 = acesso, 3 = Minha evolução, 4 = Estudar, 5 = Bússola e Carreiras, 6 = Minha conta, 7 = administração). Cada pasta reúne **tudo** da funcionalidade: as telas (`.tsx`), as regras (`.ts`, testáveis) e o estilo (`.css`). O que é usado por várias telas fica em `src/compartilhado/`. Os testes ficam em `testes/`, nas mesmas pastas. **Todo arquivo começa com um cabeçalho** dizendo o que faz, em qual tela aparece e com quais funções do banco conversa. O mapa completo, com o caminho de cada ação (ex.: "o que acontece quando o aluno responde uma pergunta"), está em [`docs/MAPA_DO_CODIGO.md`](docs/MAPA_DO_CODIGO.md).

```
eduguru/
├── index.html                    Página base; carrega src/principal.tsx
├── src/
│   ├── principal.tsx             Ponto de entrada: tema, sessão e janelas de confirmação
│   ├── Rotas.tsx                 Endereço de cada tela (#/quiz, #/carreiras...) e quem pode abrir
│   ├── compartilhado/            Usado por várias telas
│   │   ├── banco/                Conexão com o Supabase (supabase.ts), links de arquivos e logs
│   │   ├── sessao/               Quem está logado (ContextoSessao.tsx) e o porteiro das telas (RotaProtegida.tsx)
│   │   ├── layout/               Barra superior com o menu (LayoutLogado.tsx) e rodapé
│   │   ├── componentes/          Peças de tela: Ajuda, Dialogo, GraficoBarras, NumeroDestaque, TextoRico
│   │   ├── utilitarios/          Tema escuro/claro e negrito nos textos
│   │   ├── estilos/              global.css (cores, botões, campos, tabelas)
│   │   └── tipos.ts              Formato dos dados que vêm do banco
│   └── funcionalidades/          Uma pasta por item do menu, na ordem do site
│       ├── 1_publico/            Sem login: página inicial (inicio/) e Termo, Política e novo aceite (lgpd/)
│       ├── 2_acesso/             Login, cadastro, código do aplicativo, código por e-mail, esqueci/redefinir senha
│       ├── 3_minha_evolucao/     Menu "Minha evolução": painel do aluno (painel/), notas e faltas (notas/), disciplinas (disciplinas/)
│       ├── 4_estudar/            Menu "Estudar": quiz/, ranking/ e materiais/ (com a moderação do admin)
│       ├── 5_carreira/           Bússola EduGuru (bussola/) e EduGuru Carreiras (carreiras/)
│       ├── 6_conta/              Minha conta: dados, senha, verificação em duas etapas, acessos, exclusão
│       └── 7_administracao/      Só admin: painel, perguntas, usuários e logs
├── testes/                       Testes (Vitest), com as mesmas pastas de src/ (ex.: testes/4_estudar/quiz/)
├── supabase/                     Scripts do banco (rodar em ordem, de 01 a 28)
├── docs/                         Mapa do código e integrações com as APIs externas
├── public/                       Ícone do site e ilustrações das perguntas
└── .github/workflows/            Publicação automática no GitHub Pages
```

## Onde está cada funcionalidade

| Funcionalidade | Pasta em `src/funcionalidades/` | Banco (`supabase/`) |
|---|---|---|
| Página inicial (RF23) | `1_publico/inicio/Inicio.tsx` | — |
| Login e cadastro (RF01, RF02), CEP via ViaCEP (RF05) | `2_acesso/Login.tsx`, `2_acesso/regrasSenha.ts` | `02`, `04` |
| Verificação em duas etapas (RF03, RF04): código no login e ativar/desativar em Minha conta | `2_acesso/Mfa.tsx`, `2_acesso/fatoresMfa.ts`, `6_conta/VerificacaoDuasEtapas.tsx`, regra em `compartilhado/sessao/nivelSessao.ts` | `05`, `23` |
| Esqueci minha senha (RF24) | `2_acesso/EsqueciSenha.tsx`, `2_acesso/RedefinirSenha.tsx` | `09` |
| Trocar a senha estando logado | `6_conta/TrocarSenha.tsx` | `21` (`conferir_senha_atual`) |
| Termo, Política e novo aceite (RF11 a RF13, RF22) | `1_publico/lgpd/` | `08` |
| Minha conta e exclusão de conta (RF15, RF21) | `6_conta/MinhaConta.tsx`, `6_conta/arquivosDoUsuario.ts` | `07` |
| Minha evolução, painel do aluno (RF25) | `3_minha_evolucao/painel/MinhaEvolucao.tsx`, `3_minha_evolucao/painel/evolucao.ts` | `11` (`meu_desempenho`), `17`, `18` |
| Painel do admin (RF25, RF32) | `7_administracao/PainelAdmin.tsx` | `12` (`estatisticas_admin`), `17`, `18` |
| Disciplinas (RF06) | `3_minha_evolucao/disciplinas/` | `01`, `13` |
| Banco de perguntas (RF07) | `7_administracao/Perguntas.tsx` | `11` (`criar_pergunta`), `14`, `16` (`editar_pergunta`) |
| Materiais, filtro, comunidade, denúncia e perfil (RF08, RF28, RF29) | `4_estudar/materiais/` | `03`, `04`, `15` |
| Moderação e gestão de todos os materiais (RF27) | `4_estudar/materiais/Moderacao.tsx`, `4_estudar/materiais/TodosMateriais.tsx` | `15` (`moderar_material`), `22` (`aprovar_e_liberar_site`) |
| Listas do filtro de materiais (RF08, RF27) | `4_estudar/materiais/ListasDoFiltro.tsx` | `22` (`filtro_sites`, `filtro_termos`, `verificar_material`) |
| Quiz embaralhado e pontuação (RF16, RF17) | `4_estudar/quiz/Quiz.tsx` | `11`, `19` (`iniciar_quiz`, `responder_pergunta`, `finalizar_quiz`, `pedir_dica`) |
| Guru (RF19) | `3_minha_evolucao/painel/MinhaEvolucao.tsx` | `11` (`recomendacoes_guru`) |
| Ranking (RF18) | `4_estudar/ranking/Ranking.tsx` | `11` e `27` (`ranking`) |
| Notas e faltas (RF20) | `3_minha_evolucao/notas/` | `12` |
| Usuários, MFA e exclusão de contas (RF26) | `7_administracao/Usuarios.tsx` | `07`, `10`, `20` (admin protegido) |
| Logs de auditoria, com filtros, e limpeza (RF09, RF10) | `7_administracao/Logs.tsx`, regras em `compartilhado/utilitarios/filtroLogs.ts` | `02`, `06`, `10`, `24` |
| Últimos acessos, sair dos outros aparelhos e registros com filtros (RF21) | `6_conta/AcessosEAparelhos.tsx`, `6_conta/RegistrosAtividade.tsx` | `24` (`meus_acessos`) |
| Código por e-mail ao entrar em aparelho novo e aparelhos lembrados (RF03, RF21) | `2_acesso/CodigoEmail.tsx`, regras em `2_acesso/regrasCodigoEmail.ts` | `25` (`situacao_codigo_email`, `enviar_codigo_email`, `confirmar_codigo_email`) |
| Captcha "não sou um robô" no login, cadastro e esqueci a senha | `compartilhado/componentes/Captcha.tsx` (Cloudflare Turnstile) | — (conferido pelo Supabase Auth) |
| Carreiras (RF30 a RF32) | `5_carreira/carreiras/` (`apiVagasGithub.ts` = API do GitHub) | `17` |
| Bússola EduGuru (RF33) | `5_carreira/bussola/` | `18` |
| Regras de acesso, RLS (RF14) | — | `02`, `04`, `05`, `23` (MFA exigido de quem ativou e do admin) |

## Banco de dados

Os scripts da pasta `supabase/` criam o banco completo quando executados **em ordem** no SQL Editor do Supabase:

| Script | O que cria |
|---|---|
| `01_tabelas_base.sql` | Tabelas de disciplinas, perguntas e materiais |
| `02_perfis_e_logs.sql` | Perfis (aluno/admin), regras de acesso e logs de auditoria |
| `03_arquivos_materiais.sql` | Envio de arquivos PDF/DOCX (bucket privado) |
| `04_seguranca_lgpd.sql` | Cidade/estado, aceite dos termos, permissões do perfil, dono dos materiais |
| `05_verificacao_duas_etapas.sql` | MFA exigido pelo banco em todas as tabelas (regra suavizada no 23) |
| `06_limpeza_automatica_logs.sql` | Exclusão diária dos logs com mais de 90 dias |
| `07_minha_conta.sql` | Exclusão de conta pelo titular e pelo admin |
| `08_novo_aceite.sql` | Novo aceite quando os termos mudam de versão |
| `09_esqueci_senha.sql` | Log do pedido de redefinição de senha |
| `10_ajustes_seguranca.sql` | Logs de acesso, limpeza manual, redefinição de MFA e lista de usuários |
| `11_quiz_ranking_guru.sql` | Quiz, gabaritos, pontuação, ranking e Guru |
| `12_notas_e_painel.sql` | Notas e faltas e indicadores do painel do admin |
| `13_disciplinas_cursos.sql` | Disciplinas da grade de SI, ADS e ES |
| `14_perguntas_iniciais.sql` | Banco inicial de 120 perguntas (8 disciplinas), com negrito e explicações; revisado em 16/11 para a certa não ser sempre a alternativa mais longa (rodar de novo atualiza as alternativas) |
| `15_materiais_comunidade_quiz.sql` | Materiais da comunidade (filtro, moderação, denúncias, perfil público), dica 50/50 e ilustrações |
| `16_editar_perguntas.sql` | Edição de perguntas (pergunta, gabarito e explicação juntos) |
| `17_carreiras.sql` | EduGuru Carreiras: áreas, ligação disciplina → área, áreas sugeridas, cliques e totais do painel |
| `18_bussola.sql` | Bússola EduGuru: afirmações, resultado do aluno, cálculo da afinidade e totais do painel |
| `19_quiz_embaralhado.sql` | Quiz embaralhado para cada aluno (ordem das alternativas por rodada, prioridade para o que ainda não acertou) |
| `20_proteger_admin.sql` | Administrador não pode excluir a conta de outro administrador |
| `21_trocar_senha.sql` | Conferência da senha atual para trocar a senha estando logado |
| `22_filtro_gerenciavel.sql` | Filtro de materiais em tabelas editáveis pelo admin; site novo vai para a análise |
| `23_mfa_opcional.sql` | Verificação em duas etapas opcional para alunos e obrigatória para administradores |
| `24_acessos_e_filtros_logs.sql` | Últimos acessos em Minha conta, "sair dos outros aparelhos" no log e índices para os filtros dos logs |
| `25_codigo_email_aparelho_novo.sql` | Código por e-mail ao entrar em aparelho novo (quem não usa o aplicativo), aparelhos lembrados por 30 dias; começa desligado (ver o passo a passo no topo) |
| `26_sessao_encerrada_na_hora.sql` | "Sair dos outros aparelhos" vale na hora: as regras de segurança conferem se a sessão ainda existe; Minha conta marca "este aparelho" |
| `27_ranking_admin_ve_anonimos.sql` | No ranking, só o administrador vê quem é o "Aluno anônimo" (nome entre parênteses); os colegas veem só "Aluno anônimo". Apaga qualquer versão antiga da função `ranking` e recria a oficial |
| `28_perguntas_mais_disciplinas.sql` | Mais 75 perguntas em 5 disciplinas (Software Básico, Paradigmas de Orientação a Objetos, Gestão de Projetos, Inteligência de Negócios e Governança de TI): 13 disciplinas e 195 perguntas no total |

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

- `docs/MAPA_DO_CODIGO.md` — onde está cada parte e o caminho de cada ação (para estudar o código).
- `docs/INTEGRACAO_GITHUB_VAGAS.md` — integração com a API do GitHub (vagas do EduGuru Carreiras).
- `docs/INTEGRACAO_VIACEP.md` — integração com a API ViaCEP.
