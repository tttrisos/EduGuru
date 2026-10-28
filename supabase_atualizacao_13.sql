-- ============================================================
-- EduGuru — Atualização 13: banco inicial de perguntas
-- Rodar no SQL Editor do Supabase, DEPOIS da atualização 12.
-- Pode ser rodado mais de uma vez (idempotente): pergunta que já existe
-- (mesmo enunciado na mesma disciplina) é pulada.
--
-- O que faz:
--   - cria as disciplinas abaixo, se ainda não existirem (procura pelo nome);
--   - cadastra 120 perguntas (8 disciplinas × 15), cada uma com 4
--     alternativas e gabarito, já prontas para o quiz;
--   - em cada disciplina: 6 Fácil, 5 Médio e 4 Difícil.
--
-- Como ler este arquivo: em cada pergunta, a PRIMEIRA alternativa é a
-- correta. Na hora de gravar, a função sorteia a ordem das alternativas,
-- então no quiz a resposta certa cai em A, B, C ou D.
--
-- Este é o banco INICIAL. Ele será ampliado ao longo do projeto: novas
-- perguntas podem ser cadastradas pela tela Perguntas (admin) ou
-- acrescentadas aqui no mesmo formato.
-- ============================================================


-- Função temporária (só existe durante a execução deste script).
create or replace function pg_temp.q(
  p_disciplina text,
  p_curso text,
  p_nivel text,
  p_enunciado text,
  p_correta text,
  p_errada1 text,
  p_errada2 text,
  p_errada3 text
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
  -- 1) Disciplina: usa a que já existe com esse nome ou cria uma nova.
  select id into v_disciplina_id
  from public.disciplinas
  where lower(nome) = lower(p_disciplina)
  limit 1;

  if v_disciplina_id is null then
    insert into public.disciplinas (nome, curso)
    values (p_disciplina, p_curso)
    returning id into v_disciplina_id;
  end if;

  -- 2) Pergunta repetida? Pula.
  if exists (
    select 1 from public.perguntas
    where disciplina_id = v_disciplina_id and enunciado = p_enunciado
  ) then
    return;
  end if;

  -- 3) Sorteia a ordem das 4 alternativas.
  select array_agg(alt order by random())
  into v_alternativas
  from unnest(array[p_correta, p_errada1, p_errada2, p_errada3]) as alt;

  -- Letra em que a correta caiu (posição 1 = A, 2 = B...).
  v_letra := chr(64 + array_position(v_alternativas, p_correta));

  insert into public.perguntas
    (enunciado, disciplina_id, nivel, alternativa_a, alternativa_b, alternativa_c, alternativa_d)
  values
    (p_enunciado, v_disciplina_id, p_nivel,
     v_alternativas[1], v_alternativas[2], v_alternativas[3], v_alternativas[4])
  returning id into v_pergunta_id;

  insert into public.gabaritos (pergunta_id, correta) values (v_pergunta_id, v_letra);
end;
$$;


-- ------------------------------------------------------------
-- Algoritmos e Lógica de Programação (ADS)
-- ------------------------------------------------------------
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Fácil',
  'Qual estrutura repete um bloco de comandos enquanto uma condição for verdadeira?',
  'enquanto (while)', 'se (if)', 'escolha (switch)', 'retorne (return)');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Fácil',
  'Qual o resultado de 7 mod 3 (resto da divisão inteira)?',
  '1', '2', '0', '2,33');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Fácil',
  'Qual tipo de dado é o mais adequado para guardar a idade de uma pessoa em anos completos?',
  'Inteiro', 'Real', 'Caractere', 'Lógico');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Fácil',
  'O que é um algoritmo?',
  'Uma sequência finita e ordenada de passos para resolver um problema',
  'Uma linguagem de programação específica',
  'Um componente de hardware do computador',
  'Um tipo de banco de dados');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Fácil',
  'Qual operador lógico resulta verdadeiro somente quando as duas condições são verdadeiras?',
  'E', 'OU', 'NÃO', 'OU exclusivo');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Fácil',
  'Em um fluxograma, qual símbolo representa uma decisão?',
  'Losango', 'Retângulo', 'Elipse', 'Paralelogramo');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Médio',
  'Quantas vezes o laço "para i de 1 até 10 passo 2" é executado?',
  '5', '10', '4', '6');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Médio',
  'Depois de executar x ← 5; y ← x; x ← x + 3, qual é o valor de y?',
  '5', '8', '3', '0');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Médio',
  'Qual a diferença entre os laços "enquanto" e "repita...até"?',
  'O "repita" testa a condição no final, então executa o bloco pelo menos uma vez',
  'Não há diferença entre eles',
  'O "enquanto" sempre executa o bloco pelo menos uma vez',
  'O "repita" só funciona com números inteiros');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Médio',
  'Em um vetor de 10 posições indexado a partir de 0, qual é o índice do último elemento?',
  '9', '10', '11', '1');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Médio',
  'Seguindo a precedência dos operadores, qual o valor de 2 + 3 * 4?',
  '14', '20', '24', '9');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Difícil',
  'Em um laço que soma as notas de uma turma, qual é o papel da variável acumuladora?',
  'Guardar a soma parcial, sendo iniciada com zero antes do laço',
  'Contar quantas vezes o laço executou',
  'Guardar apenas o maior valor lido',
  'Encerrar o laço quando a soma passar de 10');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Difícil',
  'O que uma função recursiva precisa ter obrigatoriamente?',
  'Um caso base que interrompa as chamadas',
  'Um vetor como parâmetro',
  'Um laço "enquanto" dentro dela',
  'Variáveis globais');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Difícil',
  'Qual é o resultado de fatorial(4), calculado por recursão?',
  '24', '10', '16', '12');
select pg_temp.q('Algoritmos e Lógica de Programação', 'ADS', 'Difícil',
  'Para trocar os valores de a e b usando uma variável auxiliar, qual é a sequência correta?',
  'aux ← a; a ← b; b ← aux',
  'a ← b; b ← a',
  'aux ← a; b ← aux; a ← b',
  'a ← aux; b ← a; aux ← b');


-- ------------------------------------------------------------
-- Estruturas de Dados (SI)
-- ------------------------------------------------------------
select pg_temp.q('Estruturas de Dados', 'SI', 'Fácil',
  'Qual estrutura segue a regra LIFO (o último a entrar é o primeiro a sair)?',
  'Pilha', 'Fila', 'Árvore', 'Grafo');
select pg_temp.q('Estruturas de Dados', 'SI', 'Fácil',
  'Qual estrutura segue a regra FIFO (o primeiro a entrar é o primeiro a sair)?',
  'Fila', 'Pilha', 'Árvore binária', 'Tabela hash');
select pg_temp.q('Estruturas de Dados', 'SI', 'Fácil',
  'Em uma lista encadeada, além do valor, o que cada nó guarda?',
  'A referência (ponteiro) para o próximo nó',
  'O índice do vetor',
  'O tamanho total da lista',
  'Uma cópia do primeiro nó');
select pg_temp.q('Estruturas de Dados', 'SI', 'Fácil',
  'Como costuma se chamar a operação que coloca um elemento no topo de uma pilha?',
  'push', 'pop', 'enqueue', 'peek');
select pg_temp.q('Estruturas de Dados', 'SI', 'Fácil',
  'Em uma árvore, como se chama o nó que não possui pai?',
  'Raiz', 'Folha', 'Ramo', 'Irmão');
select pg_temp.q('Estruturas de Dados', 'SI', 'Fácil',
  'Qual a principal vantagem de um vetor em relação a uma lista encadeada?',
  'Acessar qualquer posição diretamente pelo índice',
  'Inserir no meio sem deslocar elementos',
  'Crescer sem limite de memória',
  'Não ocupar memória');
select pg_temp.q('Estruturas de Dados', 'SI', 'Médio',
  'Em uma árvore binária de busca, onde ficam os valores menores que a raiz?',
  'Na subárvore esquerda', 'Na subárvore direita', 'Sempre nas folhas', 'Em qualquer posição');
select pg_temp.q('Estruturas de Dados', 'SI', 'Médio',
  'Qual a complexidade da busca binária em um vetor ordenado de n elementos?',
  'O(log n)', 'O(n)', 'O(n²)', 'O(1)');
select pg_temp.q('Estruturas de Dados', 'SI', 'Médio',
  'Qual pré-requisito é obrigatório para usar a busca binária?',
  'O vetor estar ordenado',
  'O vetor ter tamanho par',
  'Os elementos serem todos diferentes',
  'Os dados estarem em uma lista encadeada');
select pg_temp.q('Estruturas de Dados', 'SI', 'Médio',
  'O percurso em ordem (in-order) de uma árvore binária de busca visita os nós em que ordem?',
  'Em ordem crescente de valor', 'Em ordem decrescente de valor', 'Por níveis', 'Em ordem aleatória');
select pg_temp.q('Estruturas de Dados', 'SI', 'Médio',
  'Qual estrutura controla as chamadas de funções (inclusive recursivas) durante a execução de um programa?',
  'Pilha', 'Fila', 'Tabela hash', 'Grafo');
select pg_temp.q('Estruturas de Dados', 'SI', 'Difícil',
  'No pior caso, qual a complexidade da busca em uma árvore binária de busca desbalanceada com n nós?',
  'O(n)', 'O(log n)', 'O(1)', 'O(n log n)');
select pg_temp.q('Estruturas de Dados', 'SI', 'Difícil',
  'Em uma tabela hash, o que é uma colisão?',
  'Quando duas chaves diferentes geram o mesmo índice',
  'Quando a tabela fica vazia',
  'Quando uma chave é removida',
  'Quando a função hash devolve um número negativo');
select pg_temp.q('Estruturas de Dados', 'SI', 'Difícil',
  'Qual algoritmo de ordenação usa a estratégia dividir para conquistar e tem complexidade O(n log n) em todos os casos?',
  'Merge sort', 'Bubble sort', 'Insertion sort', 'Selection sort');
select pg_temp.q('Estruturas de Dados', 'SI', 'Difícil',
  'Qual estrutura é a mais indicada para representar ruas e cruzamentos em um aplicativo de rotas?',
  'Grafo', 'Pilha', 'Fila', 'Vetor de caracteres');


-- ------------------------------------------------------------
-- Banco de Dados (SI)
-- ------------------------------------------------------------
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'Em um banco relacional, como se chama o campo que identifica unicamente cada linha de uma tabela?',
  'Chave primária', 'Chave estrangeira', 'Coluna calculada', 'View');
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'Qual comando SQL é usado para consultar dados?',
  'SELECT', 'INSERT', 'UPDATE', 'DELETE');
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'Qual comando SQL apaga linhas de uma tabela, mantendo a tabela?',
  'DELETE', 'DROP', 'REMOVE', 'ALTER');
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'O que significa a sigla SGBD?',
  'Sistema Gerenciador de Banco de Dados',
  'Sistema Geral de Backup de Dados',
  'Servidor Gráfico de Bases Distribuídas',
  'Software de Geração de Bancos Digitais');
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'Qual cláusula filtra as linhas retornadas por um SELECT?',
  'WHERE', 'ORDER BY', 'GROUP BY', 'FROM');
select pg_temp.q('Banco de Dados', 'SI', 'Fácil',
  'Para que serve uma chave estrangeira?',
  'Para relacionar uma tabela com a chave primária de outra tabela',
  'Para criptografar a tabela',
  'Para deixar todas as consultas mais rápidas',
  'Para impedir valores nulos em todas as colunas');
select pg_temp.q('Banco de Dados', 'SI', 'Médio',
  'Qual cláusula ordena o resultado de uma consulta?',
  'ORDER BY', 'GROUP BY', 'HAVING', 'SORT');
select pg_temp.q('Banco de Dados', 'SI', 'Médio',
  'Qual função de agregação conta quantas linhas existem em um resultado?',
  'COUNT()', 'SUM()', 'AVG()', 'MAX()');
select pg_temp.q('Banco de Dados', 'SI', 'Médio',
  'Um aluno pode cursar várias disciplinas e cada disciplina tem vários alunos. Qual é a cardinalidade desse relacionamento?',
  'N:N (muitos para muitos)', '1:1 (um para um)', '1:N (um para muitos)', '0:1 (zero ou um)');
select pg_temp.q('Banco de Dados', 'SI', 'Médio',
  'Qual JOIN retorna todas as linhas da tabela da esquerda, mesmo as que não têm correspondência na tabela da direita?',
  'LEFT JOIN', 'INNER JOIN', 'RIGHT JOIN', 'CROSS JOIN');
select pg_temp.q('Banco de Dados', 'SI', 'Médio',
  'Qual a diferença entre WHERE e HAVING?',
  'WHERE filtra as linhas antes do agrupamento; HAVING filtra os grupos depois do GROUP BY',
  'Não há diferença entre eles',
  'HAVING só funciona com textos',
  'WHERE só funciona com números');
select pg_temp.q('Banco de Dados', 'SI', 'Difícil',
  'Quando uma tabela está na Primeira Forma Normal (1FN)?',
  'Quando todos os atributos são atômicos, sem grupos repetidos ou campos multivalorados',
  'Quando não tem chave primária',
  'Quando não tem chave estrangeira',
  'Quando tem no máximo três colunas');
select pg_temp.q('Banco de Dados', 'SI', 'Difícil',
  'Qual propriedade ACID garante que uma transação acontece por inteiro ou não acontece?',
  'Atomicidade', 'Consistência', 'Isolamento', 'Durabilidade');
select pg_temp.q('Banco de Dados', 'SI', 'Difícil',
  'No PostgreSQL (usado pelo Supabase), qual recurso restringe quais linhas cada usuário pode ler ou alterar?',
  'Row Level Security (RLS)', 'Trigger', 'Sequence', 'Vacuum');
select pg_temp.q('Banco de Dados', 'SI', 'Difícil',
  'Para que serve criar um índice em uma coluna?',
  'Para acelerar buscas e filtros nessa coluna, com um custo extra nas gravações',
  'Para garantir que a coluna nunca fique vazia',
  'Para criptografar os dados da coluna',
  'Para fazer backup automático da coluna');


-- ------------------------------------------------------------
-- Engenharia de Software (ES)
-- ------------------------------------------------------------
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  '"O sistema deve permitir o cadastro de alunos" é um exemplo de requisito de que tipo?',
  'Funcional', 'Não funcional', 'De hardware', 'De marketing');
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  '"O sistema deve responder em até 2 segundos" é um exemplo de requisito de que tipo?',
  'Não funcional', 'Funcional', 'De negócio', 'De usuário final');
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  'No Scrum, como se chama o período fixo de trabalho em que a equipe entrega um incremento do produto?',
  'Sprint', 'Backlog', 'Daily', 'Epic');
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  'Qual diagrama da UML mostra as classes, seus atributos, métodos e relacionamentos?',
  'Diagrama de classes', 'Diagrama de casos de uso', 'Diagrama de sequência', 'Diagrama de atividades');
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  'No Scrum, quem é responsável por priorizar o Product Backlog?',
  'Product Owner', 'Scrum Master', 'Equipe de desenvolvimento', 'Cliente final, sozinho');
select pg_temp.q('Engenharia de Software', 'ES', 'Fácil',
  'O Git é uma ferramenta de quê?',
  'Controle de versão', 'Modelagem de banco de dados', 'Teste de carga', 'Design de interfaces');
select pg_temp.q('Engenharia de Software', 'ES', 'Médio',
  'Qual modelo de processo executa as fases (requisitos, projeto, implementação e testes) em sequência, uma após a outra?',
  'Cascata', 'Scrum', 'Kanban', 'Espiral');
select pg_temp.q('Engenharia de Software', 'ES', 'Médio',
  'Qual diagrama da UML representa os atores e as funcionalidades que eles usam no sistema?',
  'Diagrama de casos de uso', 'Diagrama de classes', 'Diagrama de implantação', 'Diagrama de estados');
select pg_temp.q('Engenharia de Software', 'ES', 'Médio',
  'Um teste que verifica uma função isolada, como o cálculo da média, é um teste de quê?',
  'De unidade', 'De aceitação', 'De carga', 'De usabilidade');
select pg_temp.q('Engenharia de Software', 'ES', 'Médio',
  'No Kanban, para que serve o limite de WIP (Work In Progress)?',
  'Para limitar quantas tarefas ficam em andamento ao mesmo tempo em cada etapa',
  'Para aumentar o número de tarefas simultâneas',
  'Para definir o prazo final do projeto',
  'Para escolher o Product Owner');
select pg_temp.q('Engenharia de Software', 'ES', 'Médio',
  'O que é refatoração?',
  'Melhorar a estrutura interna do código sem mudar o comportamento externo',
  'Reescrever o sistema inteiro em outra linguagem',
  'Adicionar novas funcionalidades',
  'Corrigir apenas erros de digitação na interface');
select pg_temp.q('Engenharia de Software', 'ES', 'Difícil',
  'O que significa ter 50% de cobertura de testes?',
  'Os testes executam cerca de metade das linhas (ou ramos) do código',
  'Metade dos testes passou',
  'Metade dos requisitos foi implementada',
  'O sistema tem 50% de chance de falhar');
select pg_temp.q('Engenharia de Software', 'ES', 'Difícil',
  'No BPMN, qual elemento representa um ponto de decisão em que o fluxo segue por um caminho ou por outro?',
  'Gateway exclusivo', 'Evento de início', 'Tarefa', 'Raia (lane)');
select pg_temp.q('Engenharia de Software', 'ES', 'Difícil',
  'Qual princípio do SOLID diz que uma classe deve ter apenas um motivo para mudar?',
  'Responsabilidade única', 'Aberto/fechado', 'Substituição de Liskov', 'Inversão de dependência');
select pg_temp.q('Engenharia de Software', 'ES', 'Difícil',
  'Em um diagrama de classes, o que indica a composição (losango preenchido)?',
  'Que a parte não existe sem o todo: se o todo for excluído, as partes também são',
  'Que as classes não têm relação',
  'Que uma classe herda da outra',
  'Que as classes estão em pacotes diferentes');


-- ------------------------------------------------------------
-- Programação para Internet (SI)
-- ------------------------------------------------------------
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Qual linguagem define a estrutura e o conteúdo de uma página web?',
  'HTML', 'CSS', 'SQL', 'Python');
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Qual linguagem é usada para definir cores, fontes e o layout de uma página?',
  'CSS', 'HTML', 'JavaScript', 'PHP');
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Qual tag HTML cria um link para outra página?',
  '<a>', '<link>', '<href>', '<p>');
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Qual protocolo transfere páginas web de forma criptografada?',
  'HTTPS', 'HTTP', 'FTP', 'SMTP');
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Qual tag HTML é usada para inserir uma imagem?',
  '<img>', '<image>', '<pic>', '<src>');
select pg_temp.q('Programação para Internet', 'SI', 'Fácil',
  'Em CSS, qual propriedade muda a cor do texto?',
  'color', 'background-color', 'font-color', 'text-style');
select pg_temp.q('Programação para Internet', 'SI', 'Médio',
  'Qual método HTTP é normalmente usado para enviar ao servidor os dados de um formulário de cadastro?',
  'POST', 'GET', 'HEAD', 'OPTIONS');
select pg_temp.q('Programação para Internet', 'SI', 'Médio',
  'O que indica o código de status HTTP 404?',
  'O recurso solicitado não foi encontrado',
  'O servidor está sobrecarregado',
  'O acesso foi autorizado',
  'A requisição foi bem-sucedida');
select pg_temp.q('Programação para Internet', 'SI', 'Médio',
  'Em JavaScript, qual palavra declara uma variável que não pode ser reatribuída?',
  'const', 'var', 'let', 'static');
select pg_temp.q('Programação para Internet', 'SI', 'Médio',
  'No CSS Flexbox, qual propriedade alinha os itens ao longo do eixo principal?',
  'justify-content', 'align-items', 'flex-wrap', 'order');
select pg_temp.q('Programação para Internet', 'SI', 'Médio',
  'O que é o DOM?',
  'A representação em árvore dos elementos da página, que o JavaScript pode ler e alterar',
  'Um banco de dados do navegador',
  'Um servidor web',
  'Um formato de imagem');
select pg_temp.q('Programação para Internet', 'SI', 'Difícil',
  'Qual a diferença entre == e === em JavaScript?',
  '=== compara valor e tipo; == converte os tipos antes de comparar',
  'Não há diferença entre eles',
  '== compara apenas textos',
  '=== só funciona com números');
select pg_temp.q('Programação para Internet', 'SI', 'Difícil',
  'O que faz a função fetch() em JavaScript?',
  'Faz uma requisição HTTP e devolve uma Promise com a resposta',
  'Recarrega a página',
  'Salva dados no disco do usuário',
  'Cria um elemento HTML');
select pg_temp.q('Programação para Internet', 'SI', 'Difícil',
  'Em CSS, qual destes seletores tem a maior especificidade?',
  'Seletor de id (#topo)', 'Seletor de classe (.aviso)', 'Seletor de tipo (p)', 'Seletor universal (*)');
select pg_temp.q('Programação para Internet', 'SI', 'Difícil',
  'Para que servem as media queries em CSS?',
  'Para aplicar estilos diferentes conforme o tamanho da tela, deixando o site responsivo',
  'Para tocar vídeos na página',
  'Para conectar a página ao banco de dados',
  'Para comprimir as imagens');


-- ------------------------------------------------------------
-- Aplicativos Web (SI)
-- ------------------------------------------------------------
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'No React, qual hook guarda um valor que, quando muda, faz o componente ser desenhado de novo?',
  'useState', 'useEffect', 'useRef', 'useMemo');
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'O que é uma SPA (Single Page Application)?',
  'Um aplicativo com uma única página HTML que troca o conteúdo pelo JavaScript, sem recarregar tudo',
  'Um aplicativo que só pode ter uma tela',
  'Um site que não usa JavaScript',
  'Um sistema que roda apenas no servidor');
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'Qual formato de texto é o mais usado para trocar dados entre front-end e back-end em APIs web?',
  'JSON', 'DOCX', 'MP3', 'BMP');
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'No React, como os dados são passados de um componente pai para um componente filho?',
  'Por props', 'Por CSS', 'Pelo banco de dados', 'Por cookies');
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'Qual comando instala as dependências listadas no package.json?',
  'npm install', 'npm start', 'npm run build', 'npm publish');
select pg_temp.q('Aplicativos Web', 'SI', 'Fácil',
  'O que o TypeScript acrescenta ao JavaScript, principalmente?',
  'Tipagem estática, que aponta erros antes de executar',
  'Um banco de dados embutido',
  'Estilos visuais prontos',
  'Um servidor web');
select pg_temp.q('Aplicativos Web', 'SI', 'Médio',
  'Para que serve o useEffect no React?',
  'Para executar efeitos colaterais, como buscar dados de uma API depois que o componente aparece',
  'Para estilizar o componente',
  'Para criar as rotas do site',
  'Para declarar tipos');
select pg_temp.q('Aplicativos Web', 'SI', 'Médio',
  'O que é uma API REST?',
  'Uma interface que expõe recursos por URLs e usa os métodos HTTP (GET, POST, PUT, DELETE)',
  'Um banco de dados',
  'Uma biblioteca de componentes visuais',
  'Um editor de código');
select pg_temp.q('Aplicativos Web', 'SI', 'Médio',
  'Por que cada item de uma lista desenhada com map() no React precisa de uma key?',
  'Para o React identificar qual item mudou, entrou ou saiu e atualizar a tela corretamente',
  'Para o CSS funcionar',
  'Para ordenar a lista em ordem alfabética',
  'Para salvar a lista no banco');
select pg_temp.q('Aplicativos Web', 'SI', 'Médio',
  'No Supabase, qual a diferença entre a chave anon (pública) e a chave service_role?',
  'A anon pode ficar no front-end porque respeita a RLS; a service_role ignora a RLS e nunca deve ir para o navegador',
  'Nenhuma: as duas podem ser usadas no front-end',
  'Só a service_role funciona com login',
  'A anon só funciona em modo de teste');
select pg_temp.q('Aplicativos Web', 'SI', 'Médio',
  'O que é CORS?',
  'Uma regra do navegador que controla se uma página pode fazer requisições para outro domínio',
  'Um framework de CSS',
  'Um tipo de banco de dados',
  'Um formato de imagem');
select pg_temp.q('Aplicativos Web', 'SI', 'Difícil',
  'Por que a correção de um quiz deve ser feita no servidor (banco), e não no navegador?',
  'Porque o código do navegador pode ser alterado pelo usuário; no servidor, ele não vê o gabarito nem inventa pontos',
  'Porque o banco deixa a tela mais bonita',
  'Porque o React não sabe comparar textos',
  'Porque o navegador não tem memória suficiente');
select pg_temp.q('Aplicativos Web', 'SI', 'Difícil',
  'No login com verificação em duas etapas (TOTP), o que indica o nível de garantia aal2?',
  'Que o usuário confirmou a senha e também o código do aplicativo autenticador',
  'Que o usuário só digitou a senha',
  'Que o usuário é administrador',
  'Que a conta está bloqueada');
select pg_temp.q('Aplicativos Web', 'SI', 'Difícil',
  'Qual a vantagem do HashRouter em um site publicado no GitHub Pages?',
  'As rotas ficam depois do #, então o servidor sempre entrega o index.html e não dá erro 404 ao recarregar',
  'Deixa as páginas mais rápidas',
  'Criptografa as rotas',
  'Dispensa o uso de JavaScript');
select pg_temp.q('Aplicativos Web', 'SI', 'Difícil',
  'No React, o que acontece ao alterar o estado diretamente (ex.: lista.push(item)) em vez de usar a função set do useState?',
  'O React pode não perceber a mudança, e a tela não é atualizada',
  'A tela é atualizada normalmente',
  'O navegador fecha a aba',
  'O valor é salvo automaticamente no banco');


-- ------------------------------------------------------------
-- Redes de Computadores (SI)
-- ------------------------------------------------------------
select pg_temp.q('Redes de Computadores', 'SI', 'Fácil',
  'Qual equipamento interliga redes diferentes e encaminha pacotes entre elas, como a rede de casa e a internet?',
  'Roteador', 'Hub', 'Repetidor', 'Patch panel');
select pg_temp.q('Redes de Computadores', 'SI', 'Fácil',
  'O que faz o DNS?',
  'Traduz nomes de domínio (como umc.br) em endereços IP',
  'Criptografa senhas',
  'Envia e-mails',
  'Bloqueia vírus');
select pg_temp.q('Redes de Computadores', 'SI', 'Fácil',
  'Quantas camadas tem o modelo de referência OSI?',
  '7', '4', '5', '9');
select pg_temp.q('Redes de Computadores', 'SI', 'Fácil',
  'Qual protocolo entrega automaticamente um endereço IP aos dispositivos da rede?',
  'DHCP', 'FTP', 'SMTP', 'SSH');
select pg_temp.q('Redes de Computadores', 'SI', 'Fácil',
  'Um endereço IPv4 é formado por quantos bits?',
  '32', '16', '64', '128');
select pg_temp.q('Redes de Computadores', 'SI', 'Fácil',
  'Qual sigla designa uma rede local, como a de um laboratório da universidade?',
  'LAN', 'WAN', 'MAN', 'VPN');
select pg_temp.q('Redes de Computadores', 'SI', 'Médio',
  'Qual a principal diferença entre TCP e UDP?',
  'O TCP garante a entrega e a ordem dos dados; o UDP não garante, mas é mais leve',
  'O UDP é sempre mais seguro',
  'O TCP não usa portas',
  'Não há diferença entre eles');
select pg_temp.q('Redes de Computadores', 'SI', 'Médio',
  'Qual é a porta padrão do protocolo HTTPS?',
  '443', '80', '21', '25');
select pg_temp.q('Redes de Computadores', 'SI', 'Médio',
  'Em qual camada do modelo OSI atua o roteador?',
  'Rede', 'Física', 'Enlace', 'Aplicação');
select pg_temp.q('Redes de Computadores', 'SI', 'Médio',
  'Quantos endereços de hosts utilizáveis a máscara 255.255.255.0 (/24) permite?',
  '254', '256', '255', '128');
select pg_temp.q('Redes de Computadores', 'SI', 'Médio',
  'Com base em qual informação o switch encaminha os quadros?',
  'Endereço MAC', 'Nome de domínio', 'Endereço de e-mail', 'Número da porta TCP');
select pg_temp.q('Redes de Computadores', 'SI', 'Difícil',
  'O que faz o NAT em um roteador doméstico?',
  'Permite que vários dispositivos com IP privado compartilhem um único IP público',
  'Aumenta a velocidade do Wi-Fi',
  'Criptografa todo o tráfego',
  'Bloqueia sites');
select pg_temp.q('Redes de Computadores', 'SI', 'Difícil',
  'Qual é o endereço de broadcast da rede 192.168.10.0/24?',
  '192.168.10.255', '192.168.10.0', '192.168.10.1', '192.168.255.255');
select pg_temp.q('Redes de Computadores', 'SI', 'Difícil',
  'Quais são, em ordem, as três etapas do estabelecimento de conexão TCP (three-way handshake)?',
  'SYN, SYN-ACK, ACK', 'ACK, SYN, FIN', 'SYN, ACK, FIN', 'FIN, ACK, SYN');
select pg_temp.q('Redes de Computadores', 'SI', 'Difícil',
  'Por que o IPv6 foi criado?',
  'Porque os endereços IPv4 (cerca de 4,3 bilhões) estão se esgotando; o IPv6 usa 128 bits',
  'Para substituir o DNS',
  'Para acabar com os roteadores',
  'Para deixar a internet sem fio');


-- ------------------------------------------------------------
-- Segurança da Informação (ADS)
-- ------------------------------------------------------------
select pg_temp.q('Segurança da Informação', 'ADS', 'Fácil',
  'Quais são os três pilares da segurança da informação (tríade CID)?',
  'Confidencialidade, Integridade e Disponibilidade',
  'Custo, Infraestrutura e Acesso',
  'Criptografia, Internet e Antivírus',
  'Controle, Inspeção e Auditoria');
select pg_temp.q('Segurança da Informação', 'ADS', 'Fácil',
  'O que é phishing?',
  'Uma tentativa de enganar a pessoa, por e-mail ou mensagem falsa, para roubar senhas ou dados',
  'Um tipo de backup',
  'Um protocolo de rede',
  'Um antivírus');
select pg_temp.q('Segurança da Informação', 'ADS', 'Fácil',
  'Qual destas senhas é a mais forte?',
  'Gx7!pR2#vLq9', '123456', 'senha2026', 'abcdef');
select pg_temp.q('Segurança da Informação', 'ADS', 'Fácil',
  'O que exige a autenticação em dois fatores (MFA)?',
  'Duas formas diferentes de comprovar a identidade, como a senha e um código do celular',
  'Duas senhas iguais',
  'Dois e-mails diferentes',
  'Dois computadores');
select pg_temp.q('Segurança da Informação', 'ADS', 'Fácil',
  'Do que trata a LGPD (Lei nº 13.709/2018)?',
  'Da proteção de dados pessoais',
  'Dos direitos autorais de software',
  'Dos impostos sobre tecnologia',
  'Das telecomunicações');
select pg_temp.q('Segurança da Informação', 'ADS', 'Fácil',
  'Para que serve um backup?',
  'Para ter uma cópia dos dados e recuperá-los em caso de perda',
  'Para acelerar o computador',
  'Para remover vírus',
  'Para aumentar a memória RAM');
select pg_temp.q('Segurança da Informação', 'ADS', 'Médio',
  'Qual a diferença entre criptografia simétrica e assimétrica?',
  'A simétrica usa a mesma chave para cifrar e decifrar; a assimétrica usa um par de chaves (pública e privada)',
  'A assimétrica não usa chaves',
  'A simétrica é sempre mais lenta',
  'Não há diferença entre elas');
select pg_temp.q('Segurança da Informação', 'ADS', 'Médio',
  'Por que as senhas devem ser guardadas com hash (ex.: bcrypt) e não em texto puro?',
  'Para que, se o banco vazar, as senhas originais não fiquem expostas',
  'Para ocupar menos espaço',
  'Para o login ficar mais rápido',
  'Porque a LGPD proíbe guardar senhas');
select pg_temp.q('Segurança da Informação', 'ADS', 'Médio',
  'Na LGPD, quem é o titular dos dados?',
  'A pessoa natural a quem os dados pessoais se referem',
  'A empresa que guarda os dados',
  'O governo',
  'O desenvolvedor do sistema');
select pg_temp.q('Segurança da Informação', 'ADS', 'Médio',
  'O que é o princípio do menor privilégio?',
  'Cada usuário recebe apenas as permissões necessárias para a sua função',
  'Dar acesso de administrador a todos',
  'Não usar senhas',
  'Bloquear todos os usuários');
select pg_temp.q('Segurança da Informação', 'ADS', 'Médio',
  'O que tenta um ataque de força bruta?',
  'Adivinhar a senha testando muitas combinações; por isso limitar as tentativas ajuda a impedi-lo',
  'Enganar o usuário por e-mail',
  'Derrubar o servidor com muitas requisições',
  'Instalar um vírus por pendrive');
select pg_temp.q('Segurança da Informação', 'ADS', 'Difícil',
  'O que é SQL Injection?',
  'Um ataque em que o invasor insere comandos SQL em um campo de entrada para manipular a consulta ao banco',
  'Inserir dados de teste no banco',
  'Um tipo de backup',
  'Uma forma de otimizar consultas');
select pg_temp.q('Segurança da Informação', 'ADS', 'Difícil',
  'Qual é a melhor forma de evitar SQL Injection?',
  'Usar consultas parametrizadas (prepared statements) em vez de concatenar texto',
  'Esconder o formulário',
  'Escrever o SQL em letras maiúsculas',
  'Desligar o banco à noite');
select pg_temp.q('Segurança da Informação', 'ADS', 'Difícil',
  'Na LGPD, qual base legal permite tratar dados quando o titular manifesta concordância livre, informada e inequívoca para uma finalidade?',
  'Consentimento', 'Legítimo interesse', 'Cumprimento de obrigação legal', 'Proteção do crédito');
select pg_temp.q('Segurança da Informação', 'ADS', 'Difícil',
  'O que é XSS (Cross-Site Scripting)?',
  'Um ataque que injeta scripts maliciosos em páginas vistas por outros usuários',
  'Um estilo de CSS',
  'Um protocolo de e-mail',
  'Um tipo de firewall');


-- ------------------------------------------------------------
-- Conferência: perguntas prontas por disciplina e nível
-- ------------------------------------------------------------
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
