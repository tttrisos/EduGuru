# Mapa do código do EduGuru

Guia de estudo para entender **onde está cada parte**, **como elas se ligam** e **o caminho de cada ação**, do clique na tela até o banco.

**Dica para achar qualquer coisa:** no VS Code, **Ctrl+Shift+F** e busque o nome da função do banco (ex.: `responder_pergunta`). Aparecem a tela que a chama (`src/...`) e o script que a cria (`supabase/...`). **Ctrl+P** abre um arquivo pelo nome.

---

## 1. As três camadas

```
Navegador (React)                      Supabase (back-end como serviço)
─────────────────                      ─────────────────────────────────
Tela (.tsx)                            Auth: login, senha, duas etapas
  │ chama                              API REST: tabelas e funções
  ▼                                    PostgreSQL:
compartilhado/banco/supabase.ts ──────▶  RLS (quem pode ler/gravar cada linha)
  supabase.from('tabela')               funções (regras de negócio)
  supabase.rpc('funcao')                gatilhos (logs automáticos)
                                       Storage: arquivos privados
                                       pg_cron: limpezas diárias
```

- **Tela (`.tsx`):** mostra e coleta dados. Faz validações de conforto (ex.: avisar que a senha está fraca).
- **Regras puras (`.ts`):** cálculos sem tela (notas, filtros, localidade). São as partes testadas em `testes/`.
- **Banco (`supabase/*.sql`):** as regras que **não podem ser burladas** (corrigir o quiz, dar pontos, calcular a Bússola, quem vê o quê).
- Toda conversa com o banco passa por **um único arquivo**: `src/compartilhado/banco/supabase.ts`.

## 2. Onde começa

| Ordem | Arquivo | O que faz |
|---|---|---|
| 1 | `index.html` | Página base; carrega `src/principal.tsx` |
| 2 | `src/principal.tsx` | Aplica o tema, liga a sessão (`AuthProvider`) e as janelas de confirmação |
| 3 | `src/Rotas.tsx` | Decide qual tela abre em cada endereço (`#/painel`, `#/quiz`...) |
| 4 | `src/compartilhado/sessao/RotaProtegida.tsx` | Porteiro: login? duas etapas? aceite dos termos? admin? |
| 5 | `src/compartilhado/layout/LayoutLogado.tsx` | Barra do topo com o menu; a tela aparece embaixo |

## 3. O caminho de cada ação

### O aluno entra no sistema
1. `acesso/Login.tsx`: e-mail e senha → `entrar()` em `sessao/ContextoSessao.tsx` → Supabase Auth.
2. `acesso/Mfa.tsx`: código de 6 dígitos → a sessão vira **aal2** (o banco só libera dados com aal2: `sessao_mfa_ok`, script 05).
3. `sessao/RotaProtegida.tsx`: confere o aceite da versão atual dos termos (`VERSAO_TERMOS` em `tipos.ts`); se mudou, manda para `lgpd/NovoAceite.tsx`.
4. Abre `painel/Painel.tsx` → aluno vê `MinhaEvolucao.tsx`; admin vê `PainelAdmin.tsx`.

### O aluno abre "Minha evolução"
1. `painel/MinhaEvolucao.tsx` → `consultarDadosAluno()` busca tudo em paralelo:
   - `meu_desempenho` (script 11): acertos por disciplina;
   - `recomendacoes_guru` (11): materiais das disciplinas abaixo de 60%;
   - `minha_bussola` (18) e `minhas_areas_carreira` (17): áreas por interesse e por desempenho;
   - tabelas `notas` e `tentativas_quiz`, e `ranking` (11).
2. `painel/evolucao.ts` → `resumirEvolucao()`: dominadas (60%+), para revisar (< 60%), em andamento (< 5 respostas).
3. A tela monta a jornada **Aprender → Revisar → Descobrir → Direcionar**.

### O aluno pratica com o quiz
1. `quiz/Quiz.tsx` → `comecar()` → **`iniciar_quiz`** (script 19): sorteia até 10 perguntas (primeiro as ainda não acertadas), **embaralha as alternativas** e grava a ordem em `respostas_quiz.ordem_alternativas`. Devolve **sem gabarito**.
2. `verificar()` → **`responder_pergunta`** (19): traduz a letra da tela para a do cadastro, grava (não dá para trocar), corrige pela tabela `gabaritos` (que o aluno não consegue ler), calcula os pontos (só no 1º acerto) e devolve o gabarito na letra da tela.
3. `pedirDica()` → **`pedir_dica`** (19): duas erradas para riscar, uma vez por rodada.
4. `continuar()` na última → **`finalizar_quiz`** (19): soma acertos e pontos, fecha a rodada e grava `quiz_finalizado` no log.

### O aluno abre o Carreiras
1. `carreiras/Carreiras.tsx` → `minhas_areas_carreira` (17) + `minha_bussola` (18) → `combinarSugestoes()` em `bussola/afinidadeBussola.ts`.
2. `carreiras/ListaVagas.tsx` → `buscarVagas()` em **`carreiras/apiVagasGithub.ts`**:
   - `FONTES` = `backend-br/vagas` e `frontendbr/vagas`;
   - chama `https://api.github.com/repos/{fonte}/issues` (limite de 10 s);
   - `converterIssue()` guarda só título, etiquetas, data e link;
   - cache de 30 minutos no navegador; se o GitHub falhar, mostra a última lista com aviso.
3. `carreiras/localidade.ts` → `vagaNoLocal()`: remotas e no estado de SP por padrão.
4. "Candidatar-se" → abre a vaga no GitHub e chama **`registrar_clique_vaga`** (17): um clique por aluno e vaga.

### O aluno responde a Bússola
1. `bussola/Bussola.tsx` lê a tabela `bussola_afirmacoes` (18).
2. "Ver meu resultado" → **`salvar_bussola`** (18): confere as 16 respostas (1 a 5), calcula a afinidade de cada área ((média − 1) ÷ 4 × 100) e guarda só o resultado mais recente.
3. `afinidadeBussola.ts` → `destaques()`: até 3 áreas com 60%+ formam o pódio e entram nas sugestões do Carreiras.

### O aluno envia um material
1. `materiais/Materiais.tsx` → **`verificar_material`** (script 22): o banco diz se o material seria recusado (termos, dados pessoais, link sem https) e se o site é novo. **A regra existe só no banco.**
2. Grava na tabela `materiais`; o arquivo vai para o Storage (bucket privado `materiais`).
3. No banco, o gatilho `moderar_material` (22) aplica o filtro de novo: link de site da lista vai ao ar; arquivo de aluno e link de site novo ficam "Em análise".
4. Admin: `materiais/Moderacao.tsx` → **`moderar_material`** (15) ou **`aprovar_e_liberar_site`** (22), que publica e põe o site na lista; `materiais/TodosMateriais.tsx` gerencia todos.

### O admin muda as listas do filtro
1. `materiais/ListasDoFiltro.tsx` inclui e remove linhas das tabelas `filtro_sites` e `filtro_termos` (22). Só o admin altera (RLS); os alunos leem só os sites.
2. O banco padroniza o que foi digitado (`https://www.Site.com/x` → `site.com`; acentos e disfarces como `p0rn` → `porn`) e grava no log.
3. Termo novo → **`reanalisar_materiais_publicados`** (22): o que já estava publicado e tem o termo volta para a análise.
4. "Testar o filtro" chama `verificar_material` com um exemplo.

### O aluno registra notas
1. `notas/Notas.tsx` grava na tabela `notas` (12). O RLS deixa só o próprio aluno ler e gravar.
2. `notas/calculoNotas.ts`: M2 = ND × 70% + NI × 30%; MD = (M1 + 2 × M2) ÷ 3; exame e MF; mais de 40 faltas reprova.

### O usuário troca a senha estando logado
1. `conta/TrocarSenha.tsx` → `validarTrocaDeSenha()` em `acesso/regrasSenha.ts` (regras, confirmação, nova ≠ atual).
2. **`conferir_senha_atual`** (script 21): compara a senha atual com o hash guardado; 5 erros em 15 min bloqueiam.
3. `supabase.auth.updateUser()` grava a nova; log `senha_alterada`; os outros aparelhos são desconectados.

### Exclusão de conta
- Pelo próprio aluno: `conta/MinhaConta.tsx` → apaga os arquivos (`conta/arquivosDoUsuario.ts`) → **`excluir_minha_conta`** (07).
- Pelo admin: `administracao/Usuarios.tsx` → **`excluir_conta_usuario`** (07 e 20). Conta de administrador é protegida: a tela não mostra o botão e o banco recusa.

## 4. Onde está a segurança

| Proteção | Onde |
|---|---|
| Sem duas etapas, nenhuma tabela é lida | Política `mfa_obrigatorio` em todas as tabelas (scripts 05 em diante) e `sessao_mfa_ok()` (05) |
| Cada um só vê o que é seu (ex.: notas) | Políticas RLS de cada tabela (ex.: `notas_proprias`, script 12) |
| O aluno não vê o gabarito | Tabela `gabaritos` só para admin (11); correção só nas funções do quiz (19) |
| Regras que não podem ser burladas | Funções `security definer` que conferem quem chama (é admin? tem MFA?) |
| Telas de admin | `RotaProtegida` com `somenteAdmin` (tela) + `eh_admin()` no banco (o que vale) |
| Filtro de materiais | Gatilho `moderar_material` e tabelas `filtro_sites`/`filtro_termos` (22); a tela só pergunta (`verificar_material`) |
| Rastreabilidade | Gatilhos de log (02) e `registrar_evento_auth` (10 e 21); limpeza em 90 dias (06) |
