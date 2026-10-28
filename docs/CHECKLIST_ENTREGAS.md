# Checklist — Feedback do orientador (05/10) e entrega de 09/11

Legenda: ✅ feito no código/documentação · 👤 depende de vocês (não dá para fazer pelo código)
· ⚠️ atenção

Última atualização: 28/10/2026.

## Passo 0 — Diagnóstico
- ✅ Leitura do código, dos SQLs e do `docs/ATUALIZACOES_MONOGRAFIA.md`
- ⚠️ **Achado principal:** nada da Etapa 2 estava no GitHub (o `origin/main` só tinha o
  README e o `origin/entrega2809` parava em 27/09). Por isso o orientador não encontrou
  MFA, pg_cron etc. **Resolve com o push da branch `entrega0911`** (Passo 5).

---

## Orientador — obrigatório para o check de 05/10

### 1. Coerência entre documentação e código
| Item | Status | Onde |
|---|---|---|
| MFA/TOTP (`supabase.auth.mfa`) | ✅ já estava feito, só não estava no GitHub | `src/pages/Mfa.tsx`, `supabase_atualizacao_5.sql` |
| Limpeza **diária** via pg_cron, com função que não exige admin | ✅ já estava feito | `supabase_atualizacao_6.sql` (`limpar_logs_automatico`, 03h Brasília) |
| Exclusão de contas de alunos pelo admin | ✅ já estava feito | `src/pages/Usuarios.tsx`, `supabase_atualizacao_7.sql` |
| Gatilho de auditoria na tabela perfis | ✅ já estava feito | `supabase_atualizacao_4.sql` (`registrar_log_perfis`) |
| Registro do consentimento (RF13) | ✅ já estava feito | `supabase_atualizacao_4.sql` e `_8.sql`, `src/pages/NovoAceite.tsx` |

### 2. Materiais × RF08/RF14
- ✅ A política "qualquer logado escreve" foi trocada desde a atualização 4 (autor ou
  admin). Decisão: ajustar o RF08 (alunos enviam). Texto em `ATUALIZACOES_MONOGRAFIA.md`,
  Fase A → RF08 e Etapa 3 → "Item 2".

### 3. Requisitos de partes futuras
| Item | Status | Onde |
|---|---|---|
| Notas e faltas com RF, no formato do boletim da UMC (M1, ND, NI, M2, MD, MS, EX, MF, FT) | ✅ **implementado** (RF29), regra conferida com o boletim em 28/10 | `src/pages/Notas.tsx`, `src/lib/notas.ts`, `supabase_atualizacao_12.sql` |
| RFs de quiz, pontuação, ranking e Guru, com regras e critério de baixo desempenho | ✅ **implementados** (RF25–RF28) | `src/pages/Quiz.tsx`, `Ranking.tsx`, `Inicio.tsx`, `supabase_atualizacao_11.sql` |
| Ranking "de amigos" | ✅ retirado do escopo (justificativa no roteiro) | README e `ATUALIZACOES_MONOGRAFIA.md` |

### 4. Diagrama de classes
| Item | Status | Onde |
|---|---|---|
| Pergunta.disciplina vira FK | ✅ no banco | `supabase_atualizacao_11.sql` (`disciplina_id`) |
| Remover "cadastra (admin)" | ✅ no diagrama novo | `docs/diagramas/diagrama_classes.md` |
| Alternativas e gabarito | ✅ banco + diagrama | tabela `gabaritos` (só admin lê) |
| Guru ↔ Material, Material com disciplina | ✅ | `materiais.disciplina_id` |
| Quiz–Pergunta N:N, Quiz e Ranking ↔ Disciplina, sem Resultado/Diagnóstico | ✅ | diagrama novo |
| Exportar em alta resolução (Figura 2) | 👤 colar no mermaid.live e exportar SVG/PNG 4x | passo a passo no próprio arquivo |
| Figura 3 em alta resolução, sem "\n", com acentos | 👤 arquivo original de vocês | — |

### 5. BPMN
| Item | Status | Onde |
|---|---|---|
| MFA existe de verdade | ✅ | (ver item 1) |
| Fluxos "não" contínuos, sem cruzamentos, log das falhas, exceção de limite de tentativas | ✅ roteiro elemento por elemento · 👤 redesenhar | `docs/diagramas/bpmn.md` |
| Limite de tentativas implementado | ✅ 5 códigos errados → sai da sessão + log `mfa_bloqueado` | `src/pages/Mfa.tsx`, `supabase_atualizacao_10.sql` |

## Orientador — pode ser ajustado ao longo do projeto
| Item | Status | Onde |
|---|---|---|
| `limpar_logs_antigos`: 90 dias fixo na função | ✅ não recebe mais parâmetro | `supabase_atualizacao_10.sql`, `src/pages/Logs.tsx` |
| Log anônimo `login_falhou` | ✅ restringido (só e-mail com conta) + limitação documentada | `supabase_atualizacao_10.sql`, roteiro 2.2 |
| Versionar criação de disciplinas/perguntas/materiais | ✅ | `supabase_00_tabelas_base.sql` |
| Recuperação do MFA | ✅ admin redefine (RF31) | `src/pages/Usuarios.tsx`, `supabase_atualizacao_10.sql` |
| RF de exclusão de dados pelo titular | ✅ já é o RF15 (Minha conta) | roteiro 2.4 |
| Aluno não lê o gabarito (RLS) | ✅ testado | `gabaritos` + `testes/teste_gamificacao.sql` |
| RNF05/RNF06 mensuráveis + RNF de desempenho | ✅ texto sugerido · 👤 conferir o RNF06 de vocês | roteiro 3.1 |
| Classes novas «Projetada», "\n" e acentos | ✅ todas implementadas (nada «Projetada») | diagrama novo |
| Arquitetura sem Tailwind + Storage, ViaCEP, GitHub Pages | ✅ texto/caixas · 👤 redesenhar a Figura 1 | roteiro 1.3 |
| BPMN do processo central | ✅ roteiro · 👤 desenhar | `docs/diagramas/bpmn.md` |
| Apêndices A, B e C | ✅ conteúdo pronto · 👤 colar na monografia | páginas `/termos`, `/privacidade` e tabela no roteiro |
| Tirar marcações amarelas, tempo presente | 👤 | — |
| Fundamentação teórica (Deterding, Kapp...) | ✅ texto-base · 👤 conferir nas obras | roteiro "Fundamentação teórica" |
| Referências em ordem alfabética, "REFERÊNCIAS" sem número | ✅ entradas ABNT novas · 👤 reorganizar a lista | roteiro "Formatação" |

---

## Coorientador — entrega de 09/11
| Exigência | Status | Onde |
|---|---|---|
| ≥ 75% dos RFs com front + back integrados | ✅ RF01–RF31 implementados (ver lista abaixo) | — |
| Formulários com validação e tratamento de entradas inválidas | ✅ Perguntas, Disciplinas, Notas, Materiais (link), Quiz (todas respondidas), MFA; validações repetidas no banco (`criar_pergunta`, `check`) | — |
| Dashboard com Big Numbers e gráficos | ✅ aluno (6 indicadores + 2 gráficos + Guru) e admin (6 indicadores + 2 gráficos) | `src/pages/Inicio.tsx` |
| Persistência e regras de negócio | ✅ tudo gravado no Supabase; regras no banco e em `src/lib/notas.ts` | — |
| Monografia: regras de negócio, funcionalidades e decisões técnicas | ✅ texto pronto · 👤 passar para o PDF | `docs/ATUALIZACOES_MONOGRAFIA.md` → Etapa 3 |
| Branch `entrega0911` no GitHub | ✅ criada localmente · 👤 **push** (Passo 5) | — |
| Vídeo de até 7 min (sem login) | 👤 roteiro sugerido abaixo | — |
| Sem regressões | ✅ build, lint e testes passando; testes de banco atualizados · 👤 rodar os testes manuais | roteiro "Testes manuais" 1–20 |
| (23/11) testes unitários, cobertura ≥ 50% | ✅ base pronta: Vitest + 22 testes · ⚠️ falta ampliar | `npm test`, `npm run test:cobertura` |
| Banco de perguntas grande, com plano de ampliação | ✅ 120 perguntas (8 disciplinas × 15) com gabarito | `supabase_atualizacao_13.sql`; texto no RF25 do roteiro |

RFs implementados: RF01–RF04 (login, cadastro, MFA), RF05–RF09 (disciplinas, perguntas,
materiais, logs), RF10 (limpeza), RF11–RF13 (termos/consentimento), RF14 (RLS), RF15
(exclusão de conta), RF21 (Minha conta), RF22 (novo aceite), RF23 (Home), RF24 (esqueci a
senha), RF25 (quiz), RF26 (pontuação), RF27 (ranking), RF28 (Guru), RF29 (notas/faltas),
RF30 (painel), RF31 (redefinir MFA). Os números de RF05–RF09 e RF16–RF20 seguem a
monografia de vocês; confiram se algum deles ainda descreve algo não implementado.

---

## Passo 5 — O que vocês precisam fazer (nesta ordem)
1. 👤 **Rodar no SQL Editor do Supabase**, em ordem: `supabase_atualizacao_10.sql`,
   `_11.sql`, `_12.sql`, `_13.sql` (a 13 cadastra as 120 perguntas e mostra uma tabela
   de conferência no final). Se a 12 já tinha sido rodada antes de 28/10, rode de novo:
   ela troca a coluna `m2` pelas colunas do boletim (`nd`, `ni`, `ms`).
   ⚠️ A 11 apaga a coluna de texto antiga `perguntas.disciplina`: as perguntas antigas ficam
   "Incompletas" e precisam ser recadastradas com alternativas e gabarito.
2. 👤 Rodar `testes/teste_gamificacao.sql` e `testes/teste_fase_a.sql` (todas as linhas
   devem sair `[OK]`; o erro no final é proposital).
3. ✅ Banco inicial de perguntas: já vem na atualização 13. 👤 Revisar as perguntas e
   ligar alguns materiais às disciplinas (para o Guru ter o que indicar no vídeo).
4. 👤 Fazer os testes manuais 1 a 20 (`ATUALIZACOES_MONOGRAFIA.md`, fim do arquivo).
5. 👤 **Enviar ao GitHub:** `git push -u origin entrega0911` (e, se quiserem o site no ar,
   abrir um Pull Request da `entrega0911` para a `main`: o GitHub Actions publica sozinho).
6. 👤 Passar as mudanças do roteiro para a monografia e redesenhar as figuras.
7. 👤 Gravar o vídeo e avisar o orientador.

## Roteiro sugerido para o vídeo (até 7 min, sem login)
1. (0:00) Painel do aluno: big numbers e gráficos.
2. (0:45) Quiz: escolher disciplina, tentar finalizar em branco (validação), responder,
   resultado com pontos e Guru.
3. (2:00) Ranking geral e por disciplina; Minha conta → ocultar nome → "Aluno anônimo".
4. (2:45) Notas: nota inválida (erro), salvar, situação calculada, alerta de faltas.
5. (3:30) Materiais com disciplina e anexo PDF.
6. (4:00) Admin: painel do admin, cadastrar pergunta (validações), disciplina com total de
   aulas, Usuários (redefinir MFA), Logs (limpeza manual).
7. (5:30) LGPD: Termo/Política 1.2, novo aceite, baixar meus dados (JSON).
8. (6:15) Banco: mostrar `teste_gamificacao.sql` com todas as linhas OK.
