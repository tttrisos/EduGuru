# Integração com API externa — ViaCEP

## O que é

O EduGuru consome a API pública do [ViaCEP](https://viacep.com.br/) para
consultar cidade e estado a partir de um CEP informado opcionalmente no
cadastro de conta.

## Onde acontece no código

- Arquivo: `src/pages/Login.tsx`
- Função: `aoSairDoCep()`
- Disparo: evento `onBlur` do campo "CEP (opcional)" no formulário de cadastro

## Endpoint consumido

```
GET https://viacep.com.br/ws/{cep}/json/
```

Sem autenticação, sem chave de API, sem custo. `{cep}` é o CEP digitado,
apenas dígitos (a máscara é removida antes da chamada).

### Exemplo de requisição

```
GET https://viacep.com.br/ws/01310100/json/
```

### Exemplo de resposta (sucesso)

```json
{
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP",
  "ibge": "3550308"
}
```

### Exemplo de resposta (CEP inexistente)

```json
{ "erro": true }
```

## O que o sistema faz com a resposta

Do JSON retornado, o EduGuru usa **apenas** `localidade` (cidade) e `uf`
(estado). Todos os outros campos (`logradouro`, `bairro`, `ibge`, etc.) são
descartados e nunca chegam a ser salvos.

O próprio CEP digitado também não é armazenado — só serve como parâmetro da
consulta. Essa decisão é de minimização de dados (ver Política de
Privacidade, seção 2): o projeto só guarda o que tem uso definido.

## Tratamento de erros

| Situação | Comportamento |
|---|---|
| Campo vazio | Nada acontece — o CEP é opcional |
| CEP com menos/mais de 8 dígitos | Mensagem de erro local, sem chamar a API |
| API retorna `{ erro: true }` | Mensagem "CEP não encontrado", cadastro segue sem cidade/estado |
| Falha de rede/timeout | Mensagem de erro, cadastro segue sem cidade/estado |

Em nenhum caso o CEP inválido ou a falha da API bloqueia o cadastro — o
campo é sempre opcional.

## Fluxo de dados

1. Front-end (`Login.tsx`) chama a ViaCEP diretamente do navegador do
   usuário — não passa pelo backend/Supabase.
2. Se a consulta retornar cidade/UF, esses dois valores ficam guardados
   em estado local do formulário (`cidade`, `estado`).
3. No envio do cadastro, cidade/estado (ou `null`, se não preenchidos) vão
   junto no `options.data` do `supabase.auth.signUp()` (ver
   `src/contexts/AuthContext.tsx`, função `cadastrar`).
4. Uma trigger no banco (`criar_perfil_novo_usuario`, em
   `supabase_atualizacao_3.sql`) lê esses valores do metadata do usuário e
   grava nas colunas `cidade`/`estado` da tabela `perfis`.

## Por que essa API

- Pública, gratuita, sem necessidade de chave/token (nada de segredo pra
  gerenciar ou vazar).
- Mantida por terceiros mas amplamente usada no mercado brasileiro.
- Endpoint simples (uma chamada `GET`, resposta em JSON).

## Uso do dado coletado

Cidade/estado alimentam a evolução futura do sistema de ranking (hoje só
"Global" e "de Amigos"), permitindo comparação regional entre alunos. Essa
finalidade está descrita na Política de Privacidade, seção 3.
