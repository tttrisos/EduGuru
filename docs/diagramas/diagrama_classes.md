# Diagrama de Classes (Figura 2) — versão da entrega 09/11

Este diagrama é **igual ao banco de dados** depois das atualizações 00 a 12. Cada classe
é uma tabela (ou função) que existe de verdade, então ele pode substituir a Figura 2.

**Como exportar em alta resolução (pedido do orientador, item 4):**
1. Abra https://mermaid.live
2. Cole o bloco de código abaixo (só o que está entre as linhas com três crases).
3. Menu **Actions → PNG** com escala 3x ou 4x (ou **SVG**, que nunca perde qualidade).
4. Os nomes das classes estão sem acento porque o Mermaid não aceita acento em
   identificadores. Os rótulos das associações e os textos estão acentuados.

```mermaid
classDiagram
    direction LR

    class Perfil {
        +uuid id
        +string nome
        +string papel (aluno ou admin)
        +string curso
        +string cidade
        +string estado
        +boolean consentimento_aceito
        +datetime consentimento_em
        +string versao_termos
        +boolean aparecer_no_ranking
        +datetime criado_em
        +excluirMinhaConta()
        +registrarAceite(versao)
    }

    class Disciplina {
        +int id
        +string nome
        +string curso
        +int total_aulas
    }

    class Pergunta {
        +int id
        +string enunciado
        +string nivel (Fácil, Médio ou Difícil)
        +string alternativa_a
        +string alternativa_b
        +string alternativa_c
        +string alternativa_d
        +criarPergunta()
    }

    class Gabarito {
        +char correta (A, B, C ou D)
    }

    class Material {
        +int id
        +string titulo
        +string link
        +string arquivo_path
        +string arquivo_nome
        +int arquivo_tamanho
    }

    class Quiz {
        <<tentativas_quiz>>
        +int id
        +datetime iniciada_em
        +datetime finalizada_em
        +int total_perguntas
        +int acertos
        +int pontos
        +iniciarQuiz(disciplina)
        +finalizarQuiz(respostas)
    }

    class RespostaQuiz {
        <<respostas_quiz>>
        +char resposta
        +boolean correta
        +int pontos
    }

    class Nota {
        +int id
        +decimal m1
        +decimal nd
        +decimal ni
        +decimal ms
        +decimal exame
        +int faltas
        +calcularM2()
        +calcularMD()
        +calcularSituacao()
    }

    class LogAuditoria {
        +int id
        +string usuario_email
        +string acao
        +string tabela
        +string registro_id
        +json detalhes
        +datetime criado_em
        +limparAntigos()
        +limparAutomatico()
    }

    class Ranking {
        <<serviço>>
        +listar(disciplina) posicao, nome, pontos
    }

    class Guru {
        <<serviço>>
        +recomendar() materiais
    }

    Perfil "1" -- "0..*" Quiz : joga
    Perfil "1" -- "0..*" Nota : registra
    Perfil "0..1" -- "0..*" Material : envia
    Perfil "0..1" -- "0..*" LogAuditoria : gera

    Disciplina "1" -- "0..*" Pergunta : contém
    Disciplina "0..1" -- "0..*" Material : classifica
    Disciplina "0..1" -- "0..*" Quiz : é tema de
    Disciplina "1" -- "0..*" Nota : refere-se a

    Pergunta "1" -- "0..1" Gabarito : tem

    %% Quiz–Pergunta é muitos-para-muitos; RespostaQuiz é a classe de associação
    Quiz "1" -- "1..10" RespostaQuiz : sorteia
    RespostaQuiz "0..*" -- "1" Pergunta : responde

    Ranking ..> Quiz : soma pontos
    Ranking ..> Disciplina : filtra por
    Guru ..> RespostaQuiz : calcula aproveitamento
    Guru ..> Material : indica
```

> **Na figura da monografia (ferramenta de UML, ex.: Astah/draw.io)**, desenhe
> Quiz `0..*` —— `1..10` Pergunta e ligue RespostaQuiz a essa linha com uma linha
> tracejada (classe de associação). O Mermaid não tem esse símbolo, por isso aqui
> aparece como duas associações, que significam a mesma coisa.

## O que mudou em relação à Figura 2 entregue (item 4 do feedback)

| Pedido do orientador | Como ficou |
|---|---|
| `Pergunta.disciplina` era texto, sem FK | Agora é `perguntas.disciplina_id` com chave estrangeira para `disciplinas` (atualização 11). A associação Disciplina–Pergunta existe no banco. |
| Associações "cadastra (admin)" não existem | **Removidas.** Nenhuma tabela guarda quem cadastrou disciplina/pergunta. A única autoria guardada é a do material (`enviado_por`), por isso ficou "Perfil envia Material". Quem cadastrou disciplinas e perguntas fica registrado no **log de auditoria**, não numa coluna. |
| Pergunta precisa de alternativas e gabarito | 4 alternativas na própria pergunta; o gabarito fica na classe **Gabarito** (tabela separada, só admin lê — atende também o "aluno não pode ler o gabarito"). |
| Guru deve se relacionar com Material | `Guru ..> Material : indica` |
| Material precisa de tag ou disciplina | `materiais.disciplina_id` (opcional) — `Disciplina classifica Material`. |
| Quiz–Pergunta é muitos-para-muitos | Quiz `0..*` — `1..10` Pergunta, com a classe de associação **RespostaQuiz** (resposta dada, se acertou, pontos). |
| Quiz e Ranking devem se associar a Disciplina | `Disciplina é tema de Quiz` e `Ranking filtra por Disciplina`. |
| Resultado e Diagnostico não existem como classes | **Removidas.** O resultado é a própria linha de Quiz (acertos, pontos) + RespostaQuiz; o "diagnóstico" é o cálculo do Guru. |
| Marcar classes novas como «Projetada» | Todas as classes acima **estão implementadas**, então nenhuma leva «Projetada». Ranking e Guru levam «serviço» porque são funções do banco (`ranking()` e `recomendacoes_guru()`), não tabelas. |
| Corrigir o "\n" e a acentuação | Neste diagrama não há "\n"; os rótulos estão acentuados. |

## Correspondência classe → banco

| Classe | Tabela / função | Script |
|---|---|---|
| Perfil | `perfis` (+ `auth.users` do Supabase) | setup, 3, 4, 11 |
| Disciplina | `disciplinas` | 00, 12 |
| Pergunta | `perguntas` | 00, 11 |
| Gabarito | `gabaritos` | 11 |
| Material | `materiais` | 00, 2, 4, 11 |
| Quiz | `tentativas_quiz` | 11 |
| RespostaQuiz | `respostas_quiz` | 11 |
| Nota | `notas` | 12 |
| LogAuditoria | `logs_auditoria` | setup, 4, 6, 10 |
| Ranking | função `ranking()` | 11 |
| Guru | funções `meu_desempenho()` e `recomendacoes_guru()` | 11 |
