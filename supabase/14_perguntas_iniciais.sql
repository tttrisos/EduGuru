-- ============================================================
-- EduGuru — 14: banco inicial de perguntas (8 disciplinas × 15 = 120)
-- Rodar depois do 13 (disciplinas).
-- Em cada pergunta, a PRIMEIRA alternativa é a correta (a ordem é sorteada ao
-- gravar) e o último texto é a explicação mostrada depois da resposta.
-- Pergunta já cadastrada: só atualiza o enunciado (negrito) e a explicação.
-- ============================================================


-- Função temporária (só existe durante este script).
create or replace function pg_temp.q(
  p_disciplina text,
  p_curso text,
  p_nivel text,
  p_enunciado text,
  p_correta text,
  p_errada1 text,
  p_errada2 text,
  p_errada3 text,
  p_explicacao text
)
returns void
language plpgsql
as $$
declare
  v_disciplina_id bigint;
  v_pergunta_id bigint;
  v_alternativas text[];
  v_letra char(1);
begin
  -- Usa a disciplina existente ou cria.
  select id into v_disciplina_id
  from public.disciplinas
  where lower(nome) = lower(p_disciplina)
  limit 1;

  if v_disciplina_id is null then
    insert into public.disciplinas (nome, curso)
    values (p_disciplina, p_curso)
    returning id into v_disciplina_id;
  end if;

  -- Pergunta já cadastrada (com ou sem o negrito): só atualiza o texto e a explicação.
  select id into v_pergunta_id
  from public.perguntas
  where disciplina_id = v_disciplina_id
    and enunciado in (p_enunciado, replace(p_enunciado, '**', ''))
  limit 1;

  if v_pergunta_id is not null then
    update public.perguntas set enunciado = p_enunciado where id = v_pergunta_id;
    update public.gabaritos set explicacao = p_explicacao where pergunta_id = v_pergunta_id;
    return;
  end if;

  -- Sorteia a ordem das alternativas.
  select array_agg(alt order by random())
  into v_alternativas
  from unnest(array[p_correta, p_errada1, p_errada2, p_errada3]) as alt;

  v_letra := chr(64 + array_position(v_alternativas, p_correta));

  insert into public.perguntas
    (enunciado, disciplina_id, nivel, alternativa_a, alternativa_b, alternativa_c, alternativa_d)
  values
    (p_enunciado, v_disciplina_id, p_nivel,
     v_alternativas[1], v_alternativas[2], v_alternativas[3], v_alternativas[4])
  returning id into v_pergunta_id;

  insert into public.gabaritos (pergunta_id, correta, explicacao)
  values (v_pergunta_id, v_letra, p_explicacao);
end;
$$;


-- Lógica e Programação (ADS)
select pg_temp.q('Lógica e Programação', 'ADS', 'Fácil',
  'Qual estrutura **repete** um bloco de comandos enquanto uma condição for verdadeira?',
  'enquanto (while)', 'se (if)', 'escolha (switch)', 'retorne (return)',
  'O laço enquanto (while) testa a condição antes de cada repetição e para quando ela fica falsa. O se (if) decide uma única vez, sem repetir.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Fácil',
  'Qual o resultado de **7 mod 3** (resto da divisão inteira)?',
  '1', '2', '0', '2,33',
  '7 dividido por 3 dá 2 e sobra 1. O mod devolve justamente esse resto da divisão inteira.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Fácil',
  'Qual tipo de dado é o mais adequado para guardar a idade de uma pessoa em **anos completos**?',
  'Inteiro', 'Real', 'Caractere', 'Lógico',
  'Anos completos são números sem casas decimais, então o tipo inteiro é o adequado. O tipo real serve para valores como 1,75.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Fácil',
  'O que é um **algoritmo**?',
  'Uma sequência finita e ordenada de passos para resolver um problema', 'Uma linguagem de programação específica', 'Um componente de hardware do computador', 'Um tipo de banco de dados',
  'Um algoritmo é como uma receita: passos finitos, em ordem e sem ambiguidade. Ele não depende da linguagem em que será programado.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Fácil',
  'Qual operador lógico resulta verdadeiro **somente quando as duas condições são verdadeiras**?',
  'E', 'OU', 'NÃO', 'OU exclusivo',
  'No E, basta uma condição falsa para o resultado ser falso. No OU, basta uma verdadeira para o resultado ser verdadeiro.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Fácil',
  'Em um fluxograma, qual símbolo representa uma **decisão**?',
  'Losango', 'Retângulo', 'Elipse', 'Paralelogramo',
  'O losango representa um teste com saídas "sim" e "não". O retângulo indica processamento e a elipse marca o início e o fim.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Médio',
  'Quantas vezes o laço "para i de 1 até 10 **passo 2**" é executado?',
  '5', '10', '4', '6',
  'O i assume os valores 1, 3, 5, 7 e 9. O próximo seria 11, que passa de 10, então o laço executa 5 vezes.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Médio',
  'Depois de executar x ← 5; y ← x; x ← x + 3, qual é o **valor de y**?',
  '5', '8', '3', '0',
  'y recebe uma cópia do valor de x naquele momento, que era 5. Mudar x depois não altera y.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Médio',
  'Qual a diferença entre os laços "enquanto" e "**repita...até**"?',
  'O "repita" testa a condição no final, então executa o bloco pelo menos uma vez', 'Não há diferença entre eles', 'O "enquanto" sempre executa o bloco pelo menos uma vez', 'O "repita" só funciona com números inteiros',
  'O repita testa a condição depois de executar o bloco, então roda pelo menos uma vez. O enquanto testa antes e pode não rodar nenhuma vez.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Médio',
  'Em um vetor de 10 posições indexado **a partir de 0**, qual é o índice do último elemento?',
  '9', '10', '11', '1',
  'Com os índices começando em 0, as 10 posições vão de 0 a 9. O índice 10 acessaria uma posição que não existe.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Médio',
  'Seguindo a precedência dos operadores, qual o valor de **2 + 3 * 4**?',
  '14', '20', '24', '9',
  'A multiplicação vem antes da soma: 3 × 4 = 12 e depois 2 + 12 = 14. Para somar primeiro, seriam necessários parênteses: (2 + 3) * 4 = 20.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Difícil',
  'Em um laço que soma as notas de uma turma, qual é o papel da **variável acumuladora**?',
  'Guardar a soma parcial, sendo iniciada com zero antes do laço', 'Contar quantas vezes o laço executou', 'Guardar apenas o maior valor lido', 'Encerrar o laço quando a soma passar de 10',
  'O acumulador começa em zero e, a cada volta, faz soma ← soma + nota. Sem zerar antes do laço, a soma começaria com um valor errado.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Difícil',
  'O que uma **função recursiva** precisa ter obrigatoriamente?',
  'Um caso base que interrompa as chamadas', 'Um vetor como parâmetro', 'Um laço "enquanto" dentro dela', 'Variáveis globais',
  'Sem um caso base, a função chamaria a si mesma para sempre, até estourar a memória. O caso base é o ponto em que ela para de se chamar.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Difícil',
  'Qual é o resultado de **fatorial(4)**, calculado por recursão?',
  '24', '10', '16', '12',
  'fatorial(4) = 4 × 3 × 2 × 1 = 24. Cada chamada multiplica n pelo fatorial de n − 1, até chegar ao caso base.');
select pg_temp.q('Lógica e Programação', 'ADS', 'Difícil',
  'Para trocar os valores de a e b usando uma **variável auxiliar**, qual é a sequência correta?',
  'aux ← a; a ← b; b ← aux', 'a ← b; b ← a', 'aux ← a; b ← aux; a ← b', 'a ← aux; b ← a; aux ← b',
  'Primeiro se guarda a em aux; depois a recebe b; por fim b recebe o valor guardado em aux. Sem aux, o valor original de a se perderia.');


-- Estruturas Lineares (SI)
select pg_temp.q('Estruturas Lineares', 'SI', 'Fácil',
  'Qual estrutura segue a regra **LIFO** (o último a entrar é o primeiro a sair)?',
  'Pilha', 'Fila', 'Árvore', 'Grafo',
  'Na pilha, como numa pilha de pratos, só se mexe no topo: o último colocado é o primeiro a sair.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Fácil',
  'Qual estrutura segue a regra **FIFO** (o primeiro a entrar é o primeiro a sair)?',
  'Fila', 'Pilha', 'Árvore binária', 'Tabela hash',
  'Na fila, como numa fila de banco, quem chega primeiro é atendido primeiro.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Fácil',
  'Em uma **lista encadeada**, além do valor, o que cada nó guarda?',
  'A referência (ponteiro) para o próximo nó', 'O índice do vetor', 'O tamanho total da lista', 'Uma cópia do primeiro nó',
  'Cada nó aponta para o próximo, e é essa ligação que forma a lista. Por isso os nós não precisam ficar lado a lado na memória.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Fácil',
  'Como costuma se chamar a operação que **coloca um elemento no topo** de uma pilha?',
  'push', 'pop', 'enqueue', 'peek',
  'push empilha e pop desempilha. enqueue é a inserção em fila e peek apenas consulta o topo, sem retirar.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Fácil',
  'Em uma árvore, como se chama o nó que **não possui pai**?',
  'Raiz', 'Folha', 'Ramo', 'Irmão',
  'A raiz é o nó de onde a árvore começa. Já as folhas são os nós que não têm filhos.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Fácil',
  'Qual a principal vantagem de um **vetor** em relação a uma lista encadeada?',
  'Acessar qualquer posição diretamente pelo índice', 'Inserir no meio sem deslocar elementos', 'Crescer sem limite de memória', 'Não ocupar memória',
  'No vetor, a posição i é encontrada direto pelo índice, em tempo constante. Na lista encadeada é preciso percorrer nó por nó até chegar lá.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Médio',
  'Em uma árvore binária de busca, onde ficam os valores **menores que a raiz**?',
  'Na subárvore esquerda', 'Na subárvore direita', 'Sempre nas folhas', 'Em qualquer posição',
  'Na árvore binária de busca, os valores menores ficam à esquerda e os maiores à direita. É isso que permite buscar descartando metade da árvore a cada passo.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Médio',
  'Qual a complexidade da **busca binária** em um vetor ordenado de n elementos?',
  'O(log n)', 'O(n)', 'O(n²)', 'O(1)',
  'A cada comparação a busca binária descarta metade dos elementos. Com 1.000 elementos, bastam cerca de 10 comparações.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Médio',
  'Qual pré-requisito é **obrigatório** para usar a busca binária?',
  'O vetor estar ordenado', 'O vetor ter tamanho par', 'Os elementos serem todos diferentes', 'Os dados estarem em uma lista encadeada',
  'A busca binária compara com o elemento do meio para decidir para que lado seguir. Isso só funciona se os dados estiverem em ordem.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Médio',
  'O percurso **em ordem (in-order)** de uma árvore binária de busca visita os nós em que ordem?',
  'Em ordem crescente de valor', 'Em ordem decrescente de valor', 'Por níveis', 'Em ordem aleatória',
  'O percurso em ordem visita esquerda, raiz e direita. Numa árvore de busca, isso lista os valores do menor para o maior.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Médio',
  'Qual estrutura controla as **chamadas de funções** (inclusive recursivas) durante a execução de um programa?',
  'Pilha', 'Fila', 'Tabela hash', 'Grafo',
  'Cada chamada empilha os seus dados e, ao terminar, é desempilhada. Por isso uma recursão sem fim causa estouro de pilha (stack overflow).');
select pg_temp.q('Estruturas Lineares', 'SI', 'Difícil',
  'No pior caso, qual a complexidade da busca em uma árvore binária de busca **desbalanceada** com n nós?',
  'O(n)', 'O(log n)', 'O(1)', 'O(n log n)',
  'Se os valores entram já ordenados, a árvore vira uma linha reta e a busca precisa passar por todos os n nós.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Difícil',
  'Em uma tabela hash, o que é uma **colisão**?',
  'Quando duas chaves diferentes geram o mesmo índice', 'Quando a tabela fica vazia', 'Quando uma chave é removida', 'Quando a função hash devolve um número negativo',
  'A função hash pode mandar chaves diferentes para o mesmo índice. A tabela resolve isso guardando uma lista em cada posição ou procurando outra posição livre.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Difícil',
  'Qual algoritmo de ordenação usa a estratégia **dividir para conquistar** e tem complexidade O(n log n) em todos os casos?',
  'Merge sort', 'Bubble sort', 'Insertion sort', 'Selection sort',
  'O merge sort divide o vetor ao meio até sobrar um elemento e depois junta as partes já ordenadas. Isso garante O(n log n) em qualquer caso.');
select pg_temp.q('Estruturas Lineares', 'SI', 'Difícil',
  'Qual estrutura é a mais indicada para representar **ruas e cruzamentos** em um aplicativo de rotas?',
  'Grafo', 'Pilha', 'Fila', 'Vetor de caracteres',
  'Os cruzamentos viram vértices e as ruas viram arestas. Algoritmos de grafos, como o de Dijkstra, calculam o menor caminho entre dois pontos.');


-- Banco de Dados (SI)
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'Em um banco relacional, como se chama o campo que **identifica unicamente** cada linha de uma tabela?',
  'Chave primária', 'Chave estrangeira', 'Coluna calculada', 'View',
  'A chave primária não se repete nem fica vazia, então aponta para uma única linha. Exemplo: o id de cada aluno.');
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'Qual comando SQL é usado para **consultar** dados?',
  'SELECT', 'INSERT', 'UPDATE', 'DELETE',
  'SELECT apenas lê os dados. INSERT inclui, UPDATE altera e DELETE remove.');
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'Qual comando SQL apaga linhas de uma tabela, **mantendo a tabela**?',
  'DELETE', 'DROP', 'REMOVE', 'ALTER',
  'DELETE remove linhas e a tabela continua existindo. DROP apaga a tabela inteira, inclusive a estrutura.');
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'O que significa a sigla **SGBD**?',
  'Sistema Gerenciador de Banco de Dados', 'Sistema Geral de Backup de Dados', 'Servidor Gráfico de Bases Distribuídas', 'Software de Geração de Bancos Digitais',
  'O SGBD é o software que guarda, organiza e protege os dados. Exemplos: PostgreSQL, MySQL e Oracle.');
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'Qual cláusula **filtra as linhas** retornadas por um SELECT?',
  'WHERE', 'ORDER BY', 'GROUP BY', 'FROM',
  'WHERE define quais linhas entram no resultado. ORDER BY só ordena e GROUP BY agrupa.');
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'Para que serve uma **chave estrangeira**?',
  'Para relacionar uma tabela com a chave primária de outra tabela', 'Para criptografar a tabela', 'Para deixar todas as consultas mais rápidas', 'Para impedir valores nulos em todas as colunas',
  'A chave estrangeira guarda a chave primária de outra tabela e garante que o registro relacionado exista. Exemplo: cada nota aponta para uma disciplina.');
select pg_temp.q('Banco de Dados', 'SI', 'Médio',
  'Qual cláusula **ordena** o resultado de uma consulta?',
  'ORDER BY', 'GROUP BY', 'HAVING', 'SORT',
  'ORDER BY ordena de forma crescente por padrão. Com DESC, a ordem fica decrescente.');
select pg_temp.q('Banco de Dados', 'SI', 'Médio',
  'Qual função de agregação **conta quantas linhas** existem em um resultado?',
  'COUNT()', 'SUM()', 'AVG()', 'MAX()',
  'COUNT conta linhas. SUM soma, AVG calcula a média e MAX pega o maior valor de uma coluna.');
select pg_temp.q('Banco de Dados', 'SI', 'Médio',
  'Um aluno pode cursar várias disciplinas e cada disciplina tem vários alunos. Qual é a **cardinalidade** desse relacionamento?',
  'N:N (muitos para muitos)', '1:1 (um para um)', '1:N (um para muitos)', '0:1 (zero ou um)',
  'Quando os dois lados têm "vários", o relacionamento é N:N. No banco, ele vira uma terceira tabela que liga as duas.');
select pg_temp.q('Banco de Dados', 'SI', 'Médio',
  'Qual JOIN retorna **todas as linhas da tabela da esquerda**, mesmo as que não têm correspondência na tabela da direita?',
  'LEFT JOIN', 'INNER JOIN', 'RIGHT JOIN', 'CROSS JOIN',
  'O LEFT JOIN mantém tudo da tabela da esquerda e preenche com nulo o que não tiver par na direita. O INNER JOIN traria só as linhas com par.');
select pg_temp.q('Banco de Dados', 'SI', 'Médio',
  'Qual a diferença entre **WHERE e HAVING**?',
  'WHERE filtra as linhas antes do agrupamento; HAVING filtra os grupos depois do GROUP BY', 'Não há diferença entre eles', 'HAVING só funciona com textos', 'WHERE só funciona com números',
  'O HAVING existe para filtrar resultados de agregação, como COUNT(*) > 5, que ainda não existem quando o WHERE é aplicado.');
select pg_temp.q('Banco de Dados', 'SI', 'Difícil',
  'Quando uma tabela está na **Primeira Forma Normal (1FN)**?',
  'Quando todos os atributos são atômicos, sem grupos repetidos ou campos multivalorados', 'Quando não tem chave primária', 'Quando não tem chave estrangeira', 'Quando tem no máximo três colunas',
  'Na 1FN cada campo guarda um único valor. Uma coluna "telefones" com vários números separados por vírgula viola a 1FN.');
select pg_temp.q('Banco de Dados', 'SI', 'Difícil',
  'Qual propriedade ACID garante que uma transação acontece **por inteiro ou não acontece**?',
  'Atomicidade', 'Consistência', 'Isolamento', 'Durabilidade',
  'Atomicidade é o "tudo ou nada": se um passo da transação falha, tudo é desfeito. Numa transferência, não pode sair o débito sem entrar o crédito.');
select pg_temp.q('Banco de Dados', 'SI', 'Difícil',
  'No PostgreSQL (usado pelo Supabase), qual recurso **restringe quais linhas** cada usuário pode ler ou alterar?',
  'Row Level Security (RLS)', 'Trigger', 'Sequence', 'Vacuum',
  'O RLS (Row Level Security) aplica regras linha a linha. O EduGuru usa esse recurso para que cada aluno leia só as próprias notas.');
select pg_temp.q('Banco de Dados', 'SI', 'Difícil',
  'Para que serve criar um **índice** em uma coluna?',
  'Para acelerar buscas e filtros nessa coluna, com um custo extra nas gravações', 'Para garantir que a coluna nunca fique vazia', 'Para criptografar os dados da coluna', 'Para fazer backup automático da coluna',
  'O índice funciona como o índice de um livro: encontra os dados sem ler a tabela inteira. Em troca, cada gravação também precisa atualizá-lo.');


-- Engenharia de Software (ES)
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  '"O sistema deve **permitir o cadastro de alunos**" é um exemplo de requisito de que tipo?',
  'Funcional', 'Não funcional', 'De hardware', 'De marketing',
  'Requisitos funcionais descrevem o que o sistema faz, ou seja, as suas funções. Cadastrar alunos é uma delas.');
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  '"O sistema deve **responder em até 2 segundos**" é um exemplo de requisito de que tipo?',
  'Não funcional', 'Funcional', 'De negócio', 'De usuário final',
  'Requisitos não funcionais descrevem como o sistema deve ser: rápido, seguro, disponível. Tempo de resposta é um requisito de desempenho.');
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  'No Scrum, como se chama o **período fixo de trabalho** em que a equipe entrega um incremento do produto?',
  'Sprint', 'Backlog', 'Daily', 'Epic',
  'A sprint dura de 1 a 4 semanas e termina com uma parte do produto pronta. O backlog é a lista do que ainda será feito.');
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  'Qual diagrama da UML mostra as **classes**, seus atributos, métodos e relacionamentos?',
  'Diagrama de classes', 'Diagrama de casos de uso', 'Diagrama de sequência', 'Diagrama de atividades',
  'O diagrama de classes mostra a estrutura do sistema. Já o diagrama de sequência mostra a troca de mensagens ao longo do tempo.');
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  'No Scrum, quem é responsável por **priorizar o Product Backlog**?',
  'Product Owner', 'Scrum Master', 'Equipe de desenvolvimento', 'Cliente final, sozinho',
  'O Product Owner representa o negócio e decide a ordem do que será feito. O Scrum Master cuida para que o processo funcione.');
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  'O **Git** é uma ferramenta de quê?',
  'Controle de versão', 'Modelagem de banco de dados', 'Teste de carga', 'Design de interfaces',
  'O Git guarda o histórico de cada mudança no código e permite que várias pessoas trabalhem juntas, cada uma na sua branch.');
select pg_temp.q('Engenharia de Software', 'ES', 'Médio',
  'Qual modelo de processo executa as fases (requisitos, projeto, implementação e testes) **em sequência**, uma após a outra?',
  'Cascata', 'Scrum', 'Kanban', 'Espiral',
  'No modelo cascata, cada fase só começa quando a anterior termina. Por isso, mudanças tardias custam caro, ao contrário dos métodos ágeis.');
select pg_temp.q('Engenharia de Software', 'ES', 'Médio',
  'Qual diagrama da UML representa os **atores** e as funcionalidades que eles usam no sistema?',
  'Diagrama de casos de uso', 'Diagrama de classes', 'Diagrama de implantação', 'Diagrama de estados',
  'O diagrama de casos de uso mostra quem usa o sistema (os atores) e para quê. É uma visão do usuário, não do código.');
select pg_temp.q('Engenharia de Software', 'ES', 'Médio',
  'Um teste que verifica uma **função isolada**, como o cálculo da média, é um teste de quê?',
  'De unidade', 'De aceitação', 'De carga', 'De usabilidade',
  'O teste de unidade verifica a menor parte do código, sem tela nem banco. O EduGuru testa assim o cálculo das notas.');
select pg_temp.q('Engenharia de Software', 'ES', 'Médio',
  'No Kanban, para que serve o **limite de WIP** (Work In Progress)?',
  'Para limitar quantas tarefas ficam em andamento ao mesmo tempo em cada etapa', 'Para aumentar o número de tarefas simultâneas', 'Para definir o prazo final do projeto', 'Para escolher o Product Owner',
  'Limitar o trabalho em andamento evita começar muita coisa e terminar pouca. Ao bater o limite, a equipe termina uma tarefa antes de puxar outra.');
select pg_temp.q('Engenharia de Software', 'ES', 'Médio',
  'O que é **refatoração**?',
  'Melhorar a estrutura interna do código sem mudar o comportamento externo', 'Reescrever o sistema inteiro em outra linguagem', 'Adicionar novas funcionalidades', 'Corrigir apenas erros de digitação na interface',
  'Refatorar é deixar o código mais claro e fácil de manter sem mudar o que ele faz. Os testes ajudam a garantir que nada quebrou.');
select pg_temp.q('Engenharia de Software', 'ES', 'Difícil',
  'O que significa ter **50% de cobertura de testes**?',
  'Os testes executam cerca de metade das linhas (ou ramos) do código', 'Metade dos testes passou', 'Metade dos requisitos foi implementada', 'O sistema tem 50% de chance de falhar',
  'A cobertura mede quanto do código os testes executam. Ela não diz quantos testes passaram nem quantos requisitos existem.');
select pg_temp.q('Engenharia de Software', 'ES', 'Difícil',
  'No BPMN, qual elemento representa um **ponto de decisão** em que o fluxo segue por um caminho ou por outro?',
  'Gateway exclusivo', 'Evento de início', 'Tarefa', 'Raia (lane)',
  'No BPMN, o gateway exclusivo (losango com um X) escolhe um único caminho de acordo com uma condição.');
select pg_temp.q('Engenharia de Software', 'ES', 'Difícil',
  'Qual princípio do SOLID diz que uma classe deve ter **apenas um motivo para mudar**?',
  'Responsabilidade única', 'Aberto/fechado', 'Substituição de Liskov', 'Inversão de dependência',
  'Responsabilidade única: cada classe cuida de uma coisa só. Assim as mudanças ficam localizadas e o código fica mais fácil de testar.');
select pg_temp.q('Engenharia de Software', 'ES', 'Difícil',
  'Em um diagrama de classes, o que indica a **composição (losango preenchido)**?',
  'Que a parte não existe sem o todo: se o todo for excluído, as partes também são', 'Que as classes não têm relação', 'Que uma classe herda da outra', 'Que as classes estão em pacotes diferentes',
  'Na composição, a parte depende do todo para existir, como os cômodos de uma casa. Na agregação (losango vazio), a parte existe sozinha.');


-- Programação para Internet (SI)
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Qual linguagem define a **estrutura e o conteúdo** de uma página web?',
  'HTML', 'CSS', 'SQL', 'Python',
  'O HTML marca o que é título, parágrafo, link e imagem. A aparência fica com o CSS e o comportamento com o JavaScript.');
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Qual linguagem é usada para definir **cores, fontes e o layout** de uma página?',
  'CSS', 'HTML', 'JavaScript', 'PHP',
  'O CSS cuida da aparência. Separar o estilo do conteúdo (HTML) permite mudar o visual sem mexer na estrutura.');
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Qual tag HTML cria um **link para outra página**?',
  '<a>', '<link>', '<href>', '<p>',
  'A tag <a> usa o atributo href com o endereço de destino. Já a tag <link> serve para ligar arquivos, como o CSS.');
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Qual protocolo transfere páginas web de forma **criptografada**?',
  'HTTPS', 'HTTP', 'FTP', 'SMTP',
  'HTTPS é o HTTP com criptografia (TLS). Os dados trafegam protegidos, e o navegador mostra o cadeado.');
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Qual tag HTML é usada para **inserir uma imagem**?',
  '<img>', '<image>', '<pic>', '<src>',
  'A tag <img> usa o atributo src com o endereço da imagem e alt com uma descrição, importante para a acessibilidade.');
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Em CSS, qual propriedade muda a **cor do texto**?',
  'color', 'background-color', 'font-color', 'text-style',
  'color muda a cor do texto e background-color muda a cor de fundo. A propriedade font-color não existe no CSS.');
select pg_temp.q('Programação para Internet', 'SI', 'Médio',
  'Qual método HTTP é normalmente usado para **enviar ao servidor** os dados de um formulário de cadastro?',
  'POST', 'GET', 'HEAD', 'OPTIONS',
  'O POST envia os dados no corpo da requisição, o adequado para cadastros. O GET manda os dados no endereço e serve para consultas.');
select pg_temp.q('Programação para Internet', 'SI', 'Médio',
  'O que indica o código de status HTTP **404**?',
  'O recurso solicitado não foi encontrado', 'O servidor está sobrecarregado', 'O acesso foi autorizado', 'A requisição foi bem-sucedida',
  'Códigos 4xx indicam erro em quem fez o pedido, e 404 é recurso inexistente. 200 é sucesso e 5xx são erros do servidor.');
select pg_temp.q('Programação para Internet', 'SI', 'Médio',
  'Em JavaScript, qual palavra declara uma variável que **não pode ser reatribuída**?',
  'const', 'var', 'let', 'static',
  'const impede reatribuir a variável e let permite. var é a forma antiga, com regras de escopo confusas.');
select pg_temp.q('Programação para Internet', 'SI', 'Médio',
  'No CSS Flexbox, qual propriedade alinha os itens ao longo do **eixo principal**?',
  'justify-content', 'align-items', 'flex-wrap', 'order',
  'No Flexbox, justify-content alinha no eixo principal (a linha, por padrão) e align-items alinha no eixo cruzado.');
select pg_temp.q('Programação para Internet', 'SI', 'Médio',
  'O que é o **DOM**?',
  'A representação em árvore dos elementos da página, que o JavaScript pode ler e alterar', 'Um banco de dados do navegador', 'Um servidor web', 'Um formato de imagem',
  'O navegador transforma o HTML em uma árvore de objetos, o DOM. Quando o JavaScript altera essa árvore, a página muda na tela.');
select pg_temp.q('Programação para Internet', 'SI', 'Difícil',
  'Qual a diferença entre **== e ===** em JavaScript?',
  '=== compara valor e tipo; == converte os tipos antes de comparar', 'Não há diferença entre eles', '== compara apenas textos', '=== só funciona com números',
  'Com ==, ''5'' == 5 é verdadeiro, porque o texto é convertido em número. Com ===, é falso, pois os tipos são diferentes. Prefira ===.');
select pg_temp.q('Programação para Internet', 'SI', 'Difícil',
  'O que faz a função **fetch()** em JavaScript?',
  'Faz uma requisição HTTP e devolve uma Promise com a resposta', 'Recarrega a página', 'Salva dados no disco do usuário', 'Cria um elemento HTML',
  'O fetch busca dados de uma URL sem recarregar a página e devolve uma Promise. É assim que sites modernos conversam com APIs.');
select pg_temp.q('Programação para Internet', 'SI', 'Difícil',
  'Em CSS, qual destes seletores tem a **maior especificidade**?',
  'Seletor de id (#topo)', 'Seletor de classe (.aviso)', 'Seletor de tipo (p)', 'Seletor universal (*)',
  'A ordem é id > classe > tipo > universal. Quando duas regras entram em conflito, vale a mais específica.');
select pg_temp.q('Programação para Internet', 'SI', 'Difícil',
  'Para que servem as **media queries** em CSS?',
  'Para aplicar estilos diferentes conforme o tamanho da tela, deixando o site responsivo', 'Para tocar vídeos na página', 'Para conectar a página ao banco de dados', 'Para comprimir as imagens',
  'Uma media query aplica o CSS só em certas condições, como telas menores que 600 px. É a base do design responsivo.');


-- Aplicativos Web (SI)
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'No React, qual hook guarda um valor que, quando muda, faz o componente ser **desenhado de novo**?',
  'useState', 'useEffect', 'useRef', 'useMemo',
  'Ao chamar a função set do useState, o React desenha o componente de novo com o novo valor. O useRef guarda um valor sem redesenhar.');
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'O que é uma **SPA (Single Page Application)**?',
  'Um aplicativo com uma única página HTML que troca o conteúdo pelo JavaScript, sem recarregar tudo', 'Um aplicativo que só pode ter uma tela', 'Um site que não usa JavaScript', 'Um sistema que roda apenas no servidor',
  'Na SPA o navegador carrega a página uma vez e o JavaScript troca as telas. O EduGuru é uma SPA feita com React.');
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'Qual formato de texto é o mais usado para **trocar dados entre front-end e back-end** em APIs web?',
  'JSON', 'DOCX', 'MP3', 'BMP',
  'JSON é um texto leve com chaves e valores, fácil de ler para pessoas e para programas. É o padrão das APIs web.');
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'No React, como os dados são passados de um **componente pai para um componente filho**?',
  'Por props', 'Por CSS', 'Pelo banco de dados', 'Por cookies',
  'Props funcionam como parâmetros de um componente. O filho recebe e usa as props, mas não as altera.');
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'Qual comando instala as dependências listadas no **package.json**?',
  'npm install', 'npm start', 'npm run build', 'npm publish',
  'npm install baixa as dependências listadas no package.json para a pasta node_modules. Já npm start executa o projeto.');
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'O que o **TypeScript** acrescenta ao JavaScript, principalmente?',
  'Tipagem estática, que aponta erros antes de executar', 'Um banco de dados embutido', 'Estilos visuais prontos', 'Um servidor web',
  'O TypeScript avisa, ainda no editor, quando um valor é usado com o tipo errado. No final, ele é convertido em JavaScript comum.');
select pg_temp.q('Aplicativos Web', 'SI', 'Médio',
  'Para que serve o **useEffect** no React?',
  'Para executar efeitos colaterais, como buscar dados de uma API depois que o componente aparece', 'Para estilizar o componente', 'Para criar as rotas do site', 'Para declarar tipos',
  'O useEffect roda código depois que o componente aparece ou quando um valor muda. É o lugar certo para buscar dados de uma API.');
select pg_temp.q('Aplicativos Web', 'SI', 'Médio',
  'O que é uma **API REST**?',
  'Uma interface que expõe recursos por URLs e usa os métodos HTTP (GET, POST, PUT, DELETE)', 'Um banco de dados', 'Uma biblioteca de componentes visuais', 'Um editor de código',
  'Na API REST, cada recurso tem uma URL, como /alunos/5, e o método diz a ação: GET lê, POST cria, PUT altera e DELETE remove.');
select pg_temp.q('Aplicativos Web', 'SI', 'Médio',
  'Por que cada item de uma lista desenhada com map() no React precisa de uma **key**?',
  'Para o React identificar qual item mudou, entrou ou saiu e atualizar a tela corretamente', 'Para o CSS funcionar', 'Para ordenar a lista em ordem alfabética', 'Para salvar a lista no banco',
  'Com a key, o React sabe qual item é qual entre um desenho e outro. Sem ela, ele pode atualizar o item errado ou perder o estado.');
select pg_temp.q('Aplicativos Web', 'SI', 'Médio',
  'No Supabase, qual a diferença entre a chave anon (pública) e a chave **service_role**?',
  'A anon pode ficar no front-end porque respeita a RLS; a service_role ignora a RLS e nunca deve ir para o navegador', 'Nenhuma: as duas podem ser usadas no front-end', 'Só a service_role funciona com login', 'A anon só funciona em modo de teste',
  'A chave anon é pública e só faz o que as regras de RLS permitem. A service_role passa por cima de todas as regras, então só pode ficar no servidor.');
select pg_temp.q('Aplicativos Web', 'SI', 'Médio',
  'O que é **CORS**?',
  'Uma regra do navegador que controla se uma página pode fazer requisições para outro domínio', 'Um framework de CSS', 'Um tipo de banco de dados', 'Um formato de imagem',
  'O CORS impede que um site qualquer use a sessão do usuário para chamar outra API sem permissão. É o servidor que diz quais origens aceita.');
select pg_temp.q('Aplicativos Web', 'SI', 'Difícil',
  'Por que a correção de um quiz deve ser feita **no servidor (banco)**, e não no navegador?',
  'Porque o código do navegador pode ser alterado pelo usuário; no servidor, ele não vê o gabarito nem inventa pontos', 'Porque o banco deixa a tela mais bonita', 'Porque o React não sabe comparar textos', 'Porque o navegador não tem memória suficiente',
  'Tudo o que roda no navegador pode ser visto e alterado pelo usuário. Por isso o EduGuru guarda o gabarito e calcula os pontos no banco.');
select pg_temp.q('Aplicativos Web', 'SI', 'Difícil',
  'No login com verificação em duas etapas (TOTP), o que indica o nível de garantia **aal2**?',
  'Que o usuário confirmou a senha e também o código do aplicativo autenticador', 'Que o usuário só digitou a senha', 'Que o usuário é administrador', 'Que a conta está bloqueada',
  'aal1 significa que a pessoa só digitou a senha; aal2, senha mais o segundo fator. No EduGuru, o banco só libera os dados em sessões aal2.');
select pg_temp.q('Aplicativos Web', 'SI', 'Difícil',
  'Qual a vantagem do **HashRouter** em um site publicado no GitHub Pages?',
  'As rotas ficam depois do #, então o servidor sempre entrega o index.html e não dá erro 404 ao recarregar', 'Deixa as páginas mais rápidas', 'Criptografa as rotas', 'Dispensa o uso de JavaScript',
  'O GitHub Pages só conhece arquivos que existem de verdade. Com o #, a rota fica depois do # e o servidor sempre entrega o index.html.');
select pg_temp.q('Aplicativos Web', 'SI', 'Difícil',
  'No React, o que acontece ao **alterar o estado diretamente** (ex.: lista.push(item)) em vez de usar a função set do useState?',
  'O React pode não perceber a mudança, e a tela não é atualizada', 'A tela é atualizada normalmente', 'O navegador fecha a aba', 'O valor é salvo automaticamente no banco',
  'O React compara referências: depois do push, a lista continua sendo o mesmo objeto. O certo é criar uma lista nova, como setLista([...lista, item]).');


-- Redes e Segurança (SI)
select pg_temp.q('Redes e Segurança', 'SI', 'Fácil',
  'Qual equipamento **interliga redes diferentes** e encaminha pacotes entre elas, como a rede de casa e a internet?',
  'Roteador', 'Hub', 'Repetidor', 'Patch panel',
  'O roteador decide por onde cada pacote segue entre redes diferentes. O hub apenas repete o sinal para todos, sem decidir nada.');
select pg_temp.q('Redes e Segurança', 'SI', 'Fácil',
  'O que faz o **DNS**?',
  'Traduz nomes de domínio (como umc.br) em endereços IP', 'Criptografa senhas', 'Envia e-mails', 'Bloqueia vírus',
  'Os computadores se comunicam por IP, mas as pessoas lembram nomes. O DNS faz essa tradução, como uma agenda de contatos.');
select pg_temp.q('Redes e Segurança', 'SI', 'Fácil',
  'Quantas camadas tem o **modelo de referência OSI**?',
  '7', '4', '5', '9',
  'As 7 camadas são física, enlace, rede, transporte, sessão, apresentação e aplicação. O modelo TCP/IP, usado na prática, tem 4.');
select pg_temp.q('Redes e Segurança', 'SI', 'Fácil',
  'Qual protocolo entrega **automaticamente** um endereço IP aos dispositivos da rede?',
  'DHCP', 'FTP', 'SMTP', 'SSH',
  'Sem DHCP, cada aparelho precisaria ter o IP configurado à mão. Em casa, normalmente o roteador faz esse papel.');
select pg_temp.q('Redes e Segurança', 'SI', 'Fácil',
  'Um endereço **IPv4** é formado por quantos bits?',
  '32', '16', '64', '128',
  'O IPv4 tem 32 bits, escritos como 4 números de 0 a 255 (ex.: 192.168.0.1). Isso dá cerca de 4,3 bilhões de endereços.');
select pg_temp.q('Redes e Segurança', 'SI', 'Fácil',
  'Qual sigla designa uma **rede local**, como a de um laboratório da universidade?',
  'LAN', 'WAN', 'MAN', 'VPN',
  'LAN é a rede de um local, como uma sala ou um prédio. A MAN cobre uma cidade e a WAN, grandes distâncias.');
select pg_temp.q('Redes e Segurança', 'SI', 'Médio',
  'Qual a principal diferença entre **TCP e UDP**?',
  'O TCP garante a entrega e a ordem dos dados; o UDP não garante, mas é mais leve', 'O UDP é sempre mais seguro', 'O TCP não usa portas', 'Não há diferença entre eles',
  'O TCP confirma o recebimento e reenvia o que se perdeu, por isso é usado na web. O UDP não confirma e é usado em chamadas de vídeo e jogos.');
select pg_temp.q('Redes e Segurança', 'SI', 'Médio',
  'Qual é a porta padrão do protocolo **HTTPS**?',
  '443', '80', '21', '25',
  'O HTTPS usa a porta 443 e o HTTP, a 80. O FTP usa a 21 e o SMTP, a 25.');
select pg_temp.q('Redes e Segurança', 'SI', 'Médio',
  'Em qual camada do modelo OSI atua o **roteador**?',
  'Rede', 'Física', 'Enlace', 'Aplicação',
  'O roteador trabalha com endereços IP, que pertencem à camada de rede (3). O switch trabalha com endereços MAC, na camada de enlace (2).');
select pg_temp.q('Redes e Segurança', 'SI', 'Médio',
  'Quantos endereços de hosts utilizáveis a máscara **255.255.255.0 (/24)** permite?',
  '254', '256', '255', '128',
  'Sobram 8 bits para os hosts: 2⁸ = 256 endereços. Tirando o endereço da rede e o de broadcast, ficam 254.');
select pg_temp.q('Redes e Segurança', 'SI', 'Médio',
  'Com base em qual informação o **switch** encaminha os quadros?',
  'Endereço MAC', 'Nome de domínio', 'Endereço de e-mail', 'Número da porta TCP',
  'O switch aprende em qual porta está cada endereço MAC e envia o quadro só para o destino, sem espalhar para todos.');
select pg_temp.q('Redes e Segurança', 'SI', 'Difícil',
  'O que faz o **NAT** em um roteador doméstico?',
  'Permite que vários dispositivos com IP privado compartilhem um único IP público', 'Aumenta a velocidade do Wi-Fi', 'Criptografa todo o tráfego', 'Bloqueia sites',
  'Dentro de casa os aparelhos usam IPs privados, como 192.168.x.x. O NAT troca esses endereços pelo IP público na saída para a internet.');
select pg_temp.q('Redes e Segurança', 'SI', 'Difícil',
  'Qual é o **endereço de broadcast** da rede 192.168.10.0/24?',
  '192.168.10.255', '192.168.10.0', '192.168.10.1', '192.168.255.255',
  'Na rede /24, os 8 últimos bits são dos hosts. Com todos eles em 1, o último número vira 255.');
select pg_temp.q('Redes e Segurança', 'SI', 'Difícil',
  'Quais são, em ordem, as três etapas do estabelecimento de conexão TCP (**three-way handshake**)?',
  'SYN, SYN-ACK, ACK', 'ACK, SYN, FIN', 'SYN, ACK, FIN', 'FIN, ACK, SYN',
  'O cliente pede (SYN), o servidor aceita e pede de volta (SYN-ACK) e o cliente confirma (ACK). Só então os dados começam a ser enviados.');
select pg_temp.q('Redes e Segurança', 'SI', 'Difícil',
  'Por que o **IPv6** foi criado?',
  'Porque os endereços IPv4 (cerca de 4,3 bilhões) estão se esgotando; o IPv6 usa 128 bits', 'Para substituir o DNS', 'Para acabar com os roteadores', 'Para deixar a internet sem fio',
  'Com 128 bits, o IPv6 tem endereços de sobra para todos os aparelhos do mundo.');


-- Segurança da Informação (ES)
select pg_temp.q('Segurança da Informação', 'ES', 'Fácil',
  'Quais são os três pilares da segurança da informação (**tríade CID**)?',
  'Confidencialidade, Integridade e Disponibilidade', 'Custo, Infraestrutura e Acesso', 'Criptografia, Internet e Antivírus', 'Controle, Inspeção e Auditoria',
  'Confidencialidade é só quem pode ver; integridade é não ser alterado indevidamente; disponibilidade é estar acessível quando preciso.');
select pg_temp.q('Segurança da Informação', 'ES', 'Fácil',
  'O que é **phishing**?',
  'Uma tentativa de enganar a pessoa, por e-mail ou mensagem falsa, para roubar senhas ou dados', 'Um tipo de backup', 'Um protocolo de rede', 'Um antivírus',
  'O phishing imita bancos, lojas e até a faculdade. Desconfie de mensagens com urgência e confira o endereço do site antes de digitar a senha.');
select pg_temp.q('Segurança da Informação', 'ES', 'Fácil',
  'Qual destas senhas é a **mais forte**?',
  'Gx7!pR2#vLq9', '123456', 'senha2026', 'abcdef',
  'Uma senha forte é longa, mistura maiúsculas, minúsculas, números e símbolos e não usa palavras óbvias.');
select pg_temp.q('Segurança da Informação', 'ES', 'Fácil',
  'O que exige a autenticação em **dois fatores (MFA)**?',
  'Duas formas diferentes de comprovar a identidade, como a senha e um código do celular', 'Duas senhas iguais', 'Dois e-mails diferentes', 'Dois computadores',
  'Mesmo que roubem a senha, o invasor não tem o segundo fator. O EduGuru exige o código de um aplicativo autenticador.');
select pg_temp.q('Segurança da Informação', 'ES', 'Fácil',
  'Do que trata a **LGPD** (Lei nº 13.709/2018)?',
  'Da proteção de dados pessoais', 'Dos direitos autorais de software', 'Dos impostos sobre tecnologia', 'Das telecomunicações',
  'A LGPD define como dados pessoais podem ser coletados e usados e garante direitos ao titular, como acessar e excluir os próprios dados.');
select pg_temp.q('Segurança da Informação', 'ES', 'Fácil',
  'Para que serve um **backup**?',
  'Para ter uma cópia dos dados e recuperá-los em caso de perda', 'Para acelerar o computador', 'Para remover vírus', 'Para aumentar a memória RAM',
  'Backup é uma cópia guardada em outro lugar. Ele protege contra exclusão acidental, defeitos e ataques como o ransomware.');
select pg_temp.q('Segurança da Informação', 'ES', 'Médio',
  'Qual a diferença entre criptografia **simétrica e assimétrica**?',
  'A simétrica usa a mesma chave para cifrar e decifrar; a assimétrica usa um par de chaves (pública e privada)', 'A assimétrica não usa chaves', 'A simétrica é sempre mais lenta', 'Não há diferença entre elas',
  'Na assimétrica, o que a chave pública cifra só a chave privada abre. Isso permite trocar segredos sem combinar uma chave antes.');
select pg_temp.q('Segurança da Informação', 'ES', 'Médio',
  'Por que as senhas devem ser guardadas com **hash** (ex.: bcrypt) e não em texto puro?',
  'Para que, se o banco vazar, as senhas originais não fiquem expostas', 'Para ocupar menos espaço', 'Para o login ficar mais rápido', 'Porque a LGPD proíbe guardar senhas',
  'O hash é de mão única: dá para conferir a senha, mas não para recuperá-la. O Supabase já guarda as senhas do EduGuru assim.');
select pg_temp.q('Segurança da Informação', 'ES', 'Médio',
  'Na LGPD, quem é o **titular dos dados**?',
  'A pessoa natural a quem os dados pessoais se referem', 'A empresa que guarda os dados', 'O governo', 'O desenvolvedor do sistema',
  'O titular é a pessoa a quem os dados pertencem. No EduGuru, cada aluno é titular e exerce os seus direitos na tela Minha conta.');
select pg_temp.q('Segurança da Informação', 'ES', 'Médio',
  'O que é o princípio do **menor privilégio**?',
  'Cada usuário recebe apenas as permissões necessárias para a sua função', 'Dar acesso de administrador a todos', 'Não usar senhas', 'Bloquear todos os usuários',
  'Se uma conta tem só o necessário, um invasor que a tome faz menos estrago. No EduGuru, por exemplo, só o admin cadastra perguntas.');
select pg_temp.q('Segurança da Informação', 'ES', 'Médio',
  'O que tenta um ataque de **força bruta**?',
  'Adivinhar a senha testando muitas combinações; por isso limitar as tentativas ajuda a impedi-lo', 'Enganar o usuário por e-mail', 'Derrubar o servidor com muitas requisições', 'Instalar um vírus por pendrive',
  'A força bruta testa uma senha atrás da outra até acertar. Limitar as tentativas, como o EduGuru faz no código do MFA, torna o ataque inviável.');
select pg_temp.q('Segurança da Informação', 'ES', 'Difícil',
  'O que é **SQL Injection**?',
  'Um ataque em que o invasor insere comandos SQL em um campo de entrada para manipular a consulta ao banco', 'Inserir dados de teste no banco', 'Um tipo de backup', 'Uma forma de otimizar consultas',
  'Se o texto digitado entra direto no comando SQL, algo como '' OR 1=1 -- pode mudar o sentido da consulta e expor dados.');
select pg_temp.q('Segurança da Informação', 'ES', 'Difícil',
  'Qual é a **melhor forma de evitar** SQL Injection?',
  'Usar consultas parametrizadas (prepared statements) em vez de concatenar texto', 'Esconder o formulário', 'Escrever o SQL em letras maiúsculas', 'Desligar o banco à noite',
  'Na consulta parametrizada, o banco trata o valor digitado apenas como dado, nunca como parte do comando.');
select pg_temp.q('Segurança da Informação', 'ES', 'Difícil',
  'Na LGPD, qual base legal permite tratar dados quando o titular manifesta **concordância livre, informada e inequívoca** para uma finalidade?',
  'Consentimento', 'Legítimo interesse', 'Cumprimento de obrigação legal', 'Proteção do crédito',
  'O consentimento é a autorização do titular para uma finalidade específica. O EduGuru registra a data e a versão do termo que cada aluno aceitou.');
select pg_temp.q('Segurança da Informação', 'ES', 'Difícil',
  'O que é **XSS (Cross-Site Scripting)**?',
  'Um ataque que injeta scripts maliciosos em páginas vistas por outros usuários', 'Um estilo de CSS', 'Um protocolo de e-mail', 'Um tipo de firewall',
  'No XSS, o script roda no navegador de outra pessoa e pode roubar a sessão dela. O React ajuda ao tratar os textos como texto, não como código.');


-- Conferência: perguntas por disciplina e nível
select d.nome as disciplina,
       count(*) filter (where p.nivel = 'Fácil') as facil,
       count(*) filter (where p.nivel = 'Médio') as medio,
       count(*) filter (where p.nivel = 'Difícil') as dificil,
       count(*) as total
from public.perguntas p
join public.disciplinas d on d.id = p.disciplina_id
join public.gabaritos g on g.pergunta_id = p.id
group by d.nome
order by d.nome;
