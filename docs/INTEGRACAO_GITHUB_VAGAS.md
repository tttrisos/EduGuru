# Integração com API externa — API do GitHub (EduGuru Carreiras)

## O que é

A área **Carreiras** mostra vagas de tecnologia publicadas por duas comunidades
brasileiras que usam as *issues* do GitHub como mural de vagas:

| Repositório | Foco |
|---|---|
| [backend-br/vagas](https://github.com/backend-br/vagas) | Back-end, dados, infraestrutura |
| [frontendbr/vagas](https://github.com/frontendbr/vagas) | Front-end e full stack |

O diferencial é que as vagas são **cruzadas com o desempenho do aluno no quiz**:
quem vai bem em Banco de Dados recebe vagas de Dados e Back-end, por exemplo.

## Onde acontece no código

| O quê | Onde |
|---|---|
| Chamada à API, conversão, filtro por área, cache e mensagens de erro | `src/funcionalidades/carreiras/vagas.ts` (`buscarVagas`) |
| Tela do aluno (áreas sugeridas, filtros, botão "Candidatar-se") | `src/funcionalidades/carreiras/Carreiras.tsx`, `ListaVagas.tsx` |
| Cadastro das áreas e da ligação disciplina → área (admin) | `src/funcionalidades/carreiras/AreasAdmin.tsx`, `areas.ts` |
| Tabelas, áreas sugeridas, registro de cliques e totais | `supabase/17_carreiras.sql` |
| Métricas no painel do admin | `src/funcionalidades/painel/Painel.tsx` (`PainelCarreiras`) |
| Testes (33 casos, com a API simulada, e 9 de localidade) | `testes/vagas.test.ts`, `testes/localidade.test.ts` |

## Endpoint consumido

```
GET https://api.github.com/repos/{repositorio}/issues?state=open&per_page=100
Accept: application/vnd.github+json
```

Sem autenticação, sem chave e sem custo. A chamada sai **do navegador do aluno**
(a API do GitHub libera CORS), então não há segredo para guardar no front-end.
Limite do GitHub para chamadas sem login: **60 por hora por endereço IP**. Cada
atualização usa 2 chamadas (uma por repositório), e o cache de 30 minutos mantém o
uso bem abaixo do limite.

### Exemplo de resposta (resumida: só os campos usados)

```json
[
  {
    "number": 12493,
    "title": "[Remoto] Desenvolvedor(a) Back-end Júnior - Python / AI Coding - MKdigital",
    "html_url": "https://github.com/backend-br/vagas/issues/12493",
    "created_at": "2026-11-07T14:02:11Z",
    "labels": [{ "name": "Júnior" }, { "name": "Python" }, { "name": "Remoto" }],
    "body": "... (descartado) ...",
    "user": { "login": "... (descartado) ..." }
  }
]
```

## O que o sistema faz com a resposta

1. **Descarta** pull requests, avisos fixados (etiqueta "⚠️ Avisos"), vagas marcadas
   como `Stale`, `link-quebrado` ou `triagem-recusada`, links que não são do
   `github.com` e vagas com mais de **90 dias**.
2. **Guarda só** número, título, etiquetas, data e link. O texto da vaga (`body`) e
   quem publicou (`user`) **nunca são lidos nem salvos**, porque podem ter e-mail e
   telefone de recrutadores (minimização, LGPD).
3. **Deduz** o nível (Estágio, Júnior, Pleno, Sênior, Especialista) e a modalidade
   (Remoto, Híbrido, Presencial) pelas etiquetas e, se não houver, pelo título.
4. **Filtra por área:** a vaga é de uma área quando uma palavra-chave da área aparece
   como termo inteiro no título ou nas etiquetas ("java" não casa com "javascript";
   "c#", ".net" e "node.js" funcionam). Sem acento e sem diferenciar maiúsculas.

## Localidade (foco nos alunos da UMC)

O público é de alunos da UMC, em Mogi das Cruzes (SP). Por isso, o filtro padrão mostra
só **vagas remotas e vagas no estado de SP** (`src/funcionalidades/carreiras/localidade.ts`):

- O local vem do texto entre colchetes no começo do título (`[Remoto]`, `[Híbrido em SP]`,
  `[Joinville/SC]`) e das etiquetas com nome de estado (o frontendbr usa "São Paulo").
- **Remota:** "remoto", "remote" ou "home office".
- **Estado de SP:** "SP", "São Paulo" ou uma cidade paulista conhecida. Vagas do **Alto Tietê**
  (Mogi das Cruzes, Suzano, Itaquaquecetuba, Poá, Arujá, Ferraz de Vasconcelos, Guararema,
  Biritiba Mirim, Salesópolis e Santa Isabel) ganham o selo **"Perto da UMC"** e aparecem primeiro.
- **Outra região:** sigla de outro estado entre colchetes (`/SC`, `- MG`), outra capital ou
  outro país. Siglas só valem entre colchetes: a etiqueta "Go" é a linguagem, não Goiás.
- Vaga que cita SP e outra cidade ("Belo Horizonte ou São Paulo") conta como SP. Vaga sem
  local informado (ex.: só `[Híbrido]`) fica fora do filtro padrão.
- Opções: "Remotas e no estado de SP" (padrão), "Só remotas", "Só no estado de SP" e "Todas as
  localidades". A tela informa quantas vagas ficaram de fora e tem o atalho "Ver todas".
- Em 12/11/2026, 29 das 38 vagas válidas entraram no filtro padrão.

## Ligação com o desempenho (regra do Carreiras)

- O admin cadastra as **áreas** (nome, descrição, palavras-chave) e marca quais
  **disciplinas** levam a cada área (`areas_carreira` e `disciplinas_areas`). O script
  17 já traz 8 áreas e liga as disciplinas da grade.
- A função `minhas_areas_carreira()` devolve as áreas das disciplinas em que o aluno
  tem **60% ou mais de acertos com pelo menos 5 respostas**, que é o contrário do
  Guru (abaixo de 60%), ordenadas pelo aproveitamento.
- A aba "Sugeridas para você" junta as vagas dessas áreas, e cada vaga mostra o
  motivo (ex.: "Dados: você acerta 80% em Banco de Dados"). Junto, aparecem os
  materiais aprovados das mesmas disciplinas ("área sugerida → vagas e materiais").
- Sem área sugerida, o aluno vê todas as vagas e o convite para fazer quizzes.

## Cache

| Situação | Comportamento |
|---|---|
| Cópia salva há menos de 30 min | Usa a cópia e não chama o GitHub |
| Botão "Atualizar" | Ignora a cópia e consulta o GitHub |
| Consulta concluída | Salva a lista nova no navegador (`localStorage`, chave `eduguru-vagas-v1`) |
| Cópia corrompida ou adulterada | Descartada; vagas com link fora do `github.com` são ignoradas |
| Navegador bloqueia o armazenamento (ex.: janela anônima) | Segue sem cache, sem erro |

O cache fica no navegador porque as vagas são públicas e iguais para todos: não há
dado pessoal nele e nada precisa passar pelo banco.

## Tratamento de erros (mensagem amigável)

| Situação | O aluno vê |
|---|---|
| Sem internet, tempo esgotado (10 s) ou resposta inválida | "Não foi possível buscar as vagas no GitHub agora. Confira sua conexão e tente de novo em alguns minutos." |
| Limite de consultas (HTTP 403/429) | "O GitHub limitou as consultas desta rede por um tempo. Tente de novo depois das HH:MM." (horário do cabeçalho `x-ratelimit-reset`) |
| GitHub fora do ar (HTTP 5xx) | "O GitHub está fora do ar no momento. Tente de novo em alguns minutos." |
| Qualquer falha, mas existe cópia antiga | A cópia antiga, com o aviso acima e "Mostrando as vagas salvas em DD/MM/AAAA HH:MM." |
| Só um dos repositórios falha | As vagas novas do outro, a cópia antiga do que falhou e um aviso dizendo qual falhou |

Nenhuma falha da API trava a tela: o resto da página (áreas sugeridas e materiais)
continua funcionando, e há o botão "Tentar de novo".

## Métrica: cliques em "Candidatar-se"

- O botão abre a vaga no GitHub em outra aba (`rel="noopener noreferrer"`) e chama
  `registrar_clique_vaga()` sem esperar a resposta.
- É gravado **um clique por aluno e vaga** (`unique (aluno_id, fonte, vaga_numero)`),
  então abrir a mesma vaga de novo não infla o total.
- O admin vê só os totais (`estatisticas_carreiras()`): cliques, cliques em 30 dias,
  alunos que abriram vagas, cliques por área e as 5 vagas mais abertas. Ninguém lê
  pela API os cliques de outra pessoa; o aluno vê os próprios em "Baixar meus dados".
- Retenção: 12 meses (pg_cron, `limpeza-cliques-vagas`) ou até a exclusão da conta.

## LGPD

- O EduGuru **não recebe currículo nem dados de candidatura**: a candidatura acontece
  no site de origem.
- A consulta ao GitHub não envia nome, e-mail, curso nem desempenho. O GitHub recebe
  apenas o endereço IP da conexão, como em qualquer acesso.
- As sugestões são uma **orientação simples** baseada nos acertos do quiz, e não uma
  avaliação profissional ou psicológica. Isso está escrito na tela e no Termo.
- Política de Privacidade e Termo de Aceite atualizados para a **versão 1.4**
  (seções 2, 3, 4, 5 e 6 da Política), com novo aceite de todos os usuários.

## Por que essa API

- Vagas de tecnologia brasileiras, que combinam com o público do EduGuru (SI, ADS e ES).
- Pública, gratuita, sem chave, com CORS liberado: funciona no GitHub Pages sem servidor.
- Resposta em JSON com etiquetas padronizadas (nível, modalidade, tecnologias), o que
  facilita o filtro.
- Alternativa avaliada: Adzuna (tem API para o Brasil, mas exige cadastro e uma chave
  que ficaria exposta no front-end, além de termos de uso mais restritos no plano
  gratuito).
