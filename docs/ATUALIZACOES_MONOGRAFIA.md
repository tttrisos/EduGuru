# Atualizações da monografia — Etapas 2 e 3

Lista do que precisa mudar em `[MONOGRAFIA]EduGuru.pdf` para o texto continuar
igual ao sistema. Organizado por seção da monografia. Atualizado a cada fase.

Legenda de status:
- ✅ **testado** — implementado e com teste executado (SQL de testes ou teste manual registrado).
- 🟡 **implementado, falta teste manual** — só troque `[PREVISTO]` por implementado depois do teste indicado.
- ⚠️ **divergência antiga** — o texto já não batia com o código antes da Etapa 2.

---

## Fase A — Segurança, MFA, logs e direitos LGPD

Testes de banco: `testes/teste_fase_a.sql` rodado em 13/10/2026, 31/31 OK.
Testes manuais pelo navegador: **pendentes** (lista no final deste arquivo).

### Resumo / Abstract / Figura 1 ⚠️
- O texto cita **Tailwind CSS**, mas o projeto usa CSS global com variáveis (como a
  própria seção 1.3 já diz). Trocar "React, TypeScript e Tailwind CSS" por
  "React e TypeScript, com CSS global" no Resumo, no Abstract
  ("React, TypeScript, and global CSS") e na caixa "Front-end / Web" da Figura 1.

### 2.1 Autenticação, Autorização e Criptografia
Substituir o 2º parágrafo ("A verificação em duas etapas (MFA/TOTP) ... está prevista...") por:

> A verificação em duas etapas (MFA/TOTP) é obrigatória para todos os usuários e usa o
> recurso nativo do Supabase Auth (`supabase.auth.mfa`). No primeiro acesso, depois de
> validar e-mail e senha, o sistema exibe um QR Code (e a chave em texto, como
> alternativa) para ser lido em um aplicativo autenticador; o fator só é ativado após a
> confirmação do primeiro código de 6 dígitos. Nos acessos seguintes, o sistema pede o
> código atual do aplicativo. Somente após essa etapa a sessão é elevada ao nível de
> garantia `aal2`. A exigência não fica apenas na interface: políticas restritivas de
> Row Level Security em todas as tabelas e no armazenamento de arquivos recusam
> qualquer sessão que não esteja em `aal2`, de modo que uma senha vazada não basta para
> acessar os dados, mesmo chamando a API diretamente.

No 3º parágrafo, a frase "...ou excluir contas de alunos, não depende apenas de esconder
botões..." passa a ser verdadeira. Sugestão de complemento:

> A exclusão de contas é feita por funções do banco executadas com privilégio de
> servidor (`security definer`), que verificam quem as chamou; a chave administrativa
> do Supabase (service_role) nunca é exposta no front-end.

Acrescentar parágrafo sobre a correção encontrada:

> Durante a revisão da segunda etapa foi identificada e corrigida uma falha de
> autorização: a política que permitia ao usuário editar o próprio perfil não
> restringia as colunas, o que permitiria a um aluno alterar o próprio papel para
> administrador por meio da API. A permissão de alteração passou a ser concedida
> apenas às colunas nome, curso, cidade e estado; papel e dados de consentimento só
> são alterados por funções do servidor.

### 2.2 Logs de Auditoria e Rastreabilidade
- 1º parágrafo: ok (o gatilho em **perfis** agora existe de fato ⚠️ — antes não existia).
  Acrescentar: "No caso do perfil, o log registra apenas **quais** campos foram
  alterados, e não os valores, como medida de minimização de dados."
- Trocar "Eventos ... como login, logout e tentativas de verificação em duas etapas, são
  registrados explicitamente pela aplicação" por:

> Eventos que não correspondem a uma operação de banco (login concluído, logout,
> ativação da verificação em duas etapas e códigos inválidos) são registrados por
> funções do banco que aceitam apenas uma lista fechada de eventos e sempre usam o
> usuário da sessão atual — o front-end não grava diretamente na tabela de logs. Para
> tentativas de login com senha incorreta, que ocorrem sem sessão, há um limite de 20
> registros por e-mail a cada 10 minutos, evitando que a tabela seja inundada.

- Substituir o 3º parágrafo ("...Nesta etapa, a exclusão é feita manualmente...") por:

> Conforme apontado pela orientação na validação da entrega de 28/09, a Política de
> Privacidade previa a exclusão automática dos logs após 90 dias. Nesta etapa a
> exclusão automática foi implementada com a extensão pg_cron: uma tarefa agendada
> executa diariamente às 03h (horário de Brasília) uma função própria, separada da
> usada pelo administrador, que apaga os registros com mais de 90 dias e registra a
> própria execução no log. Essa função não pode ser chamada pela API por nenhum
> usuário. O administrador mantém, como reforço, a limpeza manual pela tela de Logs,
> e a função do banco recusa qualquer prazo inferior a 90 dias.

### 2.3 Integração com API Externa — ViaCEP ⚠️
O texto está correto quanto ao comportamento, mas, na prática, as colunas `cidade` e
`estado` não existiam no banco até esta etapa (o script da atualização 3 não tinha sido
aplicado), e nenhuma cidade/estado foi gravada entre 28/09 e a aplicação da
atualização 4. Decidam se vale registrar isso como "lição aprendida"; o texto da seção
pode ficar como está.

### Finalidade de cidade/estado (Política seção 3 e Apêndice B) ⚠️
A finalidade antiga ("enriquecer o perfil para funcionalidades sociais/regionais
(ex.: ranking por região)") não correspondia a nenhum uso real. Texto novo, igual ao
da Política 1.1:

> Cidade/estado (via CEP, opcional): exibir a localização no perfil do próprio aluno
> (tela Minha conta), como demonstração da integração com uma API externa (ViaCEP).
> Não é mostrada a outros usuários nem usada em ranking, estatística ou qualquer outra
> finalidade — consentimento (o próprio ato de preencher um campo opcional),
> revogável a qualquer momento na tela Minha conta — enquanto a conta existir, ou até
> o titular revogar o consentimento.

### 2.4 Adequação à LGPD
Acrescentar ao final:

> Nesta etapa, os direitos do titular (art. 18 da LGPD) passaram a ser exercidos
> diretamente no sistema, pela tela "Minha conta": acesso a todos os dados guardados
> (inclusive os próprios registros de atividade) com download em arquivo JSON,
> correção de nome, curso, cidade e estado, revogação do consentimento do campo
> opcional de localização e exclusão da conta. O aceite do Termo e da Política passou
> a ser registrado no banco, com data, hora e versão; quando os documentos mudam de
> versão, o sistema solicita um novo aceite no acesso seguinte, permitindo também
> excluir a conta sem aceitar. Os documentos foram atualizados para a versão 1.1.

### 3.1 Requisitos

**RF01** — fluxo principal, passo 3: trocar por
"3. Se válidas, o sistema solicita a verificação em duas etapas (RF03 no primeiro
acesso, RF04 nos seguintes) e só então libera o acesso."
CA01: "...então o sistema deverá iniciar a sessão e encaminhar para a verificação em
duas etapas."

**RF03** 🟡 — remover `[PREVISTO]`. Pré-condição: "O usuário deve ter e-mail e senha
validados e ainda não possuir MFA ativo." Acrescentar RN03: "Fatores não confirmados de
tentativas anteriores são descartados antes de gerar um novo QR Code." Acrescentar
pós-condição: "Ativação registrada no log de auditoria."

**RF04** 🟡 — remover `[PREVISTO]`. Pós-condição já está correta. Acrescentar RN03:
"O banco de dados recusa leitura e escrita de sessões que não estejam em aal2."

**RF08** ⚠️ — o texto diz que só administradores enviam materiais; no sistema, alunos
também enviam. Atores: "Aluno e Administrador (enviam); todos os autenticados
consultam". Pré-condição: "upload exige usuário autenticado". Acrescentar:
- RN04 – Cada material guarda quem o enviou; somente o autor ou um administrador pode
  editá-lo ou excluí-lo (RLS).
- RN05 – Os arquivos não são públicos: são abertos por links temporários, válidos por
  1 hora, gerados apenas para usuários autenticados.

**RF10** ✅ — reescrever:
- Descrição: "O sistema deverá excluir automaticamente, todos os dias, os registros de
  auditoria com mais de 90 dias, e permitir que um administrador acione a mesma limpeza
  manualmente, sem nunca apagar registros com menos de 90 dias."
- Atores: "Sistema (tarefa agendada pg_cron); Administrador (reforço manual)."
- Fluxo: 1. Diariamente às 03h (Brasília) a tarefa agendada executa a função de
  limpeza. 2. A função remove os registros com mais de 90 dias e registra a execução.
  3. Opcionalmente, um administrador aciona a limpeza manual na tela de Logs.
- RN02: tirar "[previsto]" e o condicional ("não depende... e não pode ser chamada...").
- **CA02 ⚠️ está errado hoje**: diz que o sistema "aplica o piso mesmo assim"; na
  verdade ele **recusa** a operação. Trocar por: "Dado uma chamada à função de limpeza
  com prazo menor que 90 dias, então o sistema deverá recusar a operação e informar o
  prazo mínimo."
- Acrescentar CA03: "Dado qualquer usuário autenticado, quando tentar chamar
  diretamente a função usada pela tarefa agendada, então o banco deverá negar."
- Remover a linha "Status: ...prevista para a próxima etapa".

**RF13** — pós-condição: "Aceite registrado no perfil do usuário com data, hora e
versão dos documentos." Acrescentar RN02: "Quando o Termo ou a Política mudam de
versão, o usuário deve aceitar a nova versão no acesso seguinte (ver RF22)."

**RF14** — RN01: acrescentar "...e todas exigem sessão com verificação em duas etapas
concluída (aal2)."

**RF15** 🟡 — substituir o texto curto por um RF completo:
- Título: "RF15 – Excluir conta de usuário"
- Descrição: "O sistema deverá permitir que o próprio titular exclua sua conta, pela
  tela Minha conta, e que um administrador exclua a conta de outro usuário, pela tela
  Usuários."
- Atores: Aluno, Administrador.
- Pré-condições: usuário autenticado com MFA concluído.
- Fluxo: 1. O usuário solicita a exclusão. 2. O sistema exige confirmação explícita
  (digitar EXCLUIR). 3. Os arquivos de materiais enviados pelo usuário são removidos do
  armazenamento. 4. Uma função do banco registra a exclusão no log e apaga a conta de
  autenticação; perfil e materiais são apagados junto.
- RN01 – A chave administrativa do Supabase nunca é usada no front-end; a exclusão é
  feita por função do banco que verifica quem a chamou.
- RN02 – O último administrador não pode excluir a própria conta.
- RN03 – Os registros de auditoria já existentes são mantidos até completar 90 dias.
- CA01 – Dado um titular com MFA concluído, quando confirmar a exclusão, então conta,
  perfil e materiais deverão deixar de existir.
- CA02 – Dado um aluno, quando tentar excluir a conta de outro usuário pela API, então
  o banco deverá negar.

**Novo RF21 – Exercer direitos do titular (Minha conta)** 🟡 — descrição: acesso,
download em JSON, correção (nome, curso, cidade, estado), revogação do consentimento
de localização e exclusão (RF15). RN: e-mail e papel não são alterados pelo titular;
toda alteração gera log com o nome dos campos alterados.

**Novo RF22 – Solicitar novo aceite dos termos** 🟡 — quando a versão aceita difere
da vigente (ou não há registro de aceite), o sistema exige o novo aceite antes de
liberar a área logada; o usuário pode excluir a conta nessa mesma tela sem aceitar.

**RNF02** 🟡 — remover `[PREVISTO]`. Acrescentar ao critério: "...e o banco de dados
deverá recusar requisições de sessões sem MFA concluído."

**RNF08** ✅ — reescrever: "Os dados de auditoria têm prazo de retenção de 90 dias,
com descarte automático diário por tarefa agendada no banco (pg_cron) e descarte manual
como reforço, sempre respeitando o prazo mínimo."

### 3.2 Diagrama de Classes — Figura 2
- **Perfil**: acrescentar `consentimento_aceito: boolean`, `consentimento_em: datetime`,
  `versao_termos: string`.
- **Material**: acrescentar `enviado_por: uuid`; trocar a associação "cadastra (admin)"
  por "envia (aluno ou admin)".
- **LogAuditoria**: o método `limparAntigos(dias)` continua; acrescentar
  `limparAutomatico() : int` (tarefa agendada).

### 3.3 BPMN — Figura 4
O fluxo de MFA deixou de ser previsto: redesenhar os elementos tracejados com linha
cheia e remover a legenda "previsto". Ajustes no fluxo:
- "Registrar log de login" passa a ocorrer **depois** do código válido (hoje está logo
  após a senha).
- Código inválido → "Registrar log (mfa_falhou)" → nova tentativa.
- Após o MFA, novo gateway: "Aceite da versão vigente registrado?" — Não → "Exibir
  novo aceite" → Aceita → área restrita.
- O texto abaixo da figura: trocar "Nenhuma dessas etapas de MFA está implementada" pela
  descrição do fluxo implementado.

### Apêndices
- **A (Termo)** e **B (Política)**: substituir pelo texto da versão 1.1 (páginas
  `/termos` e `/privacidade`). A data da versão será ajustada quando a Etapa 2 for
  publicada (decisão: uma versão única no fim da etapa).
- **C (Retenção)**: atualizar a tabela:

| Dado pessoal | Retenção | Forma de descarte |
|---|---|---|
| Nome, e-mail, senha | Enquanto a conta existir | Exclusão da conta pelo titular (Minha conta) ou por administrador |
| Fator MFA e registro do aceite (data/versão) | Enquanto a conta existir | Junto com a exclusão da conta |
| Curso, cidade, estado | Enquanto a conta existir (cidade/estado: até o titular revogar) | Junto com a exclusão da conta; cidade/estado também por revogação na tela Minha conta |
| Logs de auditoria | 90 dias corridos | Exclusão automática diária (pg_cron, 03h); manual por admin como reforço, com piso de 90 dias |
| Materiais enviados (e arquivos) | Até exclusão pelo autor ou admin, ou exclusão da conta do autor | Remoção do Supabase Storage junto com o registro no banco |

  Remover o parágrafo "A escolha por retenção manual dos logs nesta etapa..."

---

## Interface — Home pública, novo Login e barra superior

O que mudou: página inicial pública (`/`) apresentando o sistema (como funciona,
recursos, cursos atendidos), Login em duas colunas, e a barra lateral da área logada
substituída por uma barra horizontal no topo. A área logada passou a começar em
`/inicio`. Nenhum dado novo é coletado (sem impacto na Política/Termo, exceto a
menção ao "menu", já ajustada).

### 1.3 Tecnologias / Figura 1
Na caixa "Front-end / Web" da Figura 1, acrescentar "Home pública (apresentação)".

### 2.4 Adequação à LGPD
Trocar "disponíveis em páginas acessíveis a qualquer momento pelo sistema, tanto pelo
menu lateral quanto pelo rodapé" por:

> disponíveis em páginas acessíveis a qualquer momento pelo rodapé de todas as telas
> do sistema — inclusive na página inicial pública e na tela de login —,
> independentemente de o usuário estar ou não autenticado

### RF11 e RF12
- Descrição: trocar "por meio de links fixos no menu e no rodapé" por "por meio de
  links no rodapé de todas as telas".
- Fluxo, passo 1: trocar "disponível no menu lateral e no rodapé" por "disponível no
  rodapé".

### Novo RF23 – Apresentar a plataforma a visitantes (Home pública)
- Descrição: o sistema deverá exibir, sem login, uma página inicial que apresenta o
  EduGuru (como funciona, recursos e cursos atendidos), com acesso ao login e ao
  cadastro.
- Atores: Visitante.
- RN01 – A página não coleta nenhum dado pessoal.
- RN02 – Recursos ainda não entregues são marcados como "Em breve" (a página não
  anuncia funcionalidade inexistente).
- CA01 – Dado um visitante não autenticado, quando acessar o endereço do sistema,
  então deverá ver a página inicial com os botões "Entrar" e "Criar conta".

### RNF05 – Portabilidade e responsividade
Acrescentar ao final: "No celular, o menu da barra superior é recolhido em um botão."

---

## Esqueci minha senha

### 2.1 Autenticação, Autorização e Criptografia
Acrescentar parágrafo:

> A recuperação de acesso ("esqueci minha senha") usa o recurso nativo do Supabase
> Auth: o usuário informa o e-mail e recebe um link que abre a tela de nova senha. A
> resposta exibida é sempre a mesma, exista ou não conta com aquele e-mail, para não
> revelar quem está cadastrado. Se a conta possui verificação em duas etapas, o código
> do aplicativo autenticador é exigido antes da troca — o acesso apenas ao e-mail não
> basta. Concluída a troca, todas as sessões abertas da conta são encerradas. Para
> compatibilizar o link do e-mail com o roteamento por hash (HashRouter), o cliente
> Supabase usa o fluxo PKCE, em que o link retorna com um código de uso único que só
> pode ser trocado por uma sessão no mesmo navegador em que o pedido foi feito.

### 2.2 Logs
Na lista de eventos registrados por função, acrescentar "pedidos de redefinição de
senha (limitados a 5 por e-mail a cada 10 minutos) e senhas redefinidas".

### Novo RF24 – Redefinir senha esquecida 🟡
- Descrição: o sistema deverá permitir que o usuário que esqueceu a senha receba por
  e-mail um link para cadastrar uma nova senha.
- Atores: Visitante (com conta).
- Fluxo: 1. Na tela de login, o usuário escolhe "Esqueci minha senha" e informa o
  e-mail. 2. O sistema solicita ao Supabase Auth o envio do link e exibe mensagem
  genérica. 3. O usuário abre o link no mesmo navegador. 4. Se a conta tem MFA, informa
  o código do autenticador. 5. Informa e confirma a nova senha (mesmas regras do
  cadastro). 6. O sistema troca a senha, registra no log, encerra todas as sessões e
  volta ao login.
- RN01 – A mensagem não revela se o e-mail possui conta.
- RN02 – Contas com MFA exigem o código do autenticador antes da troca.
- RN03 – A nova senha segue as regras do RF02 e não pode ser igual à anterior.
- RN04 – Após a troca, todas as sessões da conta são encerradas.
- CA01 – Dado um link válido aberto no mesmo navegador, quando o usuário informar
  código (se houver MFA) e nova senha válida, então a senha deverá ser trocada e o
  login com a senha antiga deverá falhar.
- CA02 – Dado um link expirado ou aberto em outro navegador, então o sistema deverá
  informar que o link é inválido e oferecer novo pedido.

### Apêndice B (Política)
Seção 2 (registros de auditoria) e seção 4 (Supabase envia os e-mails de confirmação e
de redefinição) foram atualizadas — usar o texto da página `/privacidade`.

---

## Publicação (GitHub Pages + GitHub Actions)

### 1.3 Tecnologias, Ferramentas e Arquitetura
No item "Front-end", trocar "O front-end será hospedado no GitHub Pages." por:

> O front-end é publicado no GitHub Pages (https://tttrisos.github.io/EduGuru/) por um
> fluxo de integração e entrega contínuas (GitHub Actions): a cada atualização da
> branch principal, o código passa por verificação estática (ESLint), é compilado e
> publicado automaticamente, sem passos manuais.

Na Figura 1, se quiser, acrescentar a caixa "GitHub Actions → GitHub Pages" entre o
repositório e o Front-end.

### RNF05
O texto já cita GitHub Pages e HashRouter — continua correto.

### Testes manuais que faltam para trocar 🟡 por ✅
1. Primeiro login → QR Code → código → entra (RF03).
2. Login seguinte → só código; código errado gera `mfa_falhou` nos Logs (RF04).
3. Acessar rota interna com sessão sem MFA → volta para /mfa (RNF02).
4. Conta antiga (sem aceite) → tela de novo aceite → aceita → entra (RF22).
5. Minha conta: corrigir cidade, revogar localização, baixar JSON (RF21).
6. Excluir conta de teste com material anexado (RF15) — titular e admin.
7. Materiais: aluno envia, outro aluno não vê "Excluir", link expira em 1 h (RF08).
8. Barra superior logada: links, "Minha conta", "Sair" e menu recolhido no celular
   (RF23/RNF05). Home e Login já foram conferidos por captura de tela em 18/10/2026.
9. Esqueci minha senha (RF24): pedir link → e-mail chega → abrir no mesmo navegador →
   código MFA → nova senha → login com a nova funciona e com a antiga falha; link
   aberto em outro navegador mostra "link inválido". Rodar também
   `testes/teste_redefinicao_senha.sql`.

---

# Etapa 3 — Feedback do orientador (05/10) e entrega de 09/11

Esta parte cobre o feedback da validação de 05/10 e a entrega de 09/11 (75% dos RFs,
dashboard, validações, branch `entrega0911`). O andamento item a item está em
`docs/CHECKLIST_ENTREGAS.md`.

Scripts novos (rodar **em ordem** no SQL Editor, depois do 9):
`supabase_atualizacao_10.sql` → `_11.sql` → `_12.sql`. O `supabase_00_tabelas_base.sql`
não muda nada no banco atual (só registra a criação original das tabelas).
Testes de banco: `testes/teste_gamificacao.sql` (novo) e `testes/teste_fase_a.sql`
(ajustado à atualização 10). Testes unitários: `npm test` (16 testes, regras de notas e senha).

## ⚠️ Antes de tudo: o código precisa estar no GitHub
O orientador não encontrou MFA, pg_cron, exclusão de contas, gatilho de perfis e registro
do consentimento porque **nada disso foi enviado**: o `origin/main` só tinha o README e o
`origin/entrega2809` parava em 27/09. Tudo estava implementado localmente (atualizações 4 a
9). Com o push da branch `entrega0911`, o texto da Fase A (acima) passa a ser verdadeiro
**sem marcar nada como "Previsto"**.

Sugestão de resposta ao orientador sobre o item 1 do feedback:

> Professor, os itens do tópico 1 (MFA/TOTP, limpeza diária via pg_cron com função própria
> sem exigir admin, exclusão de contas pelo admin, gatilho de auditoria em perfis e
> registro do consentimento) estavam implementados localmente e não tinham sido enviados ao
> repositório. Eles estão agora na branch entrega0911 (scripts supabase_atualizacao_4 a 9 e
> telas Mfa, Usuarios, MinhaConta e NovoAceite).

## Item 2 do feedback — Materiais (RF08 × RLS)
Decisão do grupo: **ajustar o RF** (alunos enviam material, é a proposta da biblioteca
colaborativa) e **corrigir a política**, que já não é mais "qualquer logado escreve":
desde a atualização 4, a política `materiais_autenticado_escreve` foi apagada e trocada por
três: inserir só como autor (`enviado_por = auth.uid()`), editar/excluir só o autor ou o
admin (`eh_admin()`). O texto do RF08 está na seção "3.1 Requisitos" da Fase A, acima.
Acrescentar ao RF08 nesta etapa:
- Fluxo: "o usuário pode escolher a disciplina do material (opcional)".
- RN06 – O link precisa começar com http:// ou https://.
- RN07 – Materiais com disciplina são os indicados pelo Guru (RF28).

## Resumo / Abstract
Além da troca de "Tailwind CSS" por CSS global (Fase A), atualizar a frase das
funcionalidades. Sugestão para o Resumo:

> O sistema permite ao aluno responder quizzes por disciplina, corrigidos e pontuados no
> próprio banco de dados, acompanhar sua posição em um ranking, receber indicações de
> materiais de estudo quando apresenta baixo desempenho (Guru) e registrar notas e faltas
> para acompanhar sua situação acadêmica em um painel com indicadores e gráficos.

## Objetivos, Justificativa e "Dashboard Acadêmico" (item 3 do feedback)
- **Notas, faltas e M1/M2/ND/Exame**: agora têm RF (RF29) e estão implementados (tela
  Notas). Nenhuma alteração de escopo; só referenciar o RF29 onde aparecem.
- **Ranking "de amigos"**: **retirar do escopo** (decisão tomada nesta etapa — se o grupo
  preferir manter, marcar como "Previsto"). Motivo para a banca: exigiria uma
  funcionalidade social (convites, lista de amigos) que aumenta o tratamento de dados
  pessoais sem ganho para o objetivo do projeto. O ranking geral e o ranking por disciplina
  atendem à gamificação. Apagar "Ranking de Amigos" dos objetivos, da justificativa e do
  README (já apagado no README).
- **Gamificação**: RFs criados (RF25 a RF28), com as regras definidas — ver 3.1.

## Nova seção — Fundamentação teórica (pedido do orientador)
Sugestão: criar a seção **2.5 Gamificação na educação** (ou um capítulo próprio, se o
modelo da UMC pedir "Fundamentação Teórica" separada). Texto-base para adaptar:

> Gamificação é definida por Deterding et al. (2011) como o uso de elementos de design de
> jogos em contextos que não são jogos. Os autores diferenciam a gamificação dos jogos
> sérios: não se cria um jogo completo, mas se incorporam elementos como pontos, níveis,
> classificações e feedback imediato a uma atividade já existente. Kapp (2012) aplica o
> conceito à aprendizagem e defende que esses elementos, quando ligados a objetivos
> instrucionais claros, aumentam o engajamento e a motivação do aluno, sobretudo pelo
> feedback rápido e pela possibilidade de errar e tentar de novo sem penalidade.
>
> Werbach e Hunter (2012) organizam os elementos de jogo em três níveis — dinâmicas,
> mecânicas e componentes — e alertam que componentes como pontos e placares (o chamado
> modelo PBL: points, badges e leaderboards) não produzem engajamento sozinhos: precisam
> estar a serviço de um objetivo. Na revisão de estudos empíricos de Hamari, Koivisto e
> Sarsa (2014), a gamificação apresentou efeitos majoritariamente positivos, mas
> dependentes do contexto e do perfil dos usuários.
>
> O EduGuru adota esses fundamentos da seguinte forma: (i) **pontos** por acerto, com peso
> por nível de dificuldade, como feedback imediato do desempenho; (ii) **classificação**
> (ranking geral e por disciplina) como elemento de comparação social, exibindo apenas o
> nome abreviado e permitindo ao aluno ocultar o próprio nome; (iii) **feedback corretivo**
> ao fim de cada rodada, com a alternativa correta de cada pergunta errada; e (iv) o
> **Guru**, que transforma o baixo desempenho em indicação de material de estudo, ligando a
> mecânica de jogo ao objetivo de aprendizagem, como recomendam Kapp (2012) e Werbach e
> Hunter (2012). Para evitar que a pontuação vire um fim em si mesma, cada pergunta só
> pontua na primeira vez em que é acertada: repetir o quiz serve para revisar, não para
> acumular pontos.

**Conferir as citações nas obras antes de entregar** (página, edição): o texto acima
resume as ideias centrais de cada autor, mas citação direta exige a página.

## 1.3 Tecnologias, Ferramentas e Arquitetura / Figura 1 (item "Arquitetura" do feedback)
Refazer a Figura 1 com estas caixas (substitui as orientações anteriores sobre a figura):
- **Usuário (navegador)** → **Front-end**: React + TypeScript + Vite, CSS global próprio
  (sem Tailwind), roteamento HashRouter. Telas: Home pública, Login/MFA, Painel, Quiz,
  Ranking, Notas, Disciplinas, Perguntas, Materiais, Usuários, Logs, Minha conta.
- **GitHub (repositório)** → **GitHub Actions** (lint, testes, build) → **GitHub Pages**
  (hospedagem do front-end).
- **Supabase**, com quatro caixas internas: **Auth** (login, MFA/TOTP, e-mails de
  redefinição), **Banco PostgreSQL** (tabelas + RLS + funções `security definer`),
  **Storage** (arquivos de materiais, bucket privado), **pg_cron** (limpeza diária de logs).
- **ViaCEP** (API externa, chamada direto do navegador só com o CEP).
- Setas: Front-end ↔ Supabase (HTTPS, chave pública + JWT do usuário); Front-end → ViaCEP
  (HTTPS, só o CEP).

Acrescentar parágrafo de **decisões técnicas** (pedido do coorientador: "decisões técnicas
adotadas"):

> As regras que não podem depender do navegador foram implementadas no banco de dados:
> o sorteio, a correção e a pontuação do quiz são feitos por funções PostgreSQL
> (`iniciar_quiz` e `finalizar_quiz`), e o aluno não tem permissão de gravar diretamente
> nas tabelas de rodadas e respostas, o que impede alterar a própria pontuação pela API.
> O gabarito das perguntas fica em uma tabela separada, legível apenas por
> administradores, de modo que o aluno nunca recebe a resposta correta antes de finalizar
> a rodada. O ranking também é uma função do banco, que expõe apenas posição, nome
> abreviado e pontos, já que o perfil dos demais alunos não é legível. Já as regras de
> cálculo das notas (nota de desempenho, exame e limite de faltas) ficam em um módulo
> TypeScript sem dependência de tela ou banco (`src/lib/notas.ts`), o que permite
> testá-las com testes unitários automatizados (Vitest), executados a cada publicação.

## 2.1 Autenticação — acrescentar (recuperação do MFA e limite de tentativas)
> Para o caso de perda do aparelho com o aplicativo autenticador, um administrador pode
> redefinir a verificação em duas etapas do usuário pela tela Usuários. A operação é feita
> por uma função do banco que verifica se quem a chamou é administrador com sessão aal2,
> remove o fator cadastrado e registra a ação no log de auditoria; a senha continua sendo
> exigida, e no acesso seguinte o usuário cadastra o aplicativo novamente. Além disso,
> após cinco códigos inválidos consecutivos a sessão é encerrada e o usuário precisa
> informar a senha de novo; cada código inválido e o bloqueio ficam registrados no log.

Limitação a registrar (honestidade com a banca): o limite de 5 tentativas é controlado na
tela, por sessão; o próprio Supabase Auth também limita as verificações por IP. Um bloqueio
por conta no servidor exigiria o *hook* de verificação de MFA, disponível apenas em planos
pagos do Supabase.

## 2.2 Logs — acrescentar/ajustar (itens "Segurança e código" do feedback)
- **Limpeza manual**: trocar "a função do banco recusa qualquer prazo inferior a 90 dias"
  por: "a função de limpeza manual não recebe parâmetro: o prazo de 90 dias é fixo dentro
  da função, e cada limpeza manual também é registrada no log (quem fez e quantos registros
  foram removidos)".
- **Log anônimo de login falho**: acrescentar: "O registro só é feito quando o e-mail
  pertence a uma conta existente, o que impede a criação de registros com e-mails
  inventados; a função não retorna nenhuma informação, de modo que quem a chama não
  descobre se o e-mail está cadastrado. Como limitação, um terceiro que conheça o e-mail de
  um usuário ainda pode gerar até 20 registros de falha a cada 10 minutos para esse e-mail."
- **Novos eventos**: "quiz finalizado (acertos e pontos), bloqueio do MFA por tentativas,
  redefinição do MFA pelo administrador e limpeza manual".
- **Notas**: "As alterações de notas e faltas são registradas sem os valores (apenas ação,
  tabela e registro), porque o administrador lê os logs e não deve ver as notas dos alunos."

## 2.4 LGPD — acrescentar
> Na terceira etapa, o Termo de Aceite e a Política de Privacidade passaram à versão 1.2,
> para incluir os dados do quiz, do ranking e das notas. A exibição no ranking usa apenas o
> primeiro nome e a inicial do sobrenome, com base no legítimo interesse educacional, e o
> aluno pode se opor desmarcando a opção "Mostrar meu nome no ranking" em Minha conta,
> passando a aparecer como "Aluno anônimo". As notas e faltas são opcionais, informadas pelo
> próprio aluno com base no consentimento, visíveis apenas para ele (nem o administrador as
> lê) e podem ser apagadas a qualquer momento. O arquivo de dados pessoais baixado em Minha
> conta passou a incluir notas, faltas e rodadas de quiz.

Sobre o "RF para o pedido de exclusão de dados pelo titular" (feedback): já é o **RF15**
(fluxo do titular, tela Minha conta). Basta citar no RF15: "atende ao direito de eliminação
(LGPD, art. 18, VI)".

## 3.1 Requisitos — ajustes e RFs novos

### RF de cadastro de Perguntas (o RF atual de Perguntas) — reescrever
- Descrição: "O sistema deverá permitir que o administrador cadastre perguntas do quiz,
  cada uma ligada a uma disciplina, com enunciado, nível (Fácil, Médio ou Difícil), quatro
  alternativas e a indicação da alternativa correta."
- RN01 – Somente administradores cadastram e excluem perguntas (RLS e função do banco).
- RN02 – Enunciado com 10 a 500 caracteres; as quatro alternativas são obrigatórias e
  diferentes entre si; uma alternativa deve ser marcada como correta.
- RN03 – O gabarito é guardado separado da pergunta e não pode ser lido por alunos.
- RN04 – Perguntas sem disciplina ou sem gabarito não entram no quiz (marcadas como
  "Incompleta").
- CA01 – Dado um aluno, quando tentar ler o gabarito pela API, então o banco deverá
  retornar vazio.

### RF de Disciplinas — acrescentar
- Campo "total de aulas" (1 a 400, padrão 80), base do limite de faltas (RF29).
- RN: não pode haver duas disciplinas com o mesmo nome no mesmo curso (validado na tela).
- Excluir uma disciplina exclui as perguntas e as notas ligadas a ela (pede confirmação).

### RF04 — acrescentar
- RN04 – Após 5 códigos inválidos consecutivos, a sessão é encerrada e o usuário volta ao
  login; o bloqueio é registrado no log ("mfa_bloqueado").
- Exceção (fluxo alternativo): "5 códigos inválidos → encerrar sessão → voltar ao login".

### RF10 — substitui o CA02 sugerido na Fase A
- RN02 – O prazo de 90 dias é fixo dentro da função (não é parâmetro).
- CA02 – "Dado um administrador, quando acionar a limpeza manual, então somente registros
  com mais de 90 dias deverão ser removidos e a limpeza deverá ser registrada no log."

### Novo RF25 – Responder quiz
- Descrição: "O sistema deverá permitir que o aluno responda a uma rodada de quiz de uma
  disciplina escolhida, com até 10 perguntas sorteadas, e veja a correção ao final."
- Atores: Aluno.
- Pré-condições: autenticado com MFA (aal2); a disciplina possui perguntas completas.
- Fluxo: 1. O aluno escolhe a disciplina. 2. O sistema sorteia até 10 perguntas com gabarito
  e as exibe sem a resposta correta. 3. O aluno marca uma alternativa em cada pergunta.
  4. O sistema envia as respostas; o banco corrige e devolve, para cada pergunta, a resposta
  dada, a correta e os pontos. 5. O sistema exibe acertos, aproveitamento e pontos.
- Fluxos alternativos: disciplina sem perguntas → mensagem; pergunta sem resposta → aviso
  "falta responder N pergunta(s)"; rodada com mais de 30 minutos → recusada.
- RN01 – Até 10 perguntas por rodada, sorteadas da disciplina escolhida.
- RN02 – O gabarito só é revelado depois de a rodada ser finalizada.
- RN03 – Só uma rodada aberta por aluno; iniciar outra descarta a anterior não finalizada.
- RN04 – A rodada deve ser finalizada em até 30 minutos e não pode ser finalizada duas vezes.
- RN05 – O aluno não grava rodadas nem respostas diretamente: só pelas funções do banco.
- CA01 – Dado um aluno com MFA, quando finalizar a rodada, então deverá ver os acertos e a
  alternativa correta de cada pergunta errada.
- CA02 – Dado um aluno, quando tentar finalizar a rodada de outro aluno, então o banco
  deverá recusar.

### Novo RF26 – Pontuar acertos
- Descrição: "O sistema deverá atribuir pontos aos acertos do quiz conforme o nível de
  dificuldade da pergunta."
- RN01 – Fácil = 10 pontos, Médio = 20, Difícil = 30. Erro ou pergunta sem resposta = 0.
- RN02 – Cada pergunta só pontua na primeira vez em que o aluno a acerta.
- RN03 – A pontuação é calculada no banco de dados; o aluno não consegue alterá-la pela API.
- CA01 – Dado um aluno que acerta uma pergunta Difícil pela primeira vez, então deverá
  ganhar 30 pontos; ao acertá-la de novo em outra rodada, 0 ponto.

### Novo RF27 – Consultar ranking
- Descrição: "O sistema deverá exibir a classificação dos alunos pela soma dos pontos,
  geral ou filtrada por disciplina."
- Atores: Aluno, Administrador.
- RN01 – Participam apenas alunos com pontos (administradores não aparecem).
- RN02 – São exibidos os 10 primeiros e, se o aluno estiver fora deles, também a posição dele.
- RN03 – Exibe apenas posição, primeiro nome com a inicial do sobrenome e pontos.
- RN04 – Empates ficam na mesma posição.
- RN05 – O aluno pode ocultar o nome (aparece "Aluno anônimo"), sem perder os pontos.
- CA01 – Dado um aluno que desmarcou "Mostrar meu nome no ranking", quando outro aluno
  consultar o ranking, então deverá ver "Aluno anônimo" na posição dele.

### Novo RF28 – Receber indicações do Guru
- Descrição: "O sistema deverá indicar materiais de estudo das disciplinas em que o aluno
  apresenta baixo desempenho."
- Critério de **baixo desempenho**: aproveitamento (acertos ÷ respostas) **abaixo de 60%**
  em uma disciplina, considerando todas as rodadas finalizadas, **com pelo menos 5
  respostas** nessa disciplina. No resultado de uma rodada, o Guru aparece quando o
  aproveitamento da própria rodada fica abaixo de 60%.
- Fluxo: 1. O aluno abre o Painel (ou termina uma rodada). 2. O sistema calcula o
  aproveitamento por disciplina. 3. Para cada disciplina com baixo desempenho, lista os
  materiais ligados a ela.
- RN01 – Só são indicados materiais com disciplina definida (RF08).
- RN02 – Sem material na disciplina, o Guru informa que ainda não há material.
- CA01 – Dado um aluno com 0 de 6 acertos em uma disciplina com um material cadastrado,
  então o Guru deverá indicar esse material.

### Novo RF29 – Registrar notas e faltas
- Descrição: "O sistema deverá permitir que o aluno registre suas notas (M1, M2 e Exame) e
  faltas por disciplina e calcular a situação."
- Regras de cálculo (**confirmar com o regulamento do curso**; se mudar, só
  `src/lib/notas.ts` muda):
  - ND = (M1 + M2) ÷ 2. ND ≥ 6 → Aprovado.
  - ND < 6 → Em exame. Média final = (ND + Exame) ÷ 2; ≥ 5 → Aprovado no exame; < 5 → Reprovado.
  - Limite de faltas = 25% do total de aulas da disciplina (arredondado para baixo).
    Acima do limite → Reprovado por falta, independentemente da nota.
  - Alerta quando as faltas atingem 75% do limite.
- RN01 – Notas de 0 a 10 (vírgula ou ponto), podendo ficar em branco; faltas inteiras,
  de 0 até o total de aulas.
- RN02 – Um registro por aluno e disciplina (salvar de novo atualiza).
- RN03 – Somente o próprio aluno lê e altera suas notas (nem o administrador).
- RN04 – O log registra a alteração sem os valores.
- CA01 – Dado M1 = 7 e M2 = 5, então ND = 6 e situação "Aprovado".
- CA02 – Dado nota 11, então o sistema deverá recusar.

### Novo RF30 – Visualizar painel (Dashboard)
- Descrição: "O sistema deverá exibir um painel com indicadores e gráficos."
- Aluno — indicadores: pontos, posição no ranking, quizzes feitos, % de acertos, média
  geral (ND) e disciplinas em alerta. Gráficos: acertos por disciplina e acertos nas
  últimas 10 rodadas. Inclui o quadro do Guru (RF28).
- Administrador — indicadores: alunos, disciplinas, perguntas prontas, materiais, quizzes
  realizados e % de acertos geral. Gráficos: quizzes nos últimos 7 dias e acertos da turma
  por disciplina.
- RN01 – O administrador vê apenas números agregados, nunca dados de um aluno.
- RN02 – Todos os números vêm do banco no momento da consulta.

### Novo RF31 – Redefinir verificação em duas etapas
- Descrição: "O sistema deverá permitir que um administrador redefina o MFA de um usuário
  que perdeu o acesso ao aplicativo autenticador."
- RN01 – Só administrador com aal2; não pode redefinir o próprio.
- RN02 – A senha continua exigida; no próximo acesso o usuário cadastra o app novamente (RF03).
- RN03 – A ação fica no log ("mfa_redefinido").

### RNF — tornar mensuráveis (feedback) e RNF de desempenho
- **RNF05 (Portabilidade/responsividade)**: "Todas as telas devem funcionar sem rolagem
  horizontal da página em larguras de 360 px a 1920 px, nos navegadores Chrome, Edge e
  Firefox em suas versões atuais; tabelas largas rolam dentro do próprio quadro."
- **RNF06**: reescrever o critério atual com um número verificável. Modelo: "...medido por
  [o quê], com meta de [valor]". Exemplo, se o RNF06 for de usabilidade: "um usuário novo
  deve conseguir iniciar uma rodada de quiz em até 3 cliques a partir do Painel, e toda
  mensagem de erro de formulário deve indicar o campo e a correção esperada".
- **Novo RNF09 – Desempenho**: "Em conexão 4G, o Painel deve carregar em até 3 segundos e a
  correção de uma rodada de quiz deve ser exibida em até 2 segundos após o envio."

## 3.2 Diagrama de Classes (Figura 2 e Figura 3)
Substituir pela versão em `docs/diagramas/diagrama_classes.md` (tem a tabela "o que mudou",
que responde ponto a ponto ao item 4 do feedback, e o passo a passo para exportar em alta
resolução). **Isso substitui as orientações da Fase A sobre a Figura 2.**
A **Figura 3** (reexportar em alta resolução, tirar o "\n" e corrigir a acentuação) é uma
figura feita por vocês; o arquivo original não está no repositório. Reexportem em PNG
300 dpi ou SVG.

## 3.3 BPMN (Figura 4 e figura nova)
Seguir `docs/diagramas/bpmn.md`: correção da Figura 4 (fluxos contínuos, sem cruzamentos,
log das falhas, exceção de limite de tentativas, gateway do novo aceite) e a **figura nova
do processo central** (quiz → pontuação → ranking → Guru). **Substitui as orientações da
Fase A sobre a Figura 4.**

## Apêndices (feedback: "citados mas não existem")
- **Apêndice A – Termo de Aceite**: copiar o texto da página `/termos` (versão 1.2).
- **Apêndice B – Política de Privacidade**: copiar o texto da página `/privacidade` (versão 1.2).
- **Apêndice C – Tabela de retenção**: usar a tabela da Fase A e acrescentar as linhas:

| Dado pessoal | Retenção | Forma de descarte |
|---|---|---|
| Rodadas de quiz, respostas e pontos | Enquanto a conta existir | Junto com a exclusão da conta |
| Preferência de exibição no ranking | Enquanto a conta existir | Junto com a exclusão da conta |
| Notas e faltas | Até o aluno apagar o registro ou excluir a conta | Exclusão na tela Notas ou junto com a conta |

## Formatação da monografia (itens do feedback)
- Remover todas as marcações amarelas.
- Usar o **tempo presente** para o que está implementado ("o sistema exibe", não "o sistema
  exibirá"). Após esta etapa, praticamente tudo está implementado.
- **REFERÊNCIAS**: título sem numeração, ordem alfabética, ABNT (NBR 6023). Entradas novas:

> DETERDING, Sebastian; DIXON, Dan; KHALED, Rilla; NACKE, Lennart. From game design elements
> to gamefulness: defining "gamification". In: INTERNATIONAL ACADEMIC MINDTREK CONFERENCE, 15.,
> 2011, Tampere. **Proceedings** [...]. New York: ACM, 2011. p. 9-15.
>
> HAMARI, Juho; KOIVISTO, Jonna; SARSA, Harri. Does gamification work? A literature review of
> empirical studies on gamification. In: HAWAII INTERNATIONAL CONFERENCE ON SYSTEM SCIENCES,
> 47., 2014, Waikoloa. **Proceedings** [...]. Washington: IEEE, 2014. p. 3025-3034.
>
> KAPP, Karl M. **The gamification of learning and instruction**: game-based methods and
> strategies for training and education. San Francisco: Pfeiffer, 2012.
>
> WERBACH, Kevin; HUNTER, Dan. **For the win**: how game thinking can revolutionize your
> business. Philadelphia: Wharton Digital Press, 2012.

  Conferir também se BRASIL (Lei nº 13.709/2018 — LGPD), a documentação do Supabase e do
  ViaCEP estão completas (autor, título, URL e "Acesso em:").

## Testes manuais da Etapa 3 (fazer antes do vídeo)
10. Admin cadastra disciplina com total de aulas; tenta salvar com 0 aulas → erro.
11. Admin cadastra pergunta: sem alternativa correta → erro; alternativas repetidas → erro;
    completa → aparece "Correta: X".
12. Aluno faz quiz: tenta finalizar com pergunta em branco → aviso; finaliza → resultado
    com pontos; refaz → 0 ponto nas já acertadas.
13. Aluno vai mal (< 60%) → Guru aparece no resultado e no Painel (com 5+ respostas).
14. Ranking geral e por disciplina; desmarcar "Mostrar meu nome" em Minha conta → outro
    aluno vê "Aluno anônimo".
15. Notas: nota 11 → erro; M1 7 e M2 5 → Aprovado; faltas acima de 25% → Reprovado por falta.
16. Painel do aluno e do admin com números e gráficos.
17. Admin redefine o MFA de um aluno → no login seguinte o aluno vê o QR Code de novo.
18. MFA: errar o código 5 vezes → volta ao login com aviso; log "mfa_bloqueado".
19. Logs: botão de limpeza manual funciona e gera "Limpeza manual de logs".
20. Conta com aceite 1.1 → tela de novo aceite (versão 1.2).
