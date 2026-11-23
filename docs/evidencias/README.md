# Evidências dos testes

## 1. Testes do site (unitários e de tela)

- **Como rodar:** `npm run test:cobertura`
- **Quando roda sozinho:** a cada envio para a `main`, no GitHub Actions, antes da publicação.
  Se a cobertura do código todo ficar abaixo de 50%, a publicação é barrada (`thresholds` em `vite.config.ts`).
- **O que entra na conta:** todo o código do site (`src/**/*.ts` e `src/**/*.tsx`), inclusive as telas e os
  arquivos que nenhum teste importa.
- **Resultado guardado:** [`cobertura_testes.txt`](cobertura_testes.txt), com 190 testes e 82,6% das instruções e
  85,8% das linhas cobertas.

| Pasta | O que testa |
|---|---|
| `testes/2_acesso` … `testes/compartilhado` | Regras sem tela: senha, inatividade, nível da sessão, filtros, vagas, Bússola, evolução |
| `testes/telas` | As telas abertas de verdade (React Testing Library + jsdom), com um Supabase falso (`testes/telas/apoio/supabaseFalso.ts`): login, cadastro com CEP, código por e-mail, MFA, nova senha, quiz completo, materiais e moderação, Minha conta, Bússola, Carreiras e telas do administrador |

As telas de teste usam só dados inventados (`testes/telas/apoio/dados.ts`), como pede o guia de LGPD.

## 2. Testes das funções do banco

O site não tem como testar o que acontece dentro do banco (RLS, funções e gatilhos), então essas regras têm um
script próprio: [`supabase/testes/testes_funcoes_banco.sql`](../../supabase/testes/testes_funcoes_banco.sql).

O script:

1. cria quatro usuários de teste (dois alunos e dois administradores);
2. simula o login de cada um, do mesmo jeito que o Supabase faz;
3. confere 27 regras, como gabarito protegido, correção do quiz, filtro de materiais, Bússola, log, aceite,
   proteção da conta de administrador, limpeza de logs e sessão encerrada em outro aparelho;
4. **desfaz tudo no fim**: nada fica gravado no banco.

**Como rodar:** Supabase → SQL Editor → New query → colar o arquivo inteiro → Run.
O resultado é uma tabela com `teste`, `resultado` (PASSOU/FALHOU) e `detalhe`.

**Como guardar a evidência:**

- no resultado do SQL Editor, use **Export → CSV** e salve como `docs/evidencias/testes_banco_resultado.csv`;
- se preferir, salve também um print como `docs/evidencias/testes_banco_resultado.png`.

Depois é só commitar esses arquivos junto com esta pasta.
