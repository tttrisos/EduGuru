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
| 4 | `src/compartilhado/sessao/RotaProtegida.tsx` | Porteiro: login? código das duas etapas (se a conta exige)? aceite dos termos? admin? |
| 5 | `src/compartilhado/layout/LayoutLogado.tsx` | Barra do topo com o menu; a tela aparece embaixo |

## 3. O caminho de cada ação

### O aluno entra no sistema
1. `2_acesso/Login.tsx`: e-mail, senha e o captcha "não sou um robô" (`componentes/Captcha.tsx`, Cloudflare Turnstile) → `entrar()` em `sessao/ContextoSessao.tsx` → Supabase Auth, que confere o captcha. O log de login guarda o tipo de aparelho (`utilitarios/aparelho.ts`).
2. A regra das duas etapas está em `sessao/nivelSessao.ts` (com testes) e no banco (`sessao_mfa_ok` e `eh_admin`, script 23):
   - aluno **sem** MFA: entra só com a senha (aal1), mas, num **aparelho novo**, `Mfa.tsx` mostra `2_acesso/CodigoEmail.tsx`: o banco manda um código para o e-mail (`enviar_codigo_email`, script 25) e só libera a sessão depois de `confirmar_codigo_email`. "Lembrar este aparelho" guarda um token no navegador (`regrasCodigoEmail.ts`); nos próximos 30 dias, `situacao_codigo_email` libera só com a senha;
   - quem **ativou** o MFA: vai para `2_acesso/Mfa.tsx`, digita o código e a sessão vira **aal2**; sem o código, o banco não devolve nada;
   - **administrador**: código obrigatório; sem MFA cadastrado, `Mfa.tsx` obriga a cadastrar.
3. `sessao/RotaProtegida.tsx`: confere o aceite da versão atual dos termos (`VERSAO_TERMOS` em `tipos.ts`); se mudou, manda para `1_publico/lgpd/NovoAceite.tsx`.
4. Abre `3_minha_evolucao/painel/Painel.tsx` → aluno vê `MinhaEvolucao.tsx`; admin vê `PainelAdmin.tsx`.

### O aluno abre "Minha evolução"
1. `3_minha_evolucao/painel/MinhaEvolucao.tsx` → `consultarDadosAluno()` busca tudo em paralelo:
   - `meu_desempenho` (script 11): acertos por disciplina;
   - `recomendacoes_guru` (11): materiais das disciplinas abaixo de 60%;
   - `minha_bussola` (18) e `minhas_areas_carreira` (17): áreas por interesse e por desempenho;
   - tabelas `notas` e `tentativas_quiz`, e `ranking` (11).
2. `3_minha_evolucao/painel/evolucao.ts` → `resumirEvolucao()`: dominadas (60%+), para revisar (< 60%), em andamento (< 5 respostas).
3. A tela monta a jornada **Aprender → Revisar → Descobrir → Direcionar**.

### O aluno pratica com o quiz
1. `4_estudar/quiz/Quiz.tsx` → `comecar()` → **`iniciar_quiz`** (script 19): sorteia até 10 perguntas (primeiro as ainda não acertadas), **embaralha as alternativas** e grava a ordem em `respostas_quiz.ordem_alternativas`. Devolve **sem gabarito**.
2. `verificar()` → **`responder_pergunta`** (19): traduz a letra da tela para a do cadastro, grava (não dá para trocar), corrige pela tabela `gabaritos` (que o aluno não consegue ler), calcula os pontos (só no 1º acerto) e devolve o gabarito na letra da tela.
3. `pedirDica()` → **`pedir_dica`** (19): duas erradas para riscar, uma vez por rodada.
4. `continuar()` na última → **`finalizar_quiz`** (19): soma acertos e pontos, fecha a rodada e grava `quiz_finalizado` no log.

### O aluno abre o Carreiras
1. `5_carreira/carreiras/Carreiras.tsx` → `minhas_areas_carreira` (17) + `minha_bussola` (18) → `combinarSugestoes()` em `5_carreira/bussola/afinidadeBussola.ts`.
2. `5_carreira/carreiras/ListaVagas.tsx` → `buscarVagas()` em **`5_carreira/carreiras/apiVagasGithub.ts`**:
   - `FONTES` = `backend-br/vagas` e `frontendbr/vagas`;
   - chama `https://api.github.com/repos/{fonte}/issues` (limite de 10 s);
   - `converterIssue()` guarda só título, etiquetas, data e link;
   - cache de 30 minutos no navegador; se o GitHub falhar, mostra a última lista com aviso.
3. `5_carreira/carreiras/localidade.ts` → `vagaNoLocal()`: remotas e no estado de SP por padrão.
4. "Candidatar-se" → abre a vaga no GitHub e chama **`registrar_clique_vaga`** (17): um clique por aluno e vaga.

### O aluno responde a Bússola
1. `5_carreira/bussola/Bussola.tsx` lê a tabela `bussola_afirmacoes` (18).
2. "Ver meu resultado" → **`salvar_bussola`** (18): confere as 16 respostas (1 a 5), calcula a afinidade de cada área ((média − 1) ÷ 4 × 100) e guarda só o resultado mais recente.
3. `afinidadeBussola.ts` → `destaques()`: até 3 áreas com 60%+ formam o pódio e entram nas sugestões do Carreiras.

### O aluno envia um material
1. `4_estudar/materiais/Materiais.tsx` → **`verificar_material`** (script 22): o banco diz se o material seria recusado (termos, dados pessoais, link sem https) e se o site é novo. **A regra existe só no banco.**
2. Grava na tabela `materiais`; o arquivo vai para o Storage (bucket privado `materiais`).
3. No banco, o gatilho `moderar_material` (22) aplica o filtro de novo: link de site da lista vai ao ar; arquivo de aluno e link de site novo ficam "Em análise".
4. Admin: `4_estudar/materiais/Moderacao.tsx` → **`moderar_material`** (15) ou **`aprovar_e_liberar_site`** (22), que publica e põe o site na lista; `4_estudar/materiais/TodosMateriais.tsx` gerencia todos.

### O admin muda as listas do filtro
1. `4_estudar/materiais/ListasDoFiltro.tsx` inclui e remove linhas das tabelas `filtro_sites` e `filtro_termos` (22). Só o admin altera (RLS); os alunos leem só os sites.
2. O banco padroniza o que foi digitado (`https://www.Site.com/x` → `site.com`; acentos e disfarces como `p0rn` → `porn`) e grava no log.
3. Termo novo → **`reanalisar_materiais_publicados`** (22): o que já estava publicado e tem o termo volta para a análise.
4. "Testar o filtro" chama `verificar_material` com um exemplo.

### O aluno registra notas
1. `3_minha_evolucao/notas/Notas.tsx` grava na tabela `notas` (12). O RLS deixa só o próprio aluno ler e gravar.
2. `3_minha_evolucao/notas/calculoNotas.ts`: M2 = ND × 70% + NI × 30%; MD = (M1 + 2 × M2) ÷ 3; exame e MF; mais de 40 faltas reprova.

### O aluno ativa ou desativa a verificação em duas etapas
1. `6_conta/VerificacaoDuasEtapas.tsx` (em Minha conta) usa `2_acesso/fatoresMfa.ts`.
2. **Ativar:** `iniciarCadastroTotp()` gera o QR Code → o aluno digita um código → `confirmarCodigo()` → sessão aal2 e log `mfa_ativado`. A partir daí, o banco exige o código em todo login dessa conta.
3. **Desativar:** senha atual (**`conferir_senha_atual`**, 21) + sessão que digitou o código (o Supabase exige) → `mfa.unenroll()` → log `mfa_desativado`. O admin não vê o botão.

### O usuário troca a senha estando logado
1. `6_conta/TrocarSenha.tsx` → `validarTrocaDeSenha()` em `2_acesso/regrasSenha.ts` (regras, confirmação, nova ≠ atual).
2. **`conferir_senha_atual`** (script 21): compara a senha atual com o hash guardado; 5 erros em 15 min bloqueiam.
3. `supabase.auth.updateUser()` grava a nova; log `senha_alterada`; os outros aparelhos são desconectados.

### O usuário confere os acessos e os registros (Minha conta)
1. `6_conta/AcessosEAparelhos.tsx` → **`meus_acessos`** (24): últimos logins com o aparelho e senhas erradas nos últimos 30 dias. "Sair dos outros aparelhos" → `signOut({ scope: 'others' })`, log `sessoes_encerradas` e `esquecer_outros_aparelhos` (25). Também lista os aparelhos lembrados ("este aparelho" marcado). O banco recusa na hora as sessões encerradas (`sessao_ativa`, script 26), e `ContextoSessao.tsx` confere a cada minuto e ao voltar para a aba (`getUser` → `session_not_found`), mandando o outro aparelho para o login com aviso.
2. `6_conta/RegistrosAtividade.tsx`: filtros por tipo, período e busca (`utilitarios/filtroLogs.ts`), no navegador.
3. Admin: `7_administracao/Logs.tsx` usa os mesmos filtros, mais e-mail e tabela, direto na consulta ao banco.

### Exclusão de conta
- Pelo próprio aluno: `6_conta/MinhaConta.tsx` → apaga os arquivos (`6_conta/arquivosDoUsuario.ts`) → **`excluir_minha_conta`** (07).
- Pelo admin: `7_administracao/Usuarios.tsx` → **`excluir_conta_usuario`** (07 e 20). Conta de administrador é protegida: a tela não mostra o botão e o banco recusa.

## 4. Onde está a segurança

| Proteção | Onde |
|---|---|
| Quem ativou as duas etapas não entra só com a senha | Política `mfa_obrigatorio` em todas as tabelas (05 em diante), que chama `sessao_mfa_ok()`: aal2 **ou** conta sem MFA (23) |
| Admin sempre com o código | `eh_admin()` exige aal2 (`sessao_aal2()`, 23) |
| Cada um só vê o que é seu (ex.: notas) | Políticas RLS de cada tabela (ex.: `notas_proprias`, script 12) |
| O aluno não vê o gabarito | Tabela `gabaritos` só para admin (11); correção só nas funções do quiz (19) |
| Regras que não podem ser burladas | Funções `security definer` que conferem quem chama (é admin? tem MFA?) |
| Telas de admin | `RotaProtegida` com `somenteAdmin` (tela) + `eh_admin()` no banco (o que vale) |
| Filtro de materiais | Gatilho `moderar_material` e tabelas `filtro_sites`/`filtro_termos` (22); a tela só pergunta (`verificar_material`) |
| Rastreabilidade | Gatilhos de log (02) e `registrar_evento_auth` (10 e 21); limpeza em 90 dias (06) |
