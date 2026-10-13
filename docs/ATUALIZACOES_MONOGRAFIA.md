# Atualizações da monografia — Etapa 2

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

### Testes manuais que faltam para trocar 🟡 por ✅
1. Primeiro login → QR Code → código → entra (RF03).
2. Login seguinte → só código; código errado gera `mfa_falhou` nos Logs (RF04).
3. Acessar rota interna com sessão sem MFA → volta para /mfa (RNF02).
4. Conta antiga (sem aceite) → tela de novo aceite → aceita → entra (RF22).
5. Minha conta: corrigir cidade, revogar localização, baixar JSON (RF21).
6. Excluir conta de teste com material anexado (RF15) — titular e admin.
7. Materiais: aluno envia, outro aluno não vê "Excluir", link expira em 1 h (RF08).
