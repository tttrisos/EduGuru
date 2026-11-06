# Roteiro do vídeo — entrega de 09/11

Vídeo para o orientador com o resumo de **todas as funcionalidades implementadas**.
Regras da orientação: **até 7 minutos** e **sem mostrar o login**. Funcionalidade que só
aparece na tela, sem funcionar de verdade, não conta, então tudo é mostrado com dados reais
gravados no banco.

---

## 1. Antes de gravar (preparação)

**Banco:** scripts 01 a 16 rodados no Supabase (conferido em 05/11: 16 disciplinas por curso,
120 perguntas, 36 com ilustração).

**Contas, já logadas e com o MFA feito:**
- **Aluno 1** (o principal do vídeo): numa janela normal do navegador.
- **Admin**: numa **janela anônima**. Assim dá para trocar de perfil sem passar pelo login.
- **Aluno 2**: só para ter um colega no ranking e um material de outra pessoa.

**Dados de exemplo (cadastrar antes, para as telas não aparecerem vazias):**
- [ ] Aluno 1 e Aluno 2 jogam algumas rodadas de quiz (em pelo menos 2 disciplinas), para
      o Painel e o Ranking terem números. Em uma delas, o Aluno 1 vai mal (menos de 60%,
      com 5 ou mais respostas) para o Guru aparecer no Painel.
- [ ] Aluno 1 registra notas e faltas em 2 ou 3 disciplinas (uma com muitas faltas, para
      mostrar o alerta).
- [ ] Aluno 2 compartilha um link do YouTube em Banco de Dados (fica público na hora).
- [ ] Aluno 1 anexa um PDF pequeno em uma disciplina (fica "Em análise" para o admin).
- [ ] Admin liga pelo menos um material a cada disciplina que vai aparecer no vídeo.

**Na hora:**
- Tela em 1920×1080, zoom do navegador em 100%, notificações desligadas.
- Começar no **modo escuro** (o padrão) e mostrar o claro só na cena 1.
- Ter as abas abertas na ordem das cenas, para não perder tempo navegando.

---

## 2. Cenas

| # | Tempo | Quem | O que mostrar | RFs |
|---|---|---|---|---|
| 1 | 0:00 – 0:40 | Aluno 1 | **Painel**: big numbers (pontos, posição, quizzes, % de acertos, média, disciplinas em alerta), os 2 gráficos e o quadro do Guru. Passar o mouse em **Minha conta** → trocar para modo claro e voltar | RF19, RF25, RNF10 |
| 2 | 0:40 – 2:00 | Aluno 1 | **Quiz**: filtro por curso e busca → escolher Banco de Dados → pergunta com ilustração (clicar para ampliar) → usar a **dica 50/50** → acertar uma (verde, pontos, explicação) e errar outra (vermelho, resposta certa) → ir até o fim → resultado com pontos, revisão das erradas e **materiais dos colegas** | RF16, RF17, RF19 |
| 3 | 2:00 – 2:30 | Aluno 1 | **Ranking** geral e por disciplina. Em **Meus dados e privacidade**, desmarcar "Mostrar meu nome no ranking" → voltar ao Ranking: aparece "Aluno anônimo" | RF18, RF21 |
| 4 | 2:30 – 3:20 | Aluno 1 | **Notas**: digitar nota 11 (erro), salvar notas válidas → prévia e situação calculadas. **Faltas**: +2/+4, −2/−4, alerta de faltas, **Zerar** e **Excluir** (janela de confirmação) | RF20, RNF04 |
| 5 | 3:20 – 4:10 | Aluno 1 | **Materiais**: link de site não permitido (recusado pelo filtro) → link do YouTube (publicado) → mostrar o PDF "Em análise" → **editar** um material. No fim do quiz, clicar no nome do colega → **perfil público** → **Denunciar** | RF08, RF28, RF29 |
| 6 | 4:10 – 5:40 | Admin | **Painel do admin** (números da turma). **Disciplinas**: filtro ADS com 16, **editar** uma e marcar os cursos. **Perguntas**: tentar salvar sem alternativa correta (erro) e **editar** uma. **Materiais → Moderação**: aprovar o PDF e recusar outro com motivo. **Usuários**: redefinir MFA. **Logs**: eventos recentes e limpeza manual | RF06, RF07, RF09, RF10, RF26, RF27 |
| 7 | 5:40 – 6:20 | Aluno 1 | **LGPD**: Termo e Política 1.3 no rodapé; **Meus dados e privacidade** → baixar meus dados (JSON). Clicar em **Sair** → janela de confirmação → Cancelar | RF11, RF12, RF15, RF21 |
| 8 | 6:20 – 7:00 | — | **Código** no VS Code: mapa do `README.md` (onde fica cada funcionalidade), pasta `supabase/` (scripts 01 a 16) e pasta `testes/` | — |

---

## 3. Sugestão de fala (curta, uma frase por cena)

1. "Este é o painel do aluno, com os indicadores e gráficos calculados no banco, e o Guru
   indicando material onde ele está com menos de 60% de acertos."
2. "O quiz mostra uma pergunta por vez; a correção é feita no banco, que só revela a resposta
   depois que a do aluno foi gravada."
3. "O ranking mostra só o nome abreviado, e o aluno pode se ocultar, como prevê a LGPD."
4. "As notas seguem o boletim da UMC; notas e faltas têm cálculos separados e validação."
5. "Os materiais são compartilhados pelos alunos e passam por filtro automático, moderação e
   denúncia."
6. "O administrador cadastra, edita e exclui disciplinas e perguntas, modera materiais e
   acompanha os logs de auditoria."
7. "O titular vê, baixa e exclui os próprios dados, e toda ação importante pede confirmação."
8. "O código está organizado por funcionalidade, com os scripts do banco numerados e os testes
   unitários em uma pasta própria."

---

## 4. Depois de gravar

- [ ] Conferir se o vídeo tem **até 7 minutos** e se **não aparece o login** nem senha/código.
- [ ] Conferir se não aparece e-mail de colega ou outro dado pessoal desnecessário.
- [ ] Enviar ao orientador junto com o link da branch `entrega0911` no GitHub.
