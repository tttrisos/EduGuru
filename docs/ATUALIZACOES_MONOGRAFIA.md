# Atualizações da monografia — roteiro página por página

Este arquivo diz **exatamente onde** cada mudança entra no documento da monografia, na
ordem das páginas, para o texto andar junto com o código.

- **Base:** `[MONOGRAFIA]EduGuru.pdf` na **versão de 05/11/2026, 44 páginas** (já com Resumo,
  Introdução, 1.3, Figura 1 e capítulo 2 até a 2.5 passados). Os itens já aplicados saíram deste
  arquivo; ficou só o que falta.
- **Código conferido:** branch `trabalho`, scripts `supabase/01` a `16`, em 05/11/2026.
- **Numeração dos RFs:** a mesma do PDF. RF16 a RF20 continuam sendo quiz, pontuação, ranking,
  Guru e notas (agora implementados), e os RFs novos vão de **RF21 a RF29**. O código, o
  README e o checklist usam esta mesma numeração.

**Como usar:** siga as páginas em ordem. Cada item tem:
- **Localizar:** um trecho que existe no PDF (use Ctrl+F no Word);
- **Ação:** SUBSTITUIR, ACRESCENTAR DEPOIS, APAGAR ou INSERIR (seção/RF novo);
- o texto final, pronto para colar (entre aspas ou em bloco `>`).

Ao passar um item, pode apagá-lo daqui (ou marcar `[x]`). As páginas citadas são as do PDF de
05/11 (44 págs.) e mudam conforme o texto entra; guiem-se pelo **Localizar**.

**Regra para as próximas mudanças:** toda funcionalidade nova entra **neste arquivo, na
página/seção certa** (não no fim), no mesmo dia em que o código muda.

**Atenção ao colar:** os trechos deste arquivo usam crases (`assim`) só para marcar nomes de
código. **No Word, não cole as crases**: escreva o nome sem elas (ou em itálico).

---

## 0. Correções no que já foi passado (revisão de 05/11)

- [x] **Crases aparecendo no texto** (págs. 9–12): `iniciar_quiz`, `responder_pergunta`,
  `finalizar_quiz`, `src/funcionalidades`, `src/compartilhado`, `testes`, `supabase`,
  `public/ilustracoes`, `supabase.auth.mfa`, `aal2` (3 vezes) e `security definer`. Apagar as
  crases (no Word: Ctrl+H, localizar `` ` `` e substituir por nada) e, se quiserem, deixar esses
  nomes em itálico.
- [x] **Resumo (pág. 3) e Abstract (pág. 4) em dois parágrafos.** A ABNT (NBR 6028) pede o resumo
  em **parágrafo único**. Juntar "Quando o aluno apresenta baixo desempenho..." ao parágrafo de
  cima, e o mesmo no Abstract ("When a student shows low performance...").
- [x] **Abstract (pág. 4):** "As **na** expected result" → "As **an** expected result".
- [x] **2.1 (pág. 11):** "não depende apenas de esconder botões na interface**,** mesmo que alguém
  tente acessar a API" → trocar a vírgula por **dois-pontos** ("...na interface: mesmo que alguém
  tente..."), como estava no texto original.
- [x] **2.2 (pág. 13):** "até **vinteregistros** de falha" → "até **vinte registros** de falha".
- [x] **1.3 (pág. 10):** "Isso vale para os materiais compartilhados" → "**O mesmo** vale para os
  materiais compartilhados" (do jeito que está, "Isso" parece se referir ao ranking).
- [x] **1.3 (págs. 9–10):** os dois últimos itens ("As regras que não podem depender do
  navegador..." e "O código-fonte está organizado por funcionalidade...") entraram como
  **marcadores**. Eles não são tecnologias, são texto corrido: tirar o marcador e deixar como
  dois parágrafos normais, antes da Figura 1.
- [x] **2.4 (pág. 15)** cita "(seção 2.6)", mas a **seção 2.6 ainda não foi inserida** (item logo
  abaixo).
- [x] **Linhas "Status:" vazias** depois do RF16, RF17, RF18, RF19 e RF20 (págs. 30–33): apagar.
  Elas somem de qualquer forma quando esses RFs forem substituídos (seção 3.1 abaixo).
- [x] **Ainda falam em "etapa futura" / "próxima etapa"**, e são corrigidos pelos itens abaixo:
  RF10, RF15 a RF20, RNF08, o texto da 3.2 (Figuras 2 e 3), o texto da 3.3 (Figura 4) e os
  Apêndices A, B e C (que continuam na versão 1.0).

---

## Pág. 6 — SUMÁRIO

- [ ] **Ação:** depois de passar tudo, atualizar o sumário automático do Word (Referências →
  Atualizar sumário). A estrutura final fica:

```
1. INTRODUÇÃO
1.1. OBJETIVOS
1.2. JUSTIFICATIVA
1.3. TECNOLOGIAS, FERRAMENTAS E ARQUITETURA
2. DESENVOLVIMENTO
2.1. AUTENTICAÇÃO, AUTORIZAÇÃO E CRIPTOGRAFIA
2.2. LOGS DE AUDITORIA E RASTREABILIDADE
2.3. INTEGRAÇÃO COM API EXTERNA — VIACEP
2.4. ADEQUAÇÃO À LGPD
2.5. GAMIFICAÇÃO NA EDUCAÇÃO                         ← nova
2.6. BIBLIOTECA COLABORATIVA DE MATERIAIS             ← nova
3. ANÁLISE E PROJETO
3.1. REQUISITOS FUNCIONAIS E NÃO FUNCIONAIS
3.2. DIAGRAMAS DE CLASSES                              ← plural
3.3. DIAGRAMAS DE PROCESSO (BPMN)                      ← plural
REFERÊNCIAS                                            ← sem número
APÊNDICE A — TERMO DE ACEITE                           ← entra no sumário
APÊNDICE B — POLÍTICA DE PRIVACIDADE
APÊNDICE C — PLANO DE RETENÇÃO E DESCARTE DE DADOS
```

---

## Pág. 16 — INSERIR seção nova 2.6 (logo depois da 2.5, antes de "3. ANÁLISE E PROJETO")

- [ ] **Ação:** INSERIR depois do último parágrafo da 2.5 ("...e não apenas em perda de pontos."):

> **2.6 Biblioteca Colaborativa de Materiais**
>
> A biblioteca de materiais é colaborativa: os próprios alunos compartilham os conteúdos que
> os ajudaram (links ou arquivos PDF/DOCX), ligados a uma disciplina, e esses conteúdos
> aparecem para os colegas no fim do quiz da disciplina, como um sistema de ajuda entre os
> estudantes. O envio é pessoal (cada aluno gerencia os próprios materiais na tela "Meus
> materiais"), mas a visualização é pública para os usuários logados depois da aprovação.
> Clicando no nome de quem compartilhou, o aluno abre o perfil público dessa pessoa, que
> mostra apenas o nome abreviado, o curso e os materiais aprovados.
>
> Para que essa abertura não traga riscos, a publicação passa por três camadas: (1) um filtro
> automático, executado por um gatilho no banco de dados (e repetido no navegador apenas para
> avisar antes do envio), que aceita apenas links `https://` de sites educacionais
> previamente permitidos e recusa termos impróprios ou ligados a crimes (conteúdo adulto,
> drogas, pirataria, apostas, armas, ódio e palavrões) e dados pessoais como CPF, e-mail e
> telefone; (2) a análise do administrador para arquivos, cujo conteúdo não é conferido
> automaticamente, e que ficam "em análise" até serem aprovados; e (3) a denúncia pelos
> próprios usuários, que oculta o material automaticamente após três denúncias até nova
> análise. O aluno não consegue alterar a situação do próprio material pela API, porque as
> colunas de situação e motivo não têm permissão de escrita para ele, e o arquivo de um
> material só pode ser aberto, por link temporário, quando ele está aprovado (ou pelo
> próprio autor e pelo administrador).

---

## Pág. 16–17 — 3. ANÁLISE E PROJETO (introdução)

- [ ] **Localizar:** "a lista de requisitos funcionais e não funcionais, o diagrama de classes
  e o diagrama de processo (BPMN) do fluxo de autenticação com verificação em duas etapas. Os
  artefatos contemplam tanto as funcionalidades já implementadas quanto os módulos planejados
  para as próximas etapas do projeto, conforme orientação repassada para esta entrega."
  **Ação:** SUBSTITUIR por: "a lista de requisitos funcionais e não funcionais, os diagramas
  de classes e os diagramas de processo (BPMN) da autenticação com verificação em duas etapas
  e do quiz. Todos os requisitos descritos estão implementados."

## Pág. 17–36 — 3.1 Requisitos Funcionais e Não Funcionais

### RF01 – Autenticar usuário no sistema (pág. 17–18)
- [ ] **Localizar:** "3. Se válidas, o sistema libera o acesso às áreas compatíveis com o
  perfil do usuário." **Ação:** SUBSTITUIR por: "3. Se válidas, o sistema solicita
  a verificação em duas etapas (RF03 no primeiro acesso, RF04 nos seguintes) e só então libera
  o acesso às áreas compatíveis com o perfil do usuário."
- [ ] **Localizar:** "CA01 – Dado um usuário cadastrado com credenciais válidas, quando informar
  e-mail e senha corretos, então o sistema deverá iniciar a sessão." **Ação:** SUBSTITUIR o fim
  por: "...então o sistema deverá iniciar a sessão e encaminhar para a verificação em duas
  etapas."
- [ ] **Ação:** ACRESCENTAR DEPOIS de "RN02 – Usuários sem cadastro não conseguem autenticar.":
  "RN03 – Ao clicar em "Sair", o sistema pede confirmação antes de encerrar a sessão; o logout
  é registrado no log de auditoria."
- [ ] **Ação:** ACRESCENTAR DEPOIS de CA03: "CA04 – Dado um usuário logado, quando clicar em
  "Sair" e cancelar a confirmação, então a sessão deverá continuar aberta."

### RF02 – Cadastrar novo usuário (pág. 18–19)
- [ ] Sem alteração.

### RF03 – Configurar verificação em duas etapas (pág. 19–20)
- [ ] **Localizar (Pré-condições):** "O usuário deve estar autenticado e ainda não possuir MFA
  ativo." **Ação:** SUBSTITUIR por: "O usuário deve ter e-mail e senha validados e ainda não
  possuir MFA ativo."
- [ ] **Ação:** ACRESCENTAR DEPOIS de "RN02 – O fator só é considerado ativo após a validação
  do primeiro código.": "RN03 – Fatores não confirmados de tentativas anteriores são
  descartados antes de gerar um novo QR Code."
- [ ] **Localizar (Pós-condições):** "Fator MFA ativo e vinculado à conta do usuário."
  **Ação:** ACRESCENTAR no fim: " Ativação registrada no log de auditoria."

### RF04 – Validar código de verificação em duas etapas no login (pág. 20–21)
- [ ] **Ação:** ACRESCENTAR DEPOIS de "RN02 – Tentativas malsucedidas são registradas em log de
  auditoria.":
  - "RN03 – O banco de dados recusa leitura e escrita de sessões que não estejam em aal2."
  - "RN04 – Após cinco códigos inválidos consecutivos, a sessão é encerrada e o usuário volta
    ao login; o bloqueio é registrado no log ("mfa_bloqueado")."
- [ ] **Ação:** ACRESCENTAR DEPOIS do fluxo principal: "**Fluxo alternativo:** cinco códigos
  inválidos → encerrar a sessão → voltar ao login."

### RF05 – Consultar endereço automaticamente via CEP (pág. 21–22)
- [ ] Sem alteração.

### RF06 – Gerenciar disciplinas (pág. 22–23)
- [ ] Descrição, fluxo e RN01 do PDF (cadastrar, editar e excluir) continuam valendo.
- [ ] **Localizar (Fluxo, passo 2):** "Informa nome e curso da disciplina e confirma o cadastro,
  edição ou exclusão." **Ação:** SUBSTITUIR por: "2. Informa o nome da disciplina, marca os
  cursos que a têm na grade (SI, ADS e/ou ES) e confirma o cadastro, edição ou exclusão. Para editar, clica em "Editar" na
  disciplina: o formulário é preenchido com os dados atuais e o botão passa a "Salvar
  alterações"."
- [ ] **Ação:** ACRESCENTAR no fim da Descrição: " As disciplinas da grade dos cursos de
  Sistemas de Informação, Análise e Desenvolvimento de Sistemas e Engenharia de Software da UMC
  já vêm cadastradas (16 por curso), e a tela tem um filtro por curso (Todos, SI, ADS e ES) com a
  quantidade de disciplinas de cada um; o aluno começa vendo as do próprio curso. Uma disciplina
  comum a mais de um curso, como Banco de Dados, aparece no filtro de cada um deles."
- [ ] **Ação:** ACRESCENTAR DEPOIS de RN01:
  - "RN02 – Não pode haver duas disciplinas com o mesmo nome."
  - "RN03 – Uma disciplina comum a mais de um curso é cadastrada uma única vez, com a lista
    dos cursos que a têm na grade (pelo menos um); perguntas, notas e materiais ficam ligados a
    essa única disciplina."
  - "RN04 – Excluir uma disciplina exclui as perguntas e as notas ligadas a ela, após
    confirmação."
- [ ] **Ação:** ACRESCENTAR DEPOIS de CA02:
  - "CA03 – Dado um administrador, quando cadastrar ou editar uma disciplina com o nome de outra
    já existente, então o sistema deverá recusar."
  - "CA04 – Dado um administrador, quando editar o nome de uma disciplina, então o novo nome
    deverá aparecer na listagem, no quiz e nas notas, sem perder as perguntas ligadas a ela."
  - "CA05 – Dado um aluno de ADS, quando filtrar as disciplinas pelo seu curso, então deverá ver
    as 16 disciplinas da grade de ADS, inclusive as comuns a outros cursos (ex.: Banco de
    Dados)."

### RF07 – Gerenciar perguntas (pág. 23)
- [ ] **Ação:** SUBSTITUIR o RF07 inteiro (do título até o CA02) por:

> **RF07 – Gerenciar perguntas**
>
> **Descrição:** O sistema deverá permitir que o administrador cadastre, edite e exclua
> perguntas do quiz, cada uma ligada a uma disciplina, com enunciado, nível (Fácil, Médio ou
> Difícil), quatro alternativas, a indicação da alternativa correta e, opcionalmente, uma
> imagem e uma explicação da resposta.
>
> **Atores:** Administrador (gerencia); Aluno (responde no quiz, sem acesso ao gabarito).
>
> **Pré-condições:** O usuário deve estar autenticado com verificação em duas etapas; ações de
> escrita exigem perfil administrador; deve existir ao menos uma disciplina cadastrada.
>
> **Fluxo principal:**
> 1. O administrador acessa a tela de perguntas.
> 2. Informa disciplina, nível, enunciado, as quatro alternativas, a alternativa correta e,
> se quiser, uma imagem e uma explicação.
> 3. O sistema valida os dados na tela e no banco e grava a pergunta e o gabarito.
> 4. A pergunta passa a ser listada e, se estiver completa, entra no sorteio do quiz.
>
> **Fluxo alternativo (edição):** o administrador clica em "Editar" em uma pergunta da
> lista; o formulário é preenchido com enunciado, alternativas, gabarito, explicação e
> imagem atuais; ele altera o que quiser (inclusive trocar ou remover a imagem) e clica em
> "Salvar alterações". O banco aplica as mesmas validações do cadastro e grava pergunta e
> gabarito juntos.
>
> **Regras de negócio:**
> RN01 – Somente administradores cadastram, editam e excluem perguntas, garantido por RLS e
> por funções do banco (`criar_pergunta` e `editar_pergunta`), não apenas ocultando botões
> na tela.
> RN02 – Enunciado com 10 a 500 caracteres; as quatro alternativas são obrigatórias e
> diferentes entre si; uma alternativa deve ser marcada como correta.
> RN03 – O gabarito é guardado separado da pergunta e não pode ser lido por alunos.
> RN04 – Perguntas sem disciplina ou sem gabarito não entram no quiz (marcadas como
> "Incompleta").
> RN05 – A imagem é opcional: PNG, JPG, WEBP ou GIF de até 2 MB, guardada em armazenamento
> privado; só administradores enviam.
> RN06 – A explicação é opcional (até 600 caracteres) e fica junto do gabarito, para que o
> aluno só a veja depois de responder.
> RN07 – Trechos do enunciado, das alternativas e da explicação escritos como `**texto**`
> aparecem em negrito.
> RN08 – O sistema é entregue com um banco inicial de 120 perguntas (8 disciplinas × 15; em
> cada uma, 6 Fácil, 5 Médio e 4 Difícil), todas com gabarito e explicação, e 36 delas com
> ilustração própria. A ordem das alternativas é sorteada no cadastro, para a resposta
> correta não ficar sempre na mesma letra. O banco é ampliado pelo administrador e por novos
> scripts no mesmo formato, com a meta de cobrir todas as disciplinas dos três cursos.
> RN09 – Editar uma pergunta não altera as rodadas já finalizadas: acertos e pontos já
> gravados continuam como estavam. Ao trocar ou remover a imagem, a antiga é apagada do
> armazenamento.
>
> **Pós-condições:** Lista de perguntas atualizada.
>
> **Critérios de aceite:**
> CA01 – Dado um administrador autenticado, quando cadastrar uma pergunta completa associada
> a uma disciplina existente, então ela deverá ser listada com a alternativa correta.
> CA02 – Dado um usuário aluno, quando tentar cadastrar uma pergunta diretamente pela API,
> então o banco deverá negar a operação.
> CA03 – Dado um aluno, quando tentar ler o gabarito pela API, então o banco deverá retornar
> vazio.
> CA04 – Dada uma pergunta sem alternativa correta ou com alternativas repetidas, quando o
> administrador tentar salvar (no cadastro ou na edição), então o sistema deverá recusar.
> CA05 – Dado um administrador, quando editar a alternativa correta de uma pergunta, então
> a próxima rodada de quiz deverá corrigir pela nova alternativa.

### RF08 – Gerenciar materiais de estudo com upload de arquivo (pág. 24)
- [ ] **Ação:** SUBSTITUIR o RF08 inteiro (do título até o CA02, que termina na pág. 20) por:

> **RF08 – Compartilhar materiais de estudo**
>
> **Descrição:** O sistema deverá permitir que alunos e administradores compartilhem
> materiais de estudo (links ou arquivos PDF/DOCX), ligados a uma disciplina, que ficam
> visíveis para os demais usuários depois de aprovados.
>
> **Atores:** Aluno e Administrador (enviam); todos os usuários autenticados (consultam os
> aprovados).
>
> **Pré-condições:** Usuário autenticado com verificação em duas etapas.
>
> **Fluxo principal:**
> 1. O usuário abre "Meus materiais".
> 2. Informa título, disciplina, link e/ou arquivo e, se quiser, uma descrição de como o
> material ajuda.
> 3. O sistema valida tipo e tamanho do arquivo e aplica o filtro de conteúdo (RN08 a RN10).
> 4. O arquivo é enviado para o armazenamento com nome sanitizado e prefixo único.
> 5. Link aprovado pelo filtro é publicado na hora; arquivo enviado por aluno fica "Em
> análise" até o administrador aprovar (RF27).
> 6. O material aparece na lista do usuário com a situação (Público, Em análise ou
> Recusado, com o motivo).
>
> **Fluxos alternativos:**
> - O filtro recusa → o sistema mostra o motivo e não grava nada (se o arquivo já tinha sido
> enviado, ele é removido).
> - Edição: o autor clica em "Editar" em um material da sua lista, altera título,
> disciplina, link ou descrição e clica em "Salvar alterações"; o filtro de conteúdo é
> aplicado de novo. O arquivo anexado não é trocado na edição: para enviar outro, o autor
> exclui o material e compartilha de novo (o arquivo novo passa por nova análise).
>
> **Regras de negócio:**
> RN01 – O arquivo é limitado a 5 MB e aos formatos PDF e DOCX.
> RN02 – A validação ocorre tanto no formulário quanto nas regras do armazenamento e do banco,
> evitando burla via API.
> RN03 – Ao excluir um material, o arquivo correspondente também é removido do
> armazenamento.
> RN04 – Cada material guarda quem o enviou; somente o autor ou um administrador pode
> editá-lo ou excluí-lo (RLS).
> RN05 – Os arquivos não são públicos: abrem por links temporários (1 hora), só para usuários
> autenticados, e só quando o material está aprovado (ou para o autor e o administrador).
> RN06 – A disciplina é obrigatória no formulário: é por ela que o material aparece no fim do
> quiz e no Guru.
> RN07 – Título com 3 a 120 caracteres; descrição com até 500.
> RN08 – Links só com `https://` e de sites permitidos: YouTube, GitHub, GitLab, MDN,
> W3Schools, Wikipédia, Stack Overflow, freeCodeCamp, Khan Academy, Alura, DIO, Rocketseat,
> Udemy, Coursera, edX, Curso em Vídeo, DevMedia, GeeksforGeeks, Microsoft Learn, documentação
> oficial de React, TypeScript, Python, PostgreSQL, Supabase e Git, UMC, SciELO e gov.br.
> RN09 – Título, descrição, link e nome do arquivo não podem ter termos impróprios ou ligados
> a crimes (conteúdo adulto, drogas, pirataria, apostas, armas, ódio, palavrões).
> RN10 – Título, descrição e nome do arquivo não podem ter dados pessoais (CPF, e-mail ou
> telefone), conforme o princípio da necessidade da LGPD.
> RN11 – Arquivos enviados por alunos ficam "Em análise" até a aprovação do administrador,
> porque o conteúdo do arquivo não é conferido automaticamente. Links aprovados pelo filtro e
> materiais do administrador são publicados na hora.
> RN12 – O aluno não altera a situação do próprio material (aprovado, em análise ou recusado);
> só o administrador, pela moderação.
> RN13 – Um material recusado que o autor edita volta para "Em análise", para o
> administrador decidir de novo; um material público continua público depois de editado,
> desde que passe pelo filtro.
>
> **Pós-condições:** Material gravado com a situação definida e, se aprovado, visível aos
> colegas no fim do quiz da disciplina (RF16) e no perfil público do autor (RF29).
>
> **Critérios de aceite:**
> CA01 – Dado um arquivo PDF de até 5 MB, quando um aluno enviar, então o material deverá
> aparecer com a situação "Em análise" e não deverá ser visível para outros alunos.
> CA02 – Dado um arquivo maior que 5 MB ou de tipo não permitido, quando tentar enviar, então
> o sistema deverá recusar e informar o motivo.
> CA03 – Dado o link `https://site-qualquer.com`, então o sistema deverá recusar com a
> mensagem de site não permitido.
> CA04 – Dado o título "Office crackeado", então o sistema deverá recusar por termo impróprio.
> CA05 – Dada a descrição "me chama no (11) 98765-4321", então o sistema deverá recusar por
> dado pessoal.
> CA06 – Dado um material recusado, quando o autor editar o título, então ele deverá voltar
> para "Em análise" e aparecer na moderação.
> CA07 – Dado um aluno, quando tentar editar pela API o material de outro aluno, então o banco
> não deverá alterar nada.

### RF09 – Consultar logs de auditoria (pág. 25)
- [ ] Sem alteração.

### RF10 – Excluir automaticamente logs de auditoria com mais de 90 dias (pág. 25–26)
- [ ] **Ação:** SUBSTITUIR o RF10 inteiro (do título até a linha "Status: A exclusão manual...")
  por:

> **RF10 – Excluir automaticamente logs de auditoria com mais de 90 dias**
>
> **Descrição:** O sistema deverá excluir automaticamente, todos os dias, os registros de
> auditoria com mais de 90 dias, e permitir que um administrador acione a mesma limpeza
> manualmente, sem nunca apagar registros com menos de 90 dias.
>
> **Atores:** Sistema (tarefa agendada pg_cron); Administrador (reforço manual).
>
> **Pré-condições:** Devem existir registros de log com data de criação superior a 90 dias.
>
> **Fluxo principal:**
> 1. Diariamente às 03h (horário de Brasília), a tarefa agendada executa a função de limpeza.
> 2. A função remove os registros com mais de 90 dias e registra a própria execução no log.
> 3. Opcionalmente, um administrador aciona a limpeza manual na tela de Logs.
>
> **Regras de negócio:**
> RN01 – Nenhum registro com menos de 90 dias é apagado, nem pela tarefa nem pelo
> administrador.
> RN02 – O prazo de 90 dias é fixo dentro das funções (não é parâmetro).
> RN03 – A função usada pela tarefa agendada não depende de usuário autenticado e não pode ser
> chamada por nenhum usuário pela API.
> RN04 – Cada limpeza manual é registrada no log, com quem a fez e quantos registros foram
> removidos.
>
> **Pós-condições:** Registros com mais de 90 dias removidos do banco de dados.
>
> **Critérios de aceite:**
> CA01 – Dado um log com mais de 90 dias, quando a tarefa diária executar, então o registro
> não deverá mais existir.
> CA02 – Dado um administrador, quando acionar a limpeza manual, então somente registros com
> mais de 90 dias deverão ser removidos e a limpeza deverá ser registrada no log.
> CA03 – Dado qualquer usuário autenticado, quando tentar chamar diretamente a função usada
> pela tarefa agendada, então o banco deverá negar.

### RF11 – Apresentar Termo de Aceite (pág. 26–27)
- [ ] **Localizar (Descrição):** "por meio de links fixos no menu e no rodapé" → SUBSTITUIR por
  "por meio de links no rodapé de todas as telas".
- [ ] **Localizar (Fluxo, passo 1):** "disponível no menu lateral e no rodapé" → SUBSTITUIR por
  "disponível no rodapé".

### RF12 – Apresentar Política de Privacidade (pág. 27–28)
- [ ] **Localizar (Fluxo, passo 1):** "disponível no menu lateral e no rodapé" → SUBSTITUIR por
  "disponível no rodapé de todas as telas".
- [ ] **Localizar (RN01):** "(cadastro, autenticação, logs, integração com ViaCEP)" →
  SUBSTITUIR por "(cadastro, autenticação, verificação em duas etapas, logs, integração com
  ViaCEP, quiz e ranking, notas e faltas e materiais compartilhados)".

### RF13 – Registrar consentimento do usuário no cadastro (pág. 28–29)
- [ ] **Localizar (Pós-condições):** "Consentimento do usuário registrado no momento da criação
  da conta." → SUBSTITUIR por "Aceite registrado no perfil do usuário com data, hora e versão
  dos documentos."
- [ ] **Ação:** ACRESCENTAR DEPOIS de RN01: "RN02 – Quando o Termo ou a Política mudam de
  versão, o usuário deve aceitar a nova versão no acesso seguinte (RF22)."

### RF14 – Controlar acesso por perfil de usuário (pág. 29)
- [ ] **Localizar:** "RN01 – Toda tabela sensível (disciplinas, perguntas, materiais, perfis,
  logs) possui política de RLS própria." → SUBSTITUIR por: "RN01 – Toda tabela sensível
  (disciplinas, perguntas, gabaritos, materiais, denúncias, perfis, rodadas e respostas do quiz,
  notas e logs) possui política de RLS própria, e todas exigem sessão com verificação em duas
  etapas concluída (aal2)."

### RF15 – Excluir conta de usuário (pág. 29–30)
- [ ] **Ação:** SUBSTITUIR o RF15 inteiro (o parágrafo curto que diz "em etapa futura" e "Ainda não
  implementado") por:

> **RF15 – Excluir conta de usuário**
>
> **Descrição:** O sistema deverá permitir que o próprio titular exclua sua conta, pela tela
> Minha conta, atendendo ao direito de eliminação (LGPD, art. 18, VI), e que um administrador
> exclua a conta de outro usuário, pela tela Usuários.
>
> **Atores:** Aluno, Administrador.
>
> **Pré-condições:** Usuário autenticado com verificação em duas etapas concluída.
>
> **Fluxo principal:**
> 1. O usuário solicita a exclusão.
> 2. O sistema exige confirmação explícita (digitar EXCLUIR).
> 3. Os arquivos de materiais enviados pelo usuário são removidos do armazenamento.
> 4. Uma função do banco registra a exclusão no log e apaga a conta de autenticação; perfil,
> materiais, rodadas de quiz e notas são apagados junto.
>
> **Regras de negócio:**
> RN01 – A chave administrativa do Supabase nunca é usada no front-end; a exclusão é feita
> por função do banco que verifica quem a chamou.
> RN02 – O último administrador não pode excluir a própria conta.
> RN03 – Os registros de auditoria já existentes são mantidos até completar 90 dias.
>
> **Pós-condições:** Conta e dados pessoais do usuário removidos; exclusão registrada no log.
>
> **Critérios de aceite:**
> CA01 – Dado um titular com MFA concluído, quando confirmar a exclusão, então conta, perfil e
> materiais deverão deixar de existir.
> CA02 – Dado um aluno, quando tentar excluir a conta de outro usuário pela API, então o banco
> deverá negar.

### RF16 – Responder quiz (pág. 30)
- [ ] **Ação:** SUBSTITUIR o RF16 inteiro (do título até a linha "Status:" vazia) por:

> **RF16 – Responder quiz**
>
> **Descrição:** O sistema deverá permitir que o aluno responda a uma rodada de quiz de uma
> disciplina escolhida, com até 10 perguntas sorteadas apresentadas uma de cada vez, e veja a
> correção de cada pergunta logo após respondê-la.
>
> **Atores:** Aluno.
>
> **Pré-condições:** Aluno autenticado com verificação em duas etapas; a disciplina possui
> perguntas completas (RF07).
>
> **Fluxo principal:**
> 1. O aluno filtra as disciplinas por curso (o filtro começa no curso dele) ou busca pelo
> nome, e escolhe a disciplina em uma lista de cartões, que mostra quantas perguntas cada uma
> tem.
> 2. O sistema sorteia até 10 perguntas com gabarito e mostra a primeira, sem a resposta
> correta, com barra de progresso, nível, pontos que ela vale e a ilustração, quando houver
> (o aluno pode ampliá-la).
> 3. O aluno escolhe uma alternativa (clique ou teclas 1 a 4) e clica em "Verificar".
> 4. O banco grava a resposta, que não pode mais ser trocada, e só então devolve se acertou, a
> alternativa correta, a explicação e os pontos ganhos (RF17).
> 5. O sistema mostra o retorno na hora (verde com os pontos ou vermelho com a resposta certa)
> e a sequência de acertos seguidos.
> 6. O aluno clica em "Continuar" e repete os passos 3 a 5 até a última pergunta.
> 7. O sistema fecha a rodada e exibe aproveitamento, acertos, pontos, melhor sequência, a
> revisão das perguntas erradas e os materiais aprovados que os colegas compartilharam na
> disciplina (RF19).
>
> **Fluxos alternativos:** disciplina sem perguntas → cartão desabilitado; "Verificar" sem
> alternativa escolhida → botão desabilitado; dica 50/50 → o banco elimina duas alternativas
> erradas da pergunta atual; sair no meio → confirmação, e a rodada é descartada; rodada com
> mais de 30 minutos → recusada.
>
> **Regras de negócio:**
> RN01 – Até 10 perguntas por rodada, sorteadas da disciplina escolhida.
> RN02 – O gabarito de uma pergunta só é revelado depois que o aluno grava a resposta dela,
> que não pode mais ser alterada.
> RN03 – Só uma rodada aberta por aluno; iniciar outra descarta a anterior não finalizada.
> RN04 – A rodada deve ser finalizada em até 30 minutos e não pode ser finalizada duas vezes.
> RN05 – O aluno não grava rodadas nem respostas diretamente, só pelas funções do banco.
> RN06 – Em cada rodada, o aluno pode usar uma vez a dica 50/50; as duas alternativas
> eliminadas são sorteadas no banco, que conhece o gabarito.
> RN07 – Os efeitos de interação (sons de acerto e erro, comemoração ao chegar em 3, 5 e 10
> acertos seguidos, animação dos pontos e confete com 80% ou mais) podem ser desligados e
> respeitam a opção do sistema de reduzir movimento.
>
> **Pós-condições:** Rodada registrada, com respostas, acertos e pontos associados ao aluno.
>
> **Critérios de aceite:**
> CA01 – Dado um aluno com MFA, quando verificar uma resposta errada, então deverá ver na hora
> a alternativa correta; ao final, a revisão de todas as perguntas erradas.
> CA02 – Dado um aluno, quando tentar finalizar a rodada de outro aluno, então o banco deverá
> recusar.
> CA03 – Dado um aluno que já respondeu uma pergunta, quando tentar respondê-la de novo na
> mesma rodada, então o banco deverá recusar.
> CA04 – Dado um aluno que já usou a dica 50/50 na rodada, quando pedir outra, então o banco
> deverá recusar.

### RF17 – Calcular pontuação do quiz (pág. 30–31)
- [ ] **Ação:** SUBSTITUIR o RF17 inteiro (do título até a linha "Status:" vazia) por:

> **RF17 – Calcular pontuação do quiz**
>
> **Descrição:** O sistema deverá atribuir pontos aos acertos do quiz conforme o nível de
> dificuldade da pergunta e somá-los na rodada.
>
> **Atores:** Sistema (acionado a cada resposta do aluno, RF16).
>
> **Pré-condições:** Rodada de quiz aberta pelo aluno (RF16).
>
> **Fluxo principal:**
> 1. A cada resposta, o banco compara a alternativa escolhida com o gabarito.
> 2. Se acertou, atribui os pontos do nível da pergunta (RN01 e RN02).
> 3. Ao fechar a rodada, soma os acertos e os pontos e grava na rodada.
>
> **Regras de negócio:**
> RN01 – Fácil = 10 pontos, Médio = 20, Difícil = 30. Erro ou pergunta sem resposta = 0.
> RN02 – Cada pergunta só pontua na primeira vez em que o aluno a acerta.
> RN03 – A pontuação é calculada no banco de dados; o aluno não consegue alterá-la pela API.
> RN04 – Aproveitamento abaixo de 60% na rodada aciona a apresentação dos materiais como dica
> do Guru (RF19).
>
> **Pós-condições:** Acertos e pontos registrados na rodada e somados ao ranking (RF18).
>
> **Critérios de aceite:**
> CA01 – Dado um aluno que acerta uma pergunta Difícil pela primeira vez, então deverá ganhar
> 30 pontos; ao acertá-la de novo em outra rodada, 0 ponto.
> CA02 – Dada uma rodada finalizada, então os pontos gravados deverão ser a soma dos pontos das
> respostas corretas.

### RF18 – Exibir ranking (pág. 31–32)
- [ ] **Ação:** SUBSTITUIR o RF18 inteiro (do título até a linha "Status:" vazia) por:

> **RF18 – Exibir ranking**
>
> **Descrição:** O sistema deverá exibir a classificação dos alunos pela soma dos pontos do
> quiz, geral ou filtrada por disciplina.
>
> **Atores:** Aluno, Administrador.
>
> **Pré-condições:** Existência de ao menos uma rodada de quiz pontuada (RF17).
>
> **Fluxo principal:**
> 1. O usuário acessa a tela de ranking e escolhe "Geral" ou uma disciplina.
> 2. O sistema lista os alunos ordenados pela pontuação.
>
> **Regras de negócio:**
> RN01 – Participam apenas alunos com pontos (administradores não aparecem).
> RN02 – São exibidos os 10 primeiros e, se o aluno estiver fora deles, também a posição dele.
> RN03 – Exibe apenas posição, primeiro nome com a inicial do sobrenome e pontos.
> RN04 – Empates ficam na mesma posição.
> RN05 – O aluno pode ocultar o nome (aparece "Aluno anônimo"), sem perder os pontos.
> RN06 – O ranking "de amigos" foi retirado do escopo, por exigir uma função social que
> aumenta o tratamento de dados pessoais sem ganho para o objetivo do projeto.
>
> **Pós-condições:** Lista ordenada de alunos exibida.
>
> **Critérios de aceite:**
> CA01 – Dado alunos com pontuações distintas em uma disciplina, quando o ranking for exibido,
> então eles deverão aparecer ordenados do maior para o menor.
> CA02 – Dado um aluno que desmarcou "Mostrar meu nome no ranking", quando outro aluno
> consultar o ranking, então deverá ver "Aluno anônimo" na posição dele.

### RF19 – Recomendar conteúdo (Guru) (pág. 32–33)
- [ ] **Ação:** SUBSTITUIR o RF19 inteiro (do título até a linha "Status:" vazia) por:

> **RF19 – Recomendar conteúdo (Guru)**
>
> **Descrição:** O sistema deverá indicar materiais de estudo das disciplinas em que o aluno
> apresenta baixo desempenho.
>
> **Atores:** Sistema (acionado no Painel e no resultado do quiz).
>
> **Pré-condições:** Aluno com rodadas de quiz finalizadas.
>
> **Fluxo principal:**
> 1. O aluno abre o Painel (ou termina uma rodada).
> 2. O sistema calcula o aproveitamento por disciplina.
> 3. Para cada disciplina com baixo desempenho, lista os materiais aprovados ligados a ela.
>
> **Regras de negócio:**
> RN01 – Baixo desempenho no Painel: aproveitamento (acertos ÷ respostas) abaixo de 60% em
> uma disciplina, considerando todas as rodadas finalizadas, com pelo menos 5 respostas
> nessa disciplina. No resultado de uma rodada, vale o aproveitamento da própria rodada.
> RN02 – Só são indicados materiais com disciplina definida (RF08) e aprovados.
> RN03 – Sem material na disciplina, o Guru informa que ainda não há material.
> RN04 – O resultado do quiz sempre mostra os materiais aprovados que os colegas
> compartilharam na disciplina; quando o aproveitamento da rodada fica abaixo de 60%, a lista
> é apresentada como "Dica do Guru".
>
> **Pós-condições:** Indicação de materiais exibida ao aluno.
>
> **Critérios de aceite:**
> CA01 – Dado um aluno com 0 de 6 acertos em uma disciplina com um material aprovado, então o
> Guru deverá indicar esse material no Painel.
> CA02 – Dado um aluno que terminou uma rodada com menos de 60% de acertos, então o resultado
> deverá exibir os materiais da disciplina como "Dica do Guru".

### RF20 – Registrar notas e faltas (pág. 33)
- [ ] **Ação:** SUBSTITUIR o RF20 inteiro (do título até a linha "Status:" vazia) por (atenção:
  no PDF quem registra é o administrador; no sistema é o **próprio aluno**):

> **RF20 – Registrar notas e faltas**
>
> **Descrição:** O sistema deverá permitir que o aluno registre suas notas e faltas por
> disciplina, com os mesmos campos do boletim do portal da UMC, em dois cadastros separados
> (notas e faltas), e calcular separadamente a situação das notas e a situação da frequência.
>
> **Atores:** Aluno.
>
> **Pré-condições:** Aluno autenticado com verificação em duas etapas.
>
> **Fluxo principal:**
> 1. O aluno abre a tela Notas, na aba "Notas" ou "Faltas".
> 2. Escolhe a disciplina e informa os campos (M1, ND, NI, M2 para simular, MS, EX ou faltas).
> 3. Na aba Notas, uma prévia mostra M2, MD, MF e a situação enquanto o aluno digita.
> 4. O aluno salva, e o sistema exibe a tabela com as situações calculadas, que também
> alimentam o Painel (RF25).
>
> **Regras de negócio:**
> RN01 – Campos: M1 (avaliações do 1º bimestre), ND (avaliações do 2º bimestre), NI
> (avaliação integrada), M2 (opcional, para simular quando ND e NI ainda não saíram), MS
> (média semestral, só em disciplinas de nota única), EX (exame) e FT (faltas no semestre).
> RN02 – M2 = ND × 70% + NI × 30%; sem ND e NI, vale a M2 digitada (simulação).
> RN03 – MD = (M1 + M2 × 2) ÷ 3 (o 2º bimestre tem peso 2); em disciplina de nota única, MD =
> MS. Como no portal, a MD já aparece com a M1, contando a M2 que ainda não saiu como 0, e a
> situação fica "Aguardando notas".
> RN04 – A MF aparece quando as notas do semestre saem: MF = MD; com exame, MF = (MD + EX) ÷ 2.
> Médias arredondadas para uma casa decimal.
> RN05 – Nota mínima para aprovação: 5. MD ≥ 5 → Aprovado; MD < 5 → Em exame; MF ≥ 5 →
> Aprovado no exame; MF < 5 → Reprovado.
> RN06 – Limite de 40 faltas por disciplina; acima dele → Reprovado por falta,
> independentemente da nota. Cada dia de aula vale 4 faltas (2 por módulo); a tela tem os
> botões "+2 (1 módulo)" e "+4 (dia todo)" e alerta ao atingir 75% do limite (30 faltas). Para
> corrigir um lançamento errado, há os botões "−2" e "−4" (o total nunca fica abaixo de zero) e,
> na tabela, "Zerar", que apaga só as faltas da disciplina, sem mexer nas notas, após confirmação.
> Para tirar da lista uma disciplina registrada por engano, há o botão "Excluir" nas duas abas, que
> apaga as notas e as faltas daquela disciplina após confirmação; depois o aluno registra a
> disciplina certa.
> RN07 – Notas de 0 a 10 (vírgula ou ponto), podendo ficar em branco; faltas de 2 em 2.
> RN08 – Um registro por aluno e disciplina; salvar as notas não altera as faltas, e vice-versa.
> RN09 – Somente o próprio aluno lê e altera suas notas (nem o administrador); o log registra a
> alteração sem os valores.
> RN10 – Os valores são apresentados como estimativa: a tela avisa que o professor pode usar
> outros critérios e que a nota oficial é a do portal da UMC.
>
> **Pós-condições:** Notas e faltas registradas e visíveis apenas para o aluno, na tela Notas
> e no Painel.
>
> **Critérios de aceite:**
> CA01 – Dado M1 = 5, ND = 5 e NI = 5, então M2 = 5, MD = 5 e situação "Aprovado".
> CA02 – Dado M1 = 10, ND = 2 e NI = 2, então MD = (10 + 4) ÷ 3 = 4,7 e situação "Em exame".
> CA03 – Dado nota 11, então o sistema deverá recusar.
> CA04 – Dado 42 faltas, então a frequência deverá mostrar "Reprovado por falta"; com 20
> faltas, deverá mostrar que ainda pode faltar 20 (5 dias).
> CA05 – Dado só M1 = 6,1, então MD = 2,0 e MF vazia; ao informar ND e NI, a MF aparece.
> CA06 – Dado M1 = 6,1 e M2 digitada = 7, então MD = MF = 6,7 (simulação).
> CA07 – Dado que o aluno informe 3 faltas, então o sistema deverá recusar.

### INSERIR RF21 a RF29 (pág. 33, depois do RF20 e antes do RNF01)
- [ ] **Ação:** INSERIR os nove RFs abaixo, nesta ordem, depois do RF20.

> **RF21 – Exercer direitos do titular (Minha conta)**
>
> **Descrição:** O sistema deverá permitir que o titular exerça seus direitos (LGPD, art. 18)
> na tela Minha conta: acesso a todos os dados guardados, com download em arquivo JSON;
> correção de nome, curso, cidade e estado; revogação do consentimento de localização;
> oposição à exibição do nome no ranking; e exclusão da conta (RF15).
>
> **Atores:** Aluno, Administrador.
>
> **Pré-condições:** Usuário autenticado com verificação em duas etapas.
>
> **Regras de negócio:**
> RN01 – E-mail e papel não são alterados pelo titular.
> RN02 – Toda alteração gera log com o nome dos campos alterados, sem os valores.
> RN03 – O arquivo baixado inclui perfil, aceite, materiais, rodadas de quiz, notas, faltas e
> registros de atividade do próprio usuário.
>
> **Critérios de aceite:**
> CA01 – Dado um usuário, quando clicar em "Baixar meus dados", então deverá receber um
> arquivo JSON com todos os seus dados.
> CA02 – Dado um usuário com cidade e estado, quando revogar o consentimento, então os dois
> campos deverão ficar vazios.

> **RF22 – Solicitar novo aceite dos termos**
>
> **Descrição:** O sistema deverá exigir um novo aceite do Termo e da Política quando a versão
> aceita pelo usuário for diferente da vigente (ou não houver registro de aceite), antes de
> liberar a área logada.
>
> **Atores:** Aluno, Administrador.
>
> **Regras de negócio:**
> RN01 – O novo aceite é registrado com data, hora e versão.
> RN02 – O usuário pode excluir a conta na mesma tela, sem aceitar.
>
> **Critérios de aceite:**
> CA01 – Dado um usuário que aceitou a versão 1.2, quando entrar com a versão 1.3 vigente,
> então deverá ver a tela de novo aceite antes do Painel.

> **RF23 – Apresentar a plataforma a visitantes (Home pública)**
>
> **Descrição:** O sistema deverá exibir, sem login, uma página inicial que apresenta o
> EduGuru (como funciona, recursos e cursos atendidos), com acesso ao login e ao cadastro.
>
> **Atores:** Visitante.
>
> **Regras de negócio:**
> RN01 – A página não coleta nenhum dado pessoal.
> RN02 – A página só anuncia funcionalidades que existem.
>
> **Critérios de aceite:**
> CA01 – Dado um visitante não autenticado, quando acessar o endereço do sistema, então deverá
> ver a página inicial com os botões "Entrar" e "Criar conta".

> **RF24 – Redefinir senha esquecida**
>
> **Descrição:** O sistema deverá permitir que o usuário que esqueceu a senha receba por
> e-mail um link para cadastrar uma nova senha.
>
> **Atores:** Visitante (com conta).
>
> **Fluxo principal:**
> 1. Na tela de login, o usuário escolhe "Esqueci minha senha" e informa o e-mail.
> 2. O sistema solicita ao Supabase Auth o envio do link e exibe mensagem genérica.
> 3. O usuário abre o link no mesmo navegador.
> 4. Se a conta tem MFA, informa o código do autenticador.
> 5. Informa e confirma a nova senha (mesmas regras do cadastro).
> 6. O sistema troca a senha, registra no log, encerra todas as sessões e volta ao login.
>
> **Regras de negócio:**
> RN01 – A mensagem não revela se o e-mail possui conta.
> RN02 – Contas com MFA exigem o código do autenticador antes da troca.
> RN03 – A nova senha segue as regras do RF02 e não pode ser igual à anterior.
> RN04 – Após a troca, todas as sessões da conta são encerradas.
> RN05 – No máximo cinco pedidos por e-mail a cada dez minutos.
>
> **Critérios de aceite:**
> CA01 – Dado um link válido aberto no mesmo navegador, quando o usuário informar o código (se
> houver MFA) e uma nova senha válida, então a senha deverá ser trocada e o login com a senha
> antiga deverá falhar.
> CA02 – Dado um link expirado ou aberto em outro navegador, então o sistema deverá informar
> que o link é inválido e oferecer novo pedido.

> **RF25 – Visualizar painel (Dashboard)**
>
> **Descrição:** O sistema deverá exibir um painel com indicadores e gráficos, diferente para
> aluno e administrador.
>
> **Atores:** Aluno, Administrador.
>
> **Fluxo principal:**
> 1. Depois do login, o usuário é levado ao Painel, que também abre pelo botão "Minha conta" da
> barra superior (o logo EduGuru leva à página inicial).
> 2. Aluno: o sistema mostra pontos, posição no ranking, quizzes feitos, % de acertos, média
> geral (MD) e disciplinas em alerta; os gráficos de acertos por disciplina e de acertos nas
> últimas 10 rodadas; e o quadro do Guru (RF19).
> 3. Administrador: o sistema mostra alunos, disciplinas, perguntas prontas, materiais,
> quizzes realizados e % de acertos geral; e os gráficos de quizzes nos últimos 7 dias e de
> acertos da turma por disciplina.
>
> **Regras de negócio:**
> RN01 – O administrador vê apenas números agregados, nunca dados de um aluno.
> RN02 – Todos os números vêm do banco no momento da consulta.
>
> **Critérios de aceite:**
> CA01 – Dado um aluno que finalizou uma rodada, quando abrir o Painel, então os indicadores de
> pontos e quizzes feitos deverão incluir essa rodada.

> **RF26 – Redefinir verificação em duas etapas**
>
> **Descrição:** O sistema deverá permitir que um administrador redefina o MFA de um usuário
> que perdeu o acesso ao aplicativo autenticador.
>
> **Atores:** Administrador.
>
> **Regras de negócio:**
> RN01 – Só administrador com sessão aal2; não pode redefinir o próprio.
> RN02 – A senha continua exigida; no próximo acesso o usuário cadastra o aplicativo de novo
> (RF03).
> RN03 – A ação fica no log ("mfa_redefinido").
>
> **Critérios de aceite:**
> CA01 – Dado um aluno com o MFA redefinido, quando fizer login, então deverá ver o QR Code de
> novo.

> **RF27 – Moderar materiais**
>
> **Descrição:** O sistema deverá permitir que o administrador aprove ou recuse materiais em
> análise e materiais denunciados.
>
> **Atores:** Administrador.
>
> **Fluxo principal:**
> 1. O administrador abre Materiais → "Moderação".
> 2. O sistema lista os arquivos em análise e os materiais com denúncia, com os motivos.
> 3. O administrador abre o link ou o arquivo e aprova ou recusa (com motivo).
> 4. Aprovado: o material fica público e as denúncias são apagadas. Recusado: só o autor vê,
> com o motivo.
>
> **Regras de negócio:**
> RN01 – Só administradores com verificação em duas etapas moderam (conferido no banco).
> RN02 – Toda mudança fica no log de auditoria (gatilho da tabela de materiais).
>
> **Critérios de aceite:**
> CA01 – Dado um PDF em análise, quando o administrador aprovar, então os outros alunos
> deverão passar a vê-lo.
> CA02 – Dado um material recusado, então o autor deverá ver a situação "Recusado" com o motivo.

> **RF28 – Denunciar material**
>
> **Descrição:** O sistema deverá permitir que o usuário denuncie um material impróprio,
> suspeito ou que exponha dados pessoais.
>
> **Atores:** Aluno, Administrador.
>
> **Fluxo principal:**
> 1. Na lista de materiais dos colegas, o usuário clica em "Denunciar".
> 2. Escolhe o motivo (conteúdo impróprio, possível crime, dados pessoais, link suspeito ou
> fora da disciplina).
> 3. O sistema registra a denúncia e agradece.
>
> **Regras de negócio:**
> RN01 – Cada usuário denuncia o mesmo material uma vez; não é possível denunciar o próprio
> material.
> RN02 – Com 3 denúncias, o material é ocultado automaticamente até o administrador analisar
> (RF27).
> RN03 – Quem denunciou só é visível para o administrador.
>
> **Critérios de aceite:**
> CA01 – Dado um material com 3 denúncias de usuários diferentes, então ele deverá sumir da
> lista dos colegas e aparecer na Moderação.

> **RF29 – Consultar perfil público de quem compartilha**
>
> **Descrição:** O sistema deverá exibir o perfil público de quem compartilhou materiais, com
> o nome abreviado, o curso e os materiais aprovados.
>
> **Atores:** Aluno, Administrador.
>
> **Fluxo principal:**
> 1. No fim do quiz (ou em qualquer lista de materiais dos colegas), o aluno clica no nome do
> autor.
> 2. O sistema mostra o perfil e os materiais aprovados dele.
>
> **Regras de negócio:**
> RN01 – Só nome abreviado (ex.: "Maria S.") e curso; nunca e-mail, cidade ou notas.
> RN02 – Só tem perfil público quem tem pelo menos um material aprovado.
>
> **Critérios de aceite:**
> CA01 – Dado um aluno com um material aprovado, quando um colega abrir o perfil dele, então
> deverá ver só o nome abreviado, o curso e os materiais aprovados.

### RNF01 – Segurança no armazenamento de senhas (pág. 33–34)
- [ ] Sem alteração.

### RNF02 – Autenticação multifator obrigatória (pág. 34)
- [ ] **Localizar (Critério de aceite):** "...então o sistema deverá obrigar a configuração do
  MFA antes de liberar o acesso." **Ação:** ACRESCENTAR no fim: " e o banco de dados deverá
  recusar requisições de sessões sem MFA concluído."

### RNF03 – Rastreabilidade das operações (pág. 34)
- [ ] **Localizar:** "Dado o cancelamento de uma pergunta feito diretamente via API" →
  SUBSTITUIR por "Dada a exclusão de uma pergunta feita diretamente via API".

### RNF04 – Usabilidade e clareza das mensagens (pág. 34)
- [ ] **Localizar:** "devem indicar visualmente quais regras ainda não foram atendidas." **Ação:**
  ACRESCENTAR DEPOIS: " Ações que apagam dados ou encerram a sessão pedem confirmação em uma
  janela própria do sistema (no lugar do aviso padrão do navegador), que segue o tema escolhido,
  diz o que vai acontecer e traz o nome da ação no botão (ex.: "Excluir", "Sair"); a exclusão de
  conta só é liberada depois de digitar EXCLUIR."

### RNF05 – Portabilidade e responsividade (pág. 35)
- [ ] **Localizar (Critério de aceite):** "Dado o acesso ao sistema por um navegador mobile,
  quando navegar pelas telas, então o layout deverá se adaptar sem quebrar elementos."
  **Ação:** SUBSTITUIR por: "Todas as telas devem funcionar sem rolagem horizontal da página em
  larguras de 360 px a 1920 px, nos navegadores Chrome, Edge e Firefox em suas versões atuais;
  tabelas largas rolam dentro do próprio quadro e, no celular, o menu da barra superior é
  recolhido em um botão."

### RNF06 – Disponibilidade e infraestrutura em nuvem (pág. 35)
- [ ] **Localizar (Critério de aceite):** "Dado o ambiente de produção, quando qualquer
  integrante do grupo acessar o sistema publicado, então ele deverá responder sem necessidade
  de infraestrutura local ligada." **Ação:** SUBSTITUIR por (pedido do orientador: critério
  mensurável): "Com todos os computadores do grupo desligados, o endereço publicado
  (https://tttrisos.github.io/EduGuru/) deve abrir a página inicial e permitir o login completo
  (com verificação em duas etapas) em pelo menos duas redes diferentes (Wi-Fi e 4G)."

### RNF07 – Minimização de dados pessoais (pág. 35)
- [ ] **Ação:** ACRESCENTAR no fim do texto do RNF07 (antes do critério): "Pelo mesmo
  princípio, o ranking e os materiais compartilhados mostram apenas o nome abreviado, e o
  filtro de materiais recusa CPF, e-mail e telefone."

### RNF08 – Retenção e descarte controlado de dados de auditoria (pág. 35–36)
- [ ] **Localizar:** "Os dados de auditoria devem ter prazo de retenção de 90 dias. Nesta
  etapa, o descarte é feito manualmente por um administrador, com o prazo mínimo garantido
  pela própria função do banco." **Ação:** SUBSTITUIR por: "Os dados de auditoria têm prazo de retenção de 90 dias,
  com descarte automático diário por tarefa agendada no banco (pg_cron) e descarte manual como
  reforço, sempre respeitando o prazo mínimo."
- [ ] Critério de aceite: sem alteração (só acrescentar o ponto final que falta).

### INSERIR RNF09 – Desempenho (pág. 36, depois do RNF08)
- [ ] **Ação:** INSERIR:

> **RNF09 – Desempenho**
>
> As telas principais devem responder rapidamente mesmo em conexão móvel.
>
> **Critério de aceite:** Em conexão 4G, o Painel deve carregar em até 3 segundos e a correção
> de cada resposta do quiz deve ser exibida em até 2 segundos após clicar em "Verificar".

### INSERIR RNF10 – Acessibilidade visual (pág. 36, depois do RNF09)
- [ ] **Ação:** INSERIR:

> **RNF10 – Acessibilidade visual**
>
> O sistema deve oferecer, além do tema escuro (padrão), um tema claro, escolhido pelo usuário
> no menu "Minha conta" da barra superior e guardado no próprio navegador. Nos dois temas, os
> textos devem manter contraste adequado com o fundo, o menu deve abrir também pelo teclado
> (tecla Tab) e as animações do quiz respeitam a opção do sistema operacional de reduzir
> movimento.
>
> **Critério de aceite:** Dado um usuário que escolheu o modo claro, quando recarregar a página
> ou voltar outro dia no mesmo navegador, então o site deverá abrir no modo claro, com todos os
> textos legíveis; e o menu "Minha conta" deverá abrir tanto ao passar o mouse quanto ao chegar
> nele com a tecla Tab.

---

## Pág. 36–37 — 3.2 Diagrama de Classes

- [ ] **Título:** trocar "3.2 Diagrama de Classes" por "3.2 Diagramas de Classes".
- [ ] **Localizar:** "O diagrama de classes do EduGuru foi dividido em duas figuras" (o
  parágrafo todo). **Ação:** SUBSTITUIR por:

> O diagrama de classes do EduGuru foi dividido em duas figuras para facilitar a leitura. A
> Figura 2 reúne as classes de conta, conteúdo, comunidade e auditoria, e a Figura 3 reúne o
> módulo de gamificação e acompanhamento (quiz, pontuação, ranking, Guru e notas). Todas as
> classes correspondem a tabelas ou funções que existem no banco de dados.

- [ ] **Figura 2 (pág. 36):** SUBSTITUIR pela figura do bloco "Figura 2" de
  `docs/diagramas/diagrama_classes.md` (exportar em PNG 3x/4x ou SVG).
  **Legenda:** "Figura 2 - Diagrama de Classes: conta, conteúdo, comunidade e auditoria."
- [ ] **Localizar:** "A Figura 2 mostra as classes atualmente implementadas" (o parágrafo
  todo). **Ação:** SUBSTITUIR por:

> A Figura 2 mostra as classes Perfil (dados do usuário, papel de acesso e registro do
> aceite), Disciplina, Pergunta e Gabarito (guardado separado, para que o aluno não o leia),
> Material e Denuncia (biblioteca colaborativa e moderação) e LogAuditoria (registro das
> ações realizadas). As multiplicidades indicam, por exemplo, que um perfil pode enviar
> diversos materiais e fazer diversas denúncias, que cada material pode receber várias
> denúncias e que cada pergunta tem no máximo um gabarito. A autoria só é guardada no
> material; quem cadastrou disciplinas e perguntas fica registrado no log de auditoria.

- [ ] **Figura 3 (pág. 37):** SUBSTITUIR pela figura do bloco "Figura 3" de
  `docs/diagramas/diagrama_classes.md` (a figura atual tem "\n", acentuação errada e marca as
  classes como planejadas). **Legenda:** "Figura 3 - Diagrama de Classes: quiz, pontuação,
  ranking, Guru e notas."
- [ ] **Localizar:** "A Figura 3 representa o módulo de gamificação planejado para as próximas
  etapas" (o parágrafo todo). **Ação:** SUBSTITUIR por:

> A Figura 3 representa o módulo de gamificação e acompanhamento. A classe Quiz (rodada)
> sorteia de uma a dez perguntas de uma disciplina, e a classe de associação RespostaQuiz
> guarda a alternativa escolhida, se o aluno acertou e os pontos ganhos. Ranking e Guru não
> são tabelas, mas serviços implementados como funções do banco: o Ranking soma os pontos das
> rodadas, geral ou por disciplina, e o Guru calcula o aproveitamento do aluno por disciplina
> para indicar materiais aprovados. A classe Nota guarda as notas e faltas que o próprio aluno
> registra, e os cálculos de média e frequência ficam em um módulo do front-end com testes
> unitários.

## Pág. 38–39 — 3.3 Diagrama de Processo de Autenticação (BPMN)

- [ ] **Título:** trocar por "3.3 Diagramas de Processo (BPMN)".
- [ ] **Localizar:** "O diagrama distingue, por estilo de linha e preenchimento, o que já está
  implementado nesta entrega do que está para uma próxima etapa (verificação em duas etapas /
  MFA), conforme legenda na própria figura." **Ação:** SUBSTITUIR por: "Todo o fluxo
  representado está implementado, inclusive a verificação em duas etapas."
- [ ] **Figura 4 (pág. 38):** REDESENHAR conforme `docs/diagramas/bpmn.md` (Figura 4: fluxos
  em linha contínua, sem cruzamentos, log das falhas, limite de 5 tentativas e gateway do novo
  aceite; sem a legenda "previsto"). **Legenda:** "Figura 4 - Diagrama de processo (BPMN) do
  login com verificação em duas etapas."
- [ ] **Localizar:** "O processo começa quando o usuário informa e-mail e senha." (o parágrafo
  todo, até "Nenhuma dessas etapas de MFA está implementada em código nesta entrega.").
  **Ação:** SUBSTITUIR pelo texto "Texto abaixo da figura" da Figura 4 em
  `docs/diagramas/bpmn.md`.
- [ ] **Ação:** INSERIR depois desse parágrafo a **Figura 5** (desenhar conforme a Figura 5 de
  `docs/diagramas/bpmn.md`), com a legenda "Figura 5 - Diagrama de processo (BPMN) do quiz, da
  pontuação e das indicações do Guru." e, abaixo dela, o "Texto abaixo da figura" da Figura 5
  no mesmo arquivo.

---

## Pág. 39–40 — APÊNDICE A — Termo de Aceite

- [ ] **Ação:** SUBSTITUIR todo o conteúdo do Apêndice A (do "Texto vigente..." até o item 7)
  por:

> Texto vigente na página /termos do sistema EduGuru (versão 1.3, 05/11/2026). Reproduzido
> integralmente a seguir.
>
> Projeto acadêmico (PFC) da Universidade de Mogi das Cruzes; numa implantação real, este
> documento passaria por revisão jurídica. Este documento trata das regras de uso da
> plataforma. Como os dados pessoais são tratados está na Política de Privacidade, documento
> separado (Apêndice B).
>
> **1. O que é o EduGuru**
>
> O EduGuru é uma plataforma acadêmica, desenvolvida como Projeto Final de Curso da UMC, que
> reúne quizzes gamificados, materiais de estudo e acompanhamento de desempenho para
> estudantes de Sistemas de Informação, Análise e Desenvolvimento de Sistemas e Engenharia de
> Software.
>
> **2. Quem pode usar**
>
> O acesso é destinado a estudantes de graduação da UMC nos cursos listados acima. Cada
> pessoa deve manter apenas uma conta, com informações verdadeiras.
>
> **3. Contas e papéis de acesso**
>
> Existem dois tipos de conta: **Aluno** (padrão de qualquer cadastro), que responde quizzes,
> ganha pontos e participa do ranking, recebe indicações do Guru, registra as próprias notas
> e faltas, visualiza disciplinas e materiais e pode anexar materiais próprios, editando ou
> excluindo apenas os que ele mesmo enviou; e **Administrador** (atribuído manualmente pela
> equipe do projeto), que, além do que o aluno pode fazer, cadastra/edita/exclui disciplinas
> e perguntas do quiz (com o gabarito), remove qualquer material, gerencia e exclui contas de
> usuários, redefine a verificação em duas etapas de quem perdeu o celular e acessa o
> histórico de auditoria.
>
> **Verificação em duas etapas (obrigatória):** além da senha, todo acesso exige o código de
> 6 dígitos de um aplicativo autenticador (ex.: Google Authenticator, Microsoft
> Authenticator), configurado no primeiro login. Você é responsável por manter sua senha em
> sigilo e o aplicativo autenticador sob seu controle. Se perder o acesso ao aplicativo, peça
> a um administrador para redefinir a verificação. Avise a equipe do projeto imediatamente
> se suspeitar de acesso indevido à sua conta.
>
> Você pode excluir sua conta a qualquer momento, na tela Minha conta. A exclusão é
> permanente.
>
> **4. Condutas proibidas**
>
> Compartilhar sua conta com terceiros; tentar acessar dados ou funcionalidades
> administrativas sem permissão; enviar, como material, links ou arquivos com conteúdo
> ilegal, ofensivo, adulto, de apostas, pirataria ou que viole direitos autorais de
> terceiros; colocar dados pessoais (seus ou de outras pessoas, como CPF, e-mail ou telefone)
> no título, na descrição ou no arquivo de um material; tentar sobrecarregar, invadir ou
> interromper o funcionamento da plataforma; tentar burlar a pontuação do quiz ou do ranking
> (ex.: usar contas extras ou chamar a API diretamente para obter pontos).
>
> **5. Conteúdo enviado pelo usuário**
>
> Ao compartilhar um material (link ou PDF/DOCX), você declara ter o direito de
> compartilhá-lo com os demais usuários da plataforma. Depois de aprovado, o material aparece
> para todo usuário logado no fim do quiz da disciplina e no seu perfil público, junto do seu
> nome abreviado (ex.: Maria S.) e do seu curso. Links só são aceitos de sites permitidos e
> passam por um filtro automático; arquivos ficam em análise até a equipe aprovar. Qualquer
> usuário pode denunciar um material: com 3 denúncias ele é ocultado até a equipe analisar. A
> equipe do EduGuru pode recusar ou remover qualquer conteúdo que viole este Termo, sem aviso
> prévio. Ao excluir sua conta, os materiais que você enviou também são excluídos.
>
> **6. Disponibilidade e encerramento**
>
> Por ser um projeto acadêmico, o EduGuru pode passar por manutenções, instabilidades ou
> alterações significativas sem aviso prévio formal. A equipe pode encerrar contas que violem
> este Termo, e pode encerrar a plataforma ao final do ciclo acadêmico do PFC.
>
> **7. Alterações deste Termo**
>
> Este Termo pode ser atualizado conforme o projeto evolui. Quando o Termo ou a Política de
> Privacidade mudarem de versão, a plataforma pede um novo aceite no seu próximo acesso,
> antes de liberar a área logada. Se não concordar, você pode excluir sua conta na mesma
> tela, sem precisar aceitar.

## Pág. 40–43 — APÊNDICE B — Política de Privacidade

- [ ] **Ação:** SUBSTITUIR todo o conteúdo do Apêndice B (do "Texto vigente..." até o fim do
  item 8) por:

> Texto vigente na página /privacidade do sistema EduGuru (versão 1.3, 05/11/2026).
> Reproduzido integralmente a seguir.
>
> Documento vivo: atualizado sempre que uma funcionalidade nova passa a tratar dados pessoais
> (nesta versão: quiz, pontuação, ranking, Guru, notas e faltas, e materiais compartilhados
> com perfil público do autor). Finalidade acadêmica: este é um protótipo de Projeto Final de
> Curso; numa implantação real, as decisões abaixo seriam revisadas pelo controlador
> responsável (ex.: a instituição de ensino) e por assessoria jurídica.
>
> **1. Quem trata os seus dados**
>
> O EduGuru é desenvolvido por João Pedro, Luiz Antonio e Thiago, estudantes de Sistemas de
> Informação da Universidade de Mogi das Cruzes (UMC), como Projeto Final de Curso, com
> orientação do Prof. Oscar Alves Evangelista e coorientação do Prof. Alessandro Aparecido da
> Silva Horas. Nesta fase de protótipo acadêmico, os
> próprios integrantes do grupo atuam como responsáveis pelo tratamento dos dados. Em uma
> implantação real fora do contexto acadêmico, esse papel seria da instituição de ensino que
> viesse a adotar a plataforma. Canal de contato para assuntos de privacidade (nesta fase
> acadêmica): e-mail da equipe do projeto, informado ao orientador.
>
> **2. Quais dados pessoais tratamos**
>
> *Identificação e acesso:* nome, e-mail e senha (a senha nunca é armazenada como texto —
> passa por hash automático do Supabase Auth antes de qualquer gravação). *Verificação em duas
> etapas (MFA):* o registro do aplicativo autenticador vinculado à conta (a chave secreta é
> guardada pelo Supabase Auth; o EduGuru não vê nem armazena os códigos de 6 dígitos).
> *Registro do aceite:* data, hora e versão do Termo de Aceite e desta Política aceitos no
> cadastro. *Acadêmicos:* curso (Sistemas de Informação, ADS ou Engenharia de Software),
> escolhido no cadastro. *Localização (opcional):* cidade e estado, obtidos a partir de um CEP
> informado voluntariamente no cadastro — o CEP em si, rua, número e bairro não são
> armazenados, apenas cidade/estado, e somente se a pessoa preencher esse campo opcional.
> *Conteúdo da plataforma:* disciplinas e perguntas de quiz cadastradas por administradores,
> e materiais de estudo (links e arquivos PDF/DOCX, até 5 MB) enviados por alunos ou
> administradores — cada material guarda quem o enviou, a situação da moderação e as
> denúncias recebidas (quem denunciou e o motivo, visíveis só para administradores).
> *Desempenho nos quizzes:* rodadas de quiz jogadas (data, disciplina, respostas escolhidas,
> acertos e pontos) e a escolha de aparecer ou não com o nome no ranking. *Notas e faltas
> (opcional):* M1, ND, NI, nota única (MS), nota de exame e quantidade de faltas que o próprio
> aluno registra em cada disciplina, para acompanhar sua situação. *Registros de auditoria:*
> login concluído, tentativas de login malsucedidas, códigos de verificação em duas etapas
> inválidos, ativação da verificação, logout, pedidos de redefinição de senha e senhas
> redefinidas, redefinição da verificação em duas etapas por um administrador, quizzes
> finalizados (acertos e pontos), criação/edição/exclusão de disciplinas, perguntas e
> materiais, registro de notas (apenas que houve a alteração, sem os valores das notas),
> alterações no perfil (apenas quais campos mudaram, não os valores) e exclusões de conta —
> sempre associados a quem realizou a ação e quando.
>
> Não coletamos CPF, data de nascimento, dados de saúde, dados biométricos, imagem ou voz. Se
> alguma dessas categorias vier a ser necessária no futuro (ex.: verificação de identidade),
> esta política será atualizada antes da coleta começar.
>
> **3. Para que usamos cada dado e com base em quê**

| Dado | Finalidade | Hipótese legal (LGPD) | Retenção |
|---|---|---|---|
| Nome, e-mail, senha | Criar e autenticar a conta, permitir login | Execução de contrato / procedimento preliminar solicitado pelo titular (art. 7º, V) | Enquanto a conta existir |
| Fator de verificação em duas etapas (MFA) | Proteger a conta contra acesso com senha vazada ou descoberta | Execução de contrato (art. 7º, V), em atendimento ao dever de segurança (art. 46) | Enquanto a conta existir |
| Data e versão do aceite | Comprovar que o titular aceitou o Termo e a Política | Cumprimento de obrigação legal — comprovação do consentimento (art. 7º, II, e art. 8º, §2º) | Enquanto a conta existir |
| Curso | Mostrar conteúdo relevante ao curso do aluno | Execução de contrato | Enquanto a conta existir |
| Cidade/estado (via CEP, opcional) | Exibir a localização no perfil do próprio aluno (tela Minha conta), como demonstração da integração com uma API externa (ViaCEP). Não é mostrada a outros usuários nem usada em ranking, estatística ou qualquer outra finalidade. | Consentimento (o próprio ato de preencher um campo opcional), revogável a qualquer momento na tela Minha conta | Enquanto a conta existir, ou até o titular revogar o consentimento |
| Perguntas, disciplinas, materiais (e quem enviou cada material) | Funcionamento do quiz e da biblioteca de materiais; mostrar aos colegas o nome abreviado e o curso de quem compartilhou (perfil público); moderar e receber denúncias; permitir que só o autor (ou um admin) altere/exclua o material | Execução de contrato / legítimo interesse educacional | Até ser excluído pelo autor ou por um administrador, ou até a exclusão da conta do autor |
| Rodadas de quiz, respostas e pontos | Corrigir o quiz, calcular a pontuação e o ranking, mostrar o desempenho no Painel e permitir que o Guru indique materiais quando o aproveitamento em uma disciplina fica abaixo de 60% | Execução de contrato (art. 7º, V) — é a funcionalidade principal da plataforma | Enquanto a conta existir |
| Nome abreviado e pontos no ranking | Gamificação: mostrar a classificação aos demais alunos. Só aparecem o primeiro nome e a inicial do sobrenome (ex.: "Maria S.") | Legítimo interesse educacional (art. 7º, IX), com direito de oposição: na tela Minha conta o aluno passa a aparecer como "Aluno anônimo" | Enquanto a conta existir |
| Notas e faltas | Calcular e mostrar, só para o aluno, a situação em cada disciplina (média, exame, limite de faltas) | Consentimento (art. 7º, I): registrar é opcional e o aluno pode apagar a qualquer momento na tela Notas | Até o aluno apagar o registro ou excluir a conta |
| Logs de auditoria | Segurança, rastreabilidade e investigação de incidentes | Legítimo interesse (segurança da aplicação) / cumprimento de obrigação legal | 90 dias corridos, apagados automaticamente após esse prazo |

> Não usamos nenhum dado pessoal para publicidade, venda a terceiros, ou treinamento de
> modelos de inteligência artificial.
>
> **4. Compartilhamento e serviços externos**
>
> *Supabase* (hospedagem em nuvem): fornece o banco de dados, a autenticação (login, inclusive
> o envio dos e-mails de confirmação de cadastro e de redefinição de senha) e o armazenamento
> dos arquivos anexados em Materiais. É o único fornecedor que efetivamente armazena os dados
> pessoais do projeto. *ViaCEP*: serviço público e gratuito de consulta de endereços a partir
> do CEP. Quando o usuário digita um CEP (opcional) no cadastro, apenas o CEP é enviado ao
> ViaCEP; a resposta (cidade/UF) é usada para preencher os campos automaticamente. O ViaCEP
> não recebe nome, e-mail ou qualquer outro dado que identifique a pessoa — apenas o número do
> CEP. Nenhum outro serviço externo recebe dados pessoais nesta fase do projeto.
>
> **5. Transferência internacional e cookies**
>
> A infraestrutura do Supabase pode processar/armazenar dados em servidores fora do Brasil,
> conforme a região configurada no projeto. Não usamos cookies de rastreamento nem de
> publicidade. A sessão de login é mantida pelo Supabase Auth usando armazenamento local do
> navegador, estritamente necessário para o usuário continuar logado — não é usado para
> rastreamento em outros sites. O navegador também guarda duas preferências do usuário, que não
> identificam ninguém e não são enviadas ao EduGuru: o tema escolhido (escuro ou claro) e se os
> sons do quiz estão desligados.
>
> **6. Retenção e descarte**
>
> Conta, perfil, registro do aceite e fator MFA: mantidos enquanto a conta existir; apagados
> na hora quando o titular exclui a conta (tela Minha conta) ou quando um administrador a
> exclui. Logs de auditoria: 90 dias. A exclusão é automática, executada diariamente às 03h
> (horário de Brasília) por uma tarefa agendada no próprio banco de dados (pg_cron). Um
> administrador também pode acionar a limpeza manualmente pela tela de Logs, como reforço,
> mas nunca de registros com menos de 90 dias. Se a conta for excluída antes disso, os
> registros já feitos continuam até completar os 90 dias (segurança e investigação de
> incidentes) e então são apagados pela mesma rotina. Arquivos anexados em Materiais:
> mantidos até serem excluídos por quem os enviou ou por um administrador, ou até a exclusão
> da conta de quem os enviou — a exclusão remove o arquivo também do armazenamento, não só da
> lista. Rodadas de quiz, pontos e notas/faltas: mantidos enquanto a conta existir; as notas
> de uma disciplina podem ser apagadas pelo aluno a qualquer momento; tudo é apagado junto com
> a conta.
>
> *Quem enxerga o quê.* **O próprio usuário:** todos os seus dados, na tela Minha conta,
> incluindo seus registros de atividade. **Outros alunos:** não veem o perfil (nome, e-mail,
> curso, cidade) nem as notas de ninguém. Veem os materiais que cada um compartilhar, depois
> de aprovados (título, descrição, link e arquivo), com o nome abreviado e o curso de quem
> enviou, e podem abrir o perfil público dessa pessoa, que mostra só isso e a lista desses
> materiais. Quem não tem material aprovado não tem perfil público. No ranking, veem o nome
> abreviado e os pontos — ou "Aluno anônimo", se a pessoa preferir. **Administradores:** veem
> os perfis de todos os usuários (para gerenciar contas) e os logs de auditoria. Não veem as
> notas nem as respostas no quiz de ninguém — apenas totais gerais da turma (ex.: quantos
> quizzes foram feitos e a média de acertos por disciplina).
>
> **7. Seus direitos**
>
> Como titular dos dados, você pode solicitar, a qualquer momento: confirmação de que tratamos
> seus dados, e acesso a eles; correção de dados incompletos ou desatualizados; exclusão dos
> dados que não sejam mais necessários; revogação do consentimento dado para o campo opcional
> de cidade/estado; oposição à exibição do seu nome no ranking; e informações sobre com quem
> seus dados são compartilhados. Você exerce esses direitos sozinho, dentro do site, na tela
> Minha conta (depois de entrar, passe o mouse em "Minha conta", no topo do site, e escolha "Meus
> dados e privacidade"): **acesso** — ver todos os dados do seu
> perfil, a data e a versão do aceite destes documentos, seus materiais enviados e seus
> registros de atividade, e baixar tudo em um arquivo (JSON); **correção** — alterar nome,
> curso, cidade e estado (e, na tela Notas, as suas notas e faltas); **oposição ao ranking** —
> desmarcar "Mostrar meu nome no ranking"; **revogação do consentimento** — apagar
> cidade/estado com um clique; **eliminação** — excluir a conta. Perfil, conta de acesso,
> verificação em duas etapas, materiais enviados (com os arquivos), notas, faltas e rodadas de
> quiz são apagados na hora. Os registros de auditoria já existentes são mantidos até
> completar 90 dias, por segurança, e então apagados automaticamente. Outras solicitações
> (ex.: dúvidas sobre compartilhamento) são feitas diretamente aos integrantes do grupo ou ao
> orientador.
>
> **8. Segurança e resposta a incidentes**
>
> Senhas passam por hash (nunca texto puro). Todo acesso exige verificação em duas etapas
> (senha + código do aplicativo autenticador), e o próprio banco de dados recusa sessões que
> não concluíram essa verificação. O acesso a cada funcionalidade é controlado por regras de
> segurança no próprio banco de dados (Row Level Security), não apenas pela interface.
> Arquivos anexados não são públicos: só podem ser abertos por usuários logados, por links
> temporários que expiram em 1 hora. Ações relevantes ficam registradas em log de auditoria.
> Em caso de incidente de segurança, a equipe irá: identificar o problema, conter o acesso
> indevido, avaliar quais contas foram afetadas, e comunicar o orientador e os usuários
> afetados assim que possível.

## Pág. 43 — APÊNDICE C — Plano de Retenção e Descarte de Dados

- [ ] **Ação:** SUBSTITUIR a tabela inteira por:

| Dado pessoal | Retenção | Forma de descarte |
|---|---|---|
| Nome, e-mail, senha | Enquanto a conta existir | Exclusão da conta pelo titular (Minha conta) ou por administrador (RF15) |
| Fator MFA e registro do aceite (data/versão) | Enquanto a conta existir | Junto com a exclusão da conta |
| Curso, cidade, estado | Enquanto a conta existir (cidade/estado: até o titular revogar) | Junto com a exclusão da conta; cidade/estado também por revogação na tela Minha conta |
| Logs de auditoria | 90 dias corridos | Exclusão automática diária (pg_cron, 03h); manual por admin como reforço, com piso de 90 dias |
| Materiais enviados (e arquivos) | Até exclusão pelo autor ou admin, ou exclusão da conta do autor | Remoção do Supabase Storage junto com o registro no banco |
| Denúncias de materiais (quem denunciou e motivo) | Até a análise do administrador ou a exclusão do material | Apagadas quando o administrador aprova o material, quando o material é excluído ou junto com a conta de quem denunciou |
| Rodadas de quiz, respostas e pontos | Enquanto a conta existir | Junto com a exclusão da conta |
| Preferência de exibição no ranking | Enquanto a conta existir | Junto com a exclusão da conta |
| Notas e faltas | Até o aluno apagar o registro ou excluir a conta | Exclusão na tela Notas ou junto com a conta |

- [ ] **Localizar:** "A escolha por retenção manual dos logs nesta etapa (em vez de automática)
  é uma limitação temporária" (o parágrafo depois da tabela). **Ação:** APAGAR (a exclusão
  automática já existe).

## Pág. 44 — 4. REFERÊNCIAS BIBLIOGRÁFICAS

- [ ] **Título:** trocar "4. REFERÊNCIAS BIBLIOGRÁFICAS" por "REFERÊNCIAS" (sem número, como
  pede a ABNT NBR 14724).
- [ ] **Ação:** SUBSTITUIR a lista inteira por esta, já em ordem alfabética (ABNT NBR 6023). As
  entradas DETERDING, HAMARI, KAPP e WERBACH são novas (seção 2.5); SOUZA substitui LEITE
  (seção 1.2); ALMEIDA e SILVA ganharam as páginas:

> AGUIAR, Janderson Jason Barbosa; SANTOS, Savyo Ismael Nunes; FECHINE, Joseana Macêdo; COSTA,
> Evandro de Barros. Avaliação de Sistemas de Recomendação Educacionais no Brasil: uma revisão
> sistemática da literatura. In: SIMPÓSIO BRASILEIRO DE INFORMÁTICA NA EDUCAÇÃO, 26., 2015,
> Maceió. **Anais** [...]. 2015. DOI: 10.5753/cbie.sbie.2015.1255.
>
> ALMEIDA, Maria Elizabeth Bianconcini de. Educação a distância na internet: abordagens e
> contribuições dos ambientes digitais de aprendizagem. **Educação e Pesquisa**, São Paulo,
> v. 29, n. 2, p. 327-340, jul./dez. 2003. DOI: 10.1590/S1517-97022003000200010.
>
> BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais
> (LGPD). **Diário Oficial da União**, Brasília, DF, 15 ago. 2018.
>
> DETERDING, Sebastian; DIXON, Dan; KHALED, Rilla; NACKE, Lennart. From game design elements
> to gamefulness: defining "gamification". In: INTERNATIONAL ACADEMIC MINDTREK CONFERENCE,
> 15., 2011, Tampere. **Proceedings** [...]. New York: ACM, 2011. p. 9-15. DOI:
> 10.1145/2181037.2181040.
>
> HAMARI, Juho; KOIVISTO, Jonna; SARSA, Harri. Does gamification work? A literature review of
> empirical studies on gamification. In: HAWAII INTERNATIONAL CONFERENCE ON SYSTEM SCIENCES,
> 47., 2014, Waikoloa. **Proceedings** [...]. Washington: IEEE, 2014. p. 3025-3034.
>
> KAPP, Karl M. **The gamification of learning and instruction**: game-based methods and
> strategies for training and education. San Francisco: Pfeiffer, 2012.
>
> SILVA, Ângela Carrancho da. Educação e tecnologia: entre o discurso e a prática. **Ensaio:
> Avaliação e Políticas Públicas em Educação**, Rio de Janeiro, v. 19, n. 72, p. 527-554,
> jul./set. 2011. DOI: 10.1590/S0104-40362011000400005.
>
> SOUZA, Ediana da Silva de; GASPARINI, Isabela; MACHADO, Guilherme Medeiros. Apresentação de
> recomendações em ambientes educacionais. **RENOTE**: Revista Novas Tecnologias na Educação,
> Porto Alegre, v. 17, n. 3, p. 376-385, dez. 2019. DOI: 10.22456/1679-1916.99521.
>
> SUPABASE. **Supabase Documentation**: Auth, Database e Storage. Disponível em:
> https://supabase.com/docs. Acesso em: 5 nov. 2026.
>
> VIACEP. **API ViaCEP**: webservice gratuito de consulta de endereços. Disponível em:
> https://viacep.com.br. Acesso em: 5 nov. 2026.
>
> WERBACH, Kevin; HUNTER, Dan. **For the win**: how game thinking can revolutionize your
> business. Philadelphia: Wharton Digital Press, 2012.

- [ ] Ajustem o "Acesso em:" para a data em que vocês conferirem os sites.

---

# Fora da monografia (controle do grupo)

Nada desta parte vai para o documento.

## O que precisa estar feito para o texto acima ser verdadeiro

- 👤 Rodar no SQL Editor do Supabase os scripts ainda não aplicados: **11 de novo** (função
  `responder_pergunta`), **13**, **14**, **15** e **16**, nessa ordem. O 15 e o 16 podem ser rodados
  mais de uma vez; as consultas do fim dele mostram as situações dos materiais e as 36 perguntas com
  ilustração.
- 👤 Enviar o código ao GitHub (branch `entrega0911` e `main`). Sem isso, o orientador não
  encontra no repositório o que a monografia descreve (foi o que aconteceu no feedback de
  05/10). Sugestão de resposta ao orientador sobre aquele item:

> Professor, os itens do tópico 1 (MFA/TOTP, limpeza diária via pg_cron com função própria sem
> exigir admin, exclusão de contas pelo admin, gatilho de auditoria em perfis e registro do
> consentimento) estavam implementados localmente e não tinham sido enviados ao repositório.
> Eles estão agora na branch entrega0911 (scripts 04 a 09 da pasta supabase/ e telas Mfa,
> Usuarios, MinhaConta e NovoAceite).

- 👤 Exportar as Figuras 1 (`docs/diagramas/arquitetura.md`), 2 e 3 (`docs/diagramas/diagrama_classes.md`)
  pelo mermaid.live e redesenhar as Figuras 4 e 5 (`docs/diagramas/bpmn.md`).

## Testes já feitos
- Testes de banco: 31/31 (13/10) e 60/60 (28/10) com o banco do projeto; script 15 testado em
  um Postgres local (PGlite) em 04/11, com 36 verificações (inclusive rodar duas vezes); em
  05/11, scripts 15 e 16 juntos com 52 verificações, incluindo a edição de perguntas e materiais.
- Testes unitários: `npm test` (48 testes: notas, senha, texto em negrito, filtro de materiais
  e efeitos do quiz).

## Testes manuais (fazer antes do vídeo de 09/11)
1. Primeiro login → QR Code → código → entra (RF03).
2. Login seguinte → só código; código errado gera `mfa_falhou` nos Logs (RF04).
3. Acessar rota interna com sessão sem MFA → volta para /mfa (RNF02).
4. Conta antiga (sem aceite) → tela de novo aceite → aceita → entra (RF22).
5. Minha conta: corrigir cidade, revogar localização, baixar JSON (RF21).
6. Excluir conta de teste com material anexado (RF15) — titular e admin.
7. Materiais: aluno envia, outro aluno não vê "Excluir", link do arquivo expira em 1 h (RF08).
8. Barra superior logada: links, "Minha conta", "Sair" e menu recolhido no celular (RF23,
   RNF05). Home e Login conferidos por captura de tela em 18/10/2026.
9. Esqueci minha senha (RF24): pedir link → e-mail chega → abrir no mesmo navegador → código
   MFA → nova senha → login com a nova funciona e com a antiga falha; link aberto em outro
   navegador mostra "link inválido".
10. Admin cadastra disciplina (nome e curso); nome repetido no mesmo curso → erro. Aluno abre
    Disciplinas → já vê as do seu curso; troca o filtro para Todos e para outro curso (RF06).
11. Admin cadastra pergunta: sem alternativa correta → erro; alternativas repetidas → erro;
    completa → aparece "Correta: X" (RF07).
12. Admin cadastra pergunta com imagem e explicação → aparecem os selos "Com imagem" e "Com
    explicação"; imagem de 3 MB ou PDF → erro (RF07).
13. Aluno faz quiz: perguntas uma por vez (com a imagem, quando houver); "Verificar"
    desabilitado sem alternativa; acerto → rodapé verde com os pontos; erro → rodapé vermelho
    com a resposta certa; a explicação aparece; teclas 1 a 4 e Enter funcionam; "Sair" pede
    confirmação; ao final aparecem aproveitamento, pontos, melhor sequência e a revisão das
    erradas; refaz → 0 ponto nas já acertadas (RF16, RF17).
14. Aluno vai mal (< 60%) → "Dica do Guru" no resultado e Guru no Painel (com 5+ respostas)
    (RF19).
15. Ranking geral e por disciplina; desmarcar "Mostrar meu nome" em Minha conta → outro aluno
    vê "Aluno anônimo" (RF18).
16. Notas: nota 11 → erro; M1 5, ND 5, NI 5 → M2 5,0, MD 5,0, Aprovado; M1 10, ND 2, NI 2 → Em
    exame; só MS 7 → Aprovado; faltas no formulário separado; salvar faltas não apaga as notas
    (e vice-versa); 42 faltas → "Reprovado por falta"; 3 faltas → erro; botões +2 e +4 somam
    as faltas; −2 e −4 tiram (ficam desabilitados quando não há faltas suficientes);
    "Zerar" pede confirmação e deixa FT = 0 sem apagar as notas da disciplina; "Excluir" na aba
    Faltas tira a disciplina da lista (a janela avisa se ela também tem notas) (RF20).
17. Painel do aluno e do admin com números e gráficos (RF25).
18. Admin redefine o MFA de um aluno → no login seguinte o aluno vê o QR Code de novo (RF26).
19. MFA: errar o código 5 vezes → volta ao login com aviso; log "mfa_bloqueado" (RF04).
20. Logs: botão de limpeza manual funciona e gera "Limpeza manual de logs" (RF10).
21. Conta com aceite 1.2 → tela de novo aceite (versão 1.3) (RF22).
22. Depois do script 14: cada disciplina do banco inicial tem 15 perguntas e o quiz sorteia 10;
    a resposta certa aparece em letras diferentes (RF07).
23. Depois do script 15, em Meus materiais: link `http://youtube.com` → erro de https;
    `https://site-qualquer.com` → erro de site não permitido; título "Office crackeado" → erro
    de termo impróprio; descrição com telefone ou e-mail → erro de dado pessoal; sem disciplina
    → erro (RF08).
24. Aluno compartilha link do YouTube com disciplina → aparece "Público"; anexa PDF → aparece
    "Em análise" e outro aluno não vê o material (RF08).
25. Admin → Materiais → Moderação: abre o PDF, aprova → o outro aluno passa a ver; recusa outro
    → o autor vê "Recusado" com o motivo (RF27).
26. Outro aluno termina o quiz da disciplina → vê "Materiais dos colegas" com o nome abreviado
    e o curso do autor; clica no nome → perfil público com os materiais (RF19, RF29).
27. Denúncia: 3 alunos diferentes denunciam o mesmo material → ele some da lista e aparece na
    Moderação com "3 denúncia(s)" e os motivos; o autor não vê "Denunciar" no próprio material
    (RF28).
28. Quiz: o filtro de cursos começa no curso do aluno; "Todos" mostra tudo; a busca filtra pelo
    nome (RF16).
29. Quiz de Banco de Dados (ou outra das 8 disciplinas): aparecem perguntas com ilustração;
    clicar amplia, Esc fecha (RF16).
30. Dica 50/50: duas alternativas erradas ficam riscadas e não podem ser escolhidas; o botão
    fica "já usada" até o fim da rodada. Acertar 3 seguidas → "Em chamas! 3 seguidas!"; botão
    de som liga/desliga; resultado com 80% ou mais → confete (RF16).
31. Depois do script 16: admin clica em "Editar" numa disciplina, muda o nome e salva → o
    nome novo aparece na lista e no quiz; deixar o nome igual ao de outra disciplina do mesmo
    curso → erro (RF06).
32. Admin edita uma pergunta: troca a alternativa correta e a explicação → "Correta: X" muda
    na lista e a próxima rodada corrige pela nova; troca a imagem e depois marca "Remover a
    imagem atual" → o selo "Com imagem" some; "Cancelar" limpa o formulário (RF07).
33. Aluno edita um material próprio: muda o título e a descrição → continua "Público"; muda o
    link para um site não permitido → erro; admin recusa um material e o autor o edita → volta
    para "Em análise" e aparece na Moderação; material com arquivo mostra que o arquivo não é
    trocado na edição (RF08).
34. Clicar em "Sair" (barra superior, tela do MFA e tela de novo aceite) → aparece "Deseja mesmo
    sair da sua conta?"; Cancelar → continua logado; OK → volta ao login (RF01).
35. Depois de rodar de novo o script 13: o filtro ADS mostra 16 disciplinas (incluindo Banco de
    Dados, Software Básico, Redes e Segurança e Administração de Sistemas de Informação) e não
    mostra "banco" nem "bancop"; SI e ES também mostram 16 cada. Admin edita uma disciplina,
    marca mais um curso e salva → ela passa a aparecer no filtro desse curso; desmarcar todos →
    erro; cadastrar um nome que já existe → erro (RF06).
36. Barra superior logada: não tem mais os links "Painel", "Notas" e "Materiais"; o logo EduGuru leva à página inicial
    (que mostra "Ir para o painel"); no lugar do nome aparece um ícone de pessoa com "Minha conta"
    e o selo Aluno/Admin, e clicar nele abre o Painel, que cumprimenta pelo nome completo.
    Passar o mouse em "Minha conta" → aparecem "Notas" (só para aluno), "Materiais", "Meus dados
    e privacidade" (tela Minha conta), "Modo escuro" e "Modo claro"; chegar no menu com a tecla Tab também abre. Escolher "Modo
    claro" → o site inteiro fica claro e continua claro depois de recarregar e no login; textos
    de quiz, notas e materiais legíveis; voltar para "Modo escuro". No celular, os itens aparecem
    dentro do menu recolhido (RF25, RNF10).
37. Avisos: excluir disciplina, pergunta, material ou notas, sair do quiz e sair da conta abrem a
    janela do EduGuru (no tema escolhido), com título, explicação e o nome da ação no botão; Esc,
    "Cancelar" ou clique fora cancelam; nas exclusões o botão é vermelho. Recusar material na
    Moderação pede o motivo na mesma janela. Excluir conta (Usuários e tela de novo aceite) só
    libera o botão depois de digitar EXCLUIR (RNF04).
