-- ============================================================
-- EduGuru — 28: mais 5 disciplinas no quiz (5 × 15 = 75 perguntas)
--   Software Básico (SI, ADS e ES), Paradigmas de Orientação a Objetos (SI),
--   Gestão de Projetos (SI e ES), Inteligência de Negócios (SI e ES) e
--   Governança de TI (ADS). Todas já existem na grade (script 13) e estão
--   ligadas às áreas de carreira (script 17).
--   Em cada disciplina: 6 Fácil, 5 Médio e 4 Difícil, todas com explicação.
--   As alternativas foram escritas para a certa NÃO ser sempre a mais longa
--   (teste: testes/compartilhado/perguntasEquilibradas.test.ts).
-- Em cada pergunta, a PRIMEIRA alternativa é a correta (a ordem é sorteada ao
-- gravar) e o último texto é a explicação mostrada depois da resposta.
-- Rodar depois do 27 (e depois de rodar o 14 de novo). Pode ser rodado de novo.
-- ============================================================


-- Função temporária (só existe durante este script). Mesma ideia da do script 14, mas a disciplina
-- precisa existir (não cria disciplina nova).
create or replace function pg_temp.q(
  p_disciplina text,
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
  select id into v_disciplina_id
  from public.disciplinas
  where lower(nome) = lower(p_disciplina)
  limit 1;

  if v_disciplina_id is null then
    raise exception 'Disciplina "%" não encontrada. Rode o script 13 antes.', p_disciplina;
  end if;

  -- Ordem sorteada; a letra do gabarito é a posição em que a correta caiu.
  select array_agg(alt order by random())
  into v_alternativas
  from unnest(array[p_correta, p_errada1, p_errada2, p_errada3]) as alt;
  v_letra := chr(64 + array_position(v_alternativas, p_correta));

  select id into v_pergunta_id
  from public.perguntas
  where disciplina_id = v_disciplina_id and enunciado = p_enunciado
  limit 1;

  if v_pergunta_id is not null then
    -- Já existe (script rodado de novo): atualiza a explicação e, se mudaram, as alternativas.
    update public.gabaritos set explicacao = p_explicacao where pergunta_id = v_pergunta_id;
    if not exists (
      select 1 from public.perguntas p
      where p.id = v_pergunta_id
        and (select array_agg(x order by x) from unnest(array[p.alternativa_a, p.alternativa_b, p.alternativa_c, p.alternativa_d]) x)
          = (select array_agg(x order by x) from unnest(array[p_correta, p_errada1, p_errada2, p_errada3]) x)
    ) then
      update public.perguntas
      set alternativa_a = v_alternativas[1], alternativa_b = v_alternativas[2],
          alternativa_c = v_alternativas[3], alternativa_d = v_alternativas[4]
      where id = v_pergunta_id;
      update public.gabaritos set correta = v_letra where pergunta_id = v_pergunta_id;
    end if;
    return;
  end if;

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


-- ============================================================
-- Software Básico (SI, ADS e ES)
-- ============================================================
select pg_temp.q('Software Básico', 'Fácil',
  'Qual componente do computador **executa as instruções** dos programas?',
  'Processador (CPU)', 'Memória RAM', 'Disco rígido (HD)', 'Placa de rede',
  'O processador busca cada instrução na memória e a executa. A RAM guarda os dados em uso, e o disco guarda os arquivos de forma permanente.');

select pg_temp.q('Software Básico', 'Fácil',
  'Qual memória **perde os dados** quando o computador é desligado?',
  'RAM', 'SSD', 'HD', 'Pendrive',
  'A RAM é volátil: só guarda os dados enquanto há energia. SSD, HD e pendrive mantêm os arquivos mesmo desligados.');

select pg_temp.q('Software Básico', 'Fácil',
  'Qual é a função principal do **sistema operacional**?',
  'Gerenciar o hardware e oferecer serviços aos programas', 'Editar textos e planilhas e enviar os arquivos por e-mail', 'Proteger o computador apenas contra vírus da internet', 'Conectar o computador à internet e escolher a melhor rede Wi-Fi',
  'O sistema operacional (Windows, Linux, Android) controla processador, memória, disco e dispositivos, e os programas pedem esses recursos a ele.');

select pg_temp.q('Software Básico', 'Fácil',
  'Quantos **bits** formam um **byte**?',
  '8', '4', '16', '1024',
  'Um byte tem 8 bits, o suficiente para 256 valores diferentes (de 0 a 255). 1024 é a quantidade de bytes em um kibibyte.');

select pg_temp.q('Software Básico', 'Fácil',
  'Qual é o valor decimal do número binário **1010**?',
  '10', '1010', '8', '12',
  'Da direita para a esquerda, as posições valem 1, 2, 4 e 8. Em 1010 estão ligadas as posições 8 e 2: 8 + 2 = 10.');

select pg_temp.q('Software Básico', 'Fácil',
  'O que é um **processo** em um sistema operacional?',
  'Um programa em execução', 'Um arquivo guardado no disco', 'Uma peça do processador', 'Uma pasta do sistema',
  'O programa é o arquivo no disco; quando ele é aberto, vira um processo, com a sua própria área de memória e o seu estado.');

select pg_temp.q('Software Básico', 'Médio',
  'O que faz um **compilador**?',
  'Traduz o código-fonte para código de máquina antes da execução', 'Executa o programa linha por linha, sem gerar arquivo executável', 'Procura erros de lógica e corrige o código sozinho', 'Compacta o programa para ocupar menos espaço no disco',
  'O compilador traduz o programa inteiro antes de rodar e gera um executável. Quem executa linha por linha, sem gerar executável, é o interpretador.');

select pg_temp.q('Software Básico', 'Médio',
  'Para que serve a **memória virtual**?',
  'Usar parte do disco como extensão da RAM quando ela acaba', 'Guardar os arquivos na nuvem', 'Acelerar o processador dobrando a frequência do clock', 'Criar uma cópia de segurança da RAM no pendrive',
  'Quando a RAM enche, o sistema operacional move partes pouco usadas para o disco (arquivo de paginação ou swap). Funciona, mas é bem mais lento que a RAM.');

select pg_temp.q('Software Básico', 'Médio',
  'O que é um **deadlock** (impasse)?',
  'Dois ou mais processos esperando um pelo outro para sempre', 'Um processo que terminou com erro', 'Quando o processador desliga para economizar energia em repouso', 'Um vírus que trava o computador e pede resgate pelos arquivos',
  'No deadlock, o processo A segura um recurso e espera o de B, enquanto B segura o seu e espera o de A. Nenhum dos dois avança.');

select pg_temp.q('Software Básico', 'Médio',
  'Qual é a função do **escalonador** de processos?',
  'Decidir qual processo usa o processador a cada momento', 'Apagar os processos que usam muita memória', 'Instalar novos programas', 'Dividir o disco em partições',
  'Como há muito mais processos que núcleos de processador, o escalonador reveza o uso da CPU entre eles, dando a impressão de que tudo roda ao mesmo tempo.');

select pg_temp.q('Software Básico', 'Médio',
  'O que é o sistema **hexadecimal**?',
  'Um sistema de numeração de base 16, com dígitos de 0 a 9 e de A a F', 'Um sistema de numeração de base 6, usado nos relógios e calendários antigos', 'Um formato de imagem', 'Uma linguagem de programação de baixo nível usada para escrever drivers de hardware',
  'O hexadecimal usa 16 símbolos (0–9 e A–F). Cada dígito equivale a 4 bits, por isso ele é usado para escrever endereços de memória e cores (#8257E5).');

select pg_temp.q('Software Básico', 'Difícil',
  'Em um processador com **pipeline**, qual é o ganho principal?',
  'Executar etapas de várias instruções ao mesmo tempo', 'Aumentar a memória cache', 'Diminuir o tamanho das instruções', 'Eliminar a necessidade de memória RAM no computador',
  'No pipeline, enquanto uma instrução é executada, a próxima já está sendo decodificada e a seguinte, buscada, como uma linha de montagem.');

select pg_temp.q('Software Básico', 'Difícil',
  'Qual a diferença entre **thread e processo**?',
  'Threads de um mesmo processo compartilham a memória; processos têm memória separada', 'Processos de um mesmo programa compartilham a memória; threads têm memória separada', 'Thread é o nome do processo no Linux', 'Não há diferença entre eles',
  'As threads de um processo dividem a mesma memória, o que deixa a comunicação rápida, mas exige cuidado com acesso simultâneo. Processos são isolados uns dos outros.');

select pg_temp.q('Software Básico', 'Difícil',
  'Qual é o valor de **0x1F** em decimal?',
  '31', '15', '16', '115',
  'Em hexadecimal, 1F = 1 × 16 + 15 (F vale 15) = 31. O prefixo 0x só indica que o número está em hexadecimal.');

select pg_temp.q('Software Básico', 'Difícil',
  'O que é **paginação** na gerência de memória?',
  'Dividir a memória em blocos de tamanho fixo, as páginas', 'Numerar as páginas de um documento antes de mandar para a impressora', 'Mostrar os resultados de uma consulta em várias telas', 'Reservar toda a memória para o primeiro processo que pedir',
  'Com a paginação, a memória de cada processo é dividida em páginas que podem ficar em qualquer lugar da RAM (ou no disco), o que evita buracos e permite a memória virtual.');


-- ============================================================
-- Paradigmas de Orientação a Objetos (SI)
-- ============================================================
select pg_temp.q('Paradigmas de Orientação a Objetos', 'Fácil',
  'Na orientação a objetos, o que é uma **classe**?',
  'Um molde que define os atributos e métodos dos objetos', 'Um objeto já criado na memória', 'Uma variável que guarda números inteiros e decimais', 'Uma tabela do banco de dados',
  'A classe é o molde (ex.: Aluno, com nome e curso); cada aluno real criado a partir dela é um objeto.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Fácil',
  'O que é um **objeto**?',
  'Uma instância de uma classe', 'Um arquivo com o código do programa', 'Um tipo de laço de repetição', 'Um comentário explicativo no código',
  'Instanciar é criar um objeto a partir da classe: new Aluno("Maria") cria um objeto da classe Aluno, com os seus próprios valores.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Fácil',
  'Como se chama uma **ação** que o objeto sabe fazer, definida na classe?',
  'Método', 'Atributo', 'Pacote', 'Herança',
  'Atributos são as características (nome, curso); métodos são as ações (matricular(), calcularMedia()).');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Fácil',
  'Qual pilar da orientação a objetos **esconde os detalhes internos** e expõe só o necessário?',
  'Encapsulamento', 'Herança', 'Polimorfismo', 'Instanciação',
  'No encapsulamento, os atributos ficam privados e só são alterados pelos métodos da classe, que podem validar os valores.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Fácil',
  'O que é **herança**?',
  'Uma classe reaproveitar atributos e métodos de outra', 'Copiar e colar o código de uma classe em outra, à mão', 'Um objeto apagar outro objeto da memória', 'Uma classe que não pode ter atributos nem métodos públicos',
  'Na herança, a subclasse (ex.: Administrador) recebe tudo da superclasse (Usuario) e acrescenta o que é só dela.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Fácil',
  'Para que serve o **construtor** de uma classe?',
  'Inicializar o objeto quando ele é criado', 'Apagar o objeto da memória quando ele não é mais usado', 'Desenhar a classe e os seus atributos no diagrama UML', 'Compilar o programa antes de cada execução no servidor',
  'O construtor roda no momento do new e preenche os valores iniciais do objeto. Quem libera a memória depois é o coletor de lixo (ou o destrutor, em C++).');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Médio',
  'O que é **polimorfismo**?',
  'Um mesmo método se comportar de formas diferentes em cada classe', 'Uma classe ter muitos atributos', 'Criar vários objetos da mesma classe ao mesmo tempo, em sequência', 'Esconder os atributos de uma classe',
  'Exemplo: Forma.area() calcula de um jeito no Círculo e de outro no Quadrado. Quem chama só usa area(), sem saber qual forma é.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Médio',
  'Qual a diferença entre **sobrecarga e sobrescrita** de métodos?',
  'Sobrecarga: mesmo nome, parâmetros diferentes; sobrescrita: a subclasse redefine o método', 'Sobrescrita: mesmo nome, parâmetros diferentes; sobrecarga: a subclasse redefine o método', 'Não há diferença entre elas', 'Sobrecarga só existe em Python',
  'Sobrecarga (overload): somar(int, int) e somar(double, double) na mesma classe. Sobrescrita (override): a subclasse troca o comportamento de um método herdado.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Médio',
  'O que é uma **classe abstrata**?',
  'Uma classe que não pode ser instanciada e serve de base para outras', 'Uma classe sem nenhum atributo', 'Uma classe que só pode ter um objeto, criado uma única vez em todo o programa', 'Uma classe escrita sem código, apenas com comentários explicando o que deveria fazer',
  'A classe abstrata reúne o que as subclasses têm em comum e pode ter métodos sem corpo, que cada subclasse é obrigada a implementar.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Médio',
  'Para que serve uma **interface** (em Java ou TypeScript)?',
  'Definir os métodos que uma classe se compromete a ter', 'Desenhar a tela do sistema', 'Guardar os dados do usuário em um arquivo de configuração do sistema', 'Criar objetos sem usar o operador new, direto pelo nome da classe',
  'A interface é um contrato: diz o que a classe deve oferecer, sem dizer como. Uma classe pode implementar várias interfaces.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Médio',
  'O modificador de acesso **private** permite acessar o atributo de onde?',
  'Só de dentro da própria classe', 'De qualquer classe do projeto', 'Só das subclasses e do mesmo pacote', 'De qualquer lugar, inclusive de outros programas',
  'private é o mais restrito: só a própria classe enxerga. protected libera para as subclasses, e public, para todos.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Difícil',
  'Qual a diferença entre **agregação e composição**?',
  'Na composição, a parte não existe sem o todo; na agregação, existe', 'Na agregação, a parte não existe sem o todo; na composição, existe', 'São a mesma coisa com nomes diferentes', 'A composição só pode ser usada entre duas classes do mesmo pacote',
  'Composição: os cômodos de uma casa somem com a casa. Agregação: os alunos continuam existindo se a turma for encerrada.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Difícil',
  'O que diz o **princípio de substituição de Liskov** (o L do SOLID)?',
  'Um objeto da subclasse deve poder substituir um da superclasse sem quebrar o programa', 'Toda classe deve ter só um motivo para mudar', 'As classes devem depender de abstrações', 'Uma subclasse deve copiar todos os métodos da superclasse e reescrevê-los do zero',
  'Se o código funciona com um Usuario, deve continuar funcionando quando receber um Administrador. Se a subclasse quebra esse uso, a herança está errada.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Difícil',
  'Por que muitas vezes se prefere **composição a herança**?',
  'Porque deixa as classes menos acopladas e mais fáceis de mudar', 'Porque a herança não existe mais nas linguagens modernas, como Python', 'Porque a composição faz o programa rodar sempre mais rápido e usar menos memória', 'Porque a herança proíbe o uso de interfaces',
  'Na herança, a subclasse depende de detalhes da superclasse. Na composição, a classe só usa outro objeto pelo que ele oferece, e trocar esse objeto é mais simples.');

select pg_temp.q('Paradigmas de Orientação a Objetos', 'Difícil',
  'O que é **acoplamento** entre classes?',
  'O quanto uma classe depende de outras', 'O número de métodos de uma classe', 'A quantidade de objetos criados durante a execução do programa', 'A ligação entre o programa e o banco de dados, feita pelo driver',
  'Quanto menor o acoplamento, menos uma mudança em uma classe obriga a mudar as outras. O ideal é baixo acoplamento e alta coesão.');


-- ============================================================
-- Gestão de Projetos (SI e ES)
-- ============================================================
select pg_temp.q('Gestão de Projetos', 'Fácil',
  'O que caracteriza um **projeto**?',
  'Um esforço temporário para criar um resultado único', 'Uma atividade que se repete todos os dias da mesma forma', 'Um departamento fixo da empresa', 'Um contrato de trabalho',
  'O projeto tem início e fim e gera algo único (um sistema, um evento). O que se repete sempre do mesmo jeito é operação, não projeto.');

select pg_temp.q('Gestão de Projetos', 'Fácil',
  'Quais são os três lados do **triângulo de ferro** (tripla restrição) de um projeto?',
  'Escopo, prazo e custo', 'Equipe, sala e computador', 'Cliente, fornecedor e governo', 'Início, meio e fim',
  'Mudar um lado afeta os outros: aumentar o escopo, por exemplo, exige mais prazo ou mais custo para manter a qualidade.');

select pg_temp.q('Gestão de Projetos', 'Fácil',
  'O que é o **escopo** de um projeto?',
  'O que será entregue e o trabalho necessário para isso', 'O dinheiro disponível para pagar a equipe e os fornecedores', 'A lista de pessoas da equipe com os seus cargos e salários', 'O dia da entrega',
  'O escopo define o que está dentro e o que está fora do projeto. Escopo mal definido é uma das principais causas de atraso.');

select pg_temp.q('Gestão de Projetos', 'Fácil',
  'Qual documento **autoriza formalmente** o início de um projeto, segundo o PMBOK?',
  'Termo de abertura do projeto', 'Ata de reunião', 'Relatório de lições aprendidas', 'Contrato de trabalho',
  'O termo de abertura (project charter) nomeia o gerente, resume os objetivos e dá autoridade para usar os recursos.');

select pg_temp.q('Gestão de Projetos', 'Fácil',
  'Quem é um **stakeholder** (parte interessada)?',
  'Qualquer pessoa ou grupo afetado pelo projeto', 'Apenas o patrocinador que paga e aprova o projeto', 'Só os programadores da equipe', 'O fornecedor de computadores escolhido para o projeto',
  'Stakeholders incluem clientes, usuários, equipe, patrocinador e até quem é afetado indiretamente, como outros setores da empresa.');

select pg_temp.q('Gestão de Projetos', 'Fácil',
  'Qual gráfico mostra as tarefas de um projeto em **barras ao longo do tempo**?',
  'Gráfico de Gantt', 'Gráfico de pizza', 'Histograma de frequência', 'Diagrama de classes',
  'No Gantt, cada tarefa é uma barra que começa e termina em datas; fica fácil ver o que acontece em paralelo e o que depende do quê.');

select pg_temp.q('Gestão de Projetos', 'Médio',
  'O que é a **EAP** (Estrutura Analítica do Projeto)?',
  'A divisão do trabalho do projeto em partes menores e gerenciáveis', 'O orçamento detalhado do projeto, mês a mês e por cada área da empresa', 'A lista de riscos do projeto, com a probabilidade e o impacto de cada um', 'O cronograma de férias da equipe',
  'A EAP quebra o projeto em entregas e pacotes de trabalho. É a partir dela que se estimam prazos e custos.');

select pg_temp.q('Gestão de Projetos', 'Médio',
  'O que é o **caminho crítico** de um projeto?',
  'A sequência de tarefas que define o prazo mínimo do projeto', 'A lista das tarefas mais caras, que precisam de aprovação do patrocinador', 'O caminho que o gerente percorre para aprovar cada entrega com o cliente', 'As tarefas que têm folga',
  'As tarefas do caminho crítico não têm folga: se uma atrasa, o projeto inteiro atrasa.');

select pg_temp.q('Gestão de Projetos', 'Médio',
  'Em gestão de riscos, o que significa **mitigar** um risco?',
  'Reduzir a probabilidade ou o impacto do risco', 'Ignorar o risco e seguir o plano como se ele não existisse', 'Passar o risco para outra empresa, como uma seguradora', 'Aceitar o risco sem preparar nenhuma resposta para ele',
  'Mitigar é agir para diminuir o risco (ex.: fazer backup). Passar para outra empresa é transferir; seguir sem fazer nada é aceitar.');

select pg_temp.q('Gestão de Projetos', 'Médio',
  'No Valor Agregado, o que indica um **CPI menor que 1**?',
  'Que o projeto está gastando mais do que o planejado para o trabalho feito', 'Que o projeto está adiantado', 'Que o projeto está abaixo do orçamento', 'Que está dentro do prazo e do custo previstos',
  'CPI = valor agregado ÷ custo real. Abaixo de 1, cada real gasto está entregando menos de um real de trabalho.');

select pg_temp.q('Gestão de Projetos', 'Médio',
  'Qual a principal diferença entre a **gestão tradicional (cascata) e a ágil**?',
  'A ágil entrega em ciclos curtos e aceita mudanças no caminho', 'A cascata entrega em ciclos curtos e aceita mudanças no caminho', 'A ágil não tem planejamento nenhum e dispensa qualquer documentação', 'A cascata não usa documentação',
  'Na cascata, cada fase termina antes da próxima começar. No ágil, o produto cresce em incrementos e o plano é revisto a cada ciclo.');

select pg_temp.q('Gestão de Projetos', 'Difícil',
  'Uma tarefa tem **folga total zero**. O que isso significa?',
  'Qualquer atraso nela atrasa o projeto inteiro', 'Ela pode ser feita a qualquer momento', 'Ela não tem nenhum custo', 'Ela já foi concluída antes do prazo previsto no cronograma',
  'Folga é quanto a tarefa pode atrasar sem atrasar o projeto. Folga zero significa que ela está no caminho crítico.');

select pg_temp.q('Gestão de Projetos', 'Difícil',
  'No Valor Agregado, o que indica um **SPI de 0,8**?',
  'O projeto fez 80% do trabalho que deveria ter feito até agora', 'O projeto gastou 80% do orçamento previsto para todo o período', 'O projeto está 20% adiantado em relação ao cronograma planejado', 'Faltam 80% das tarefas',
  'SPI = valor agregado ÷ valor planejado. Com 0,8, o projeto está atrasado: entregou só 80% do previsto para esta data.');

select pg_temp.q('Gestão de Projetos', 'Difícil',
  'Contratar um **seguro** é qual estratégia de resposta a riscos?',
  'Transferir', 'Mitigar', 'Aceitar', 'Eliminar (evitar)',
  'Com o seguro, o impacto financeiro passa para a seguradora: é transferir o risco. Ele continua podendo acontecer.');

select pg_temp.q('Gestão de Projetos', 'Difícil',
  'Na estimativa de três pontos (**PERT**), como se calcula a duração esperada?',
  '(Otimista + 4 × Mais provável + Pessimista) ÷ 6', '(Otimista + Pessimista) ÷ 2', 'Mais provável × 3', '(Otimista + Mais provável + Pessimista) ÷ 3 × 2',
  'O PERT dá peso 4 ao valor mais provável. Ex.: otimista 2, provável 4, pessimista 12 → (2 + 16 + 12) ÷ 6 = 5 dias.');


-- ============================================================
-- Inteligência de Negócios (SI e ES)
-- ============================================================
select pg_temp.q('Inteligência de Negócios', 'Fácil',
  'Qual é o objetivo principal do **BI (Business Intelligence)**?',
  'Transformar dados em informações para apoiar decisões', 'Guardar backups dos sistemas da empresa em servidores na nuvem', 'Criar sites de vendas', 'Proteger a rede da empresa contra ataques e vírus vindos da internet',
  'O BI junta dados de vários sistemas e os mostra em relatórios e painéis para que gestores decidam com base em fatos.');

select pg_temp.q('Inteligência de Negócios', 'Fácil',
  'O que é um **dashboard**?',
  'Um painel que mostra os principais indicadores em gráficos', 'Um banco de dados de backup com os dados de todos os setores', 'Um tipo de planilha sem fórmulas, usada só para digitar os dados', 'Um relatório em texto, sem gráficos, enviado por e-mail toda semana',
  'O dashboard reúne os números mais importantes em uma tela só. O painel do administrador do EduGuru é um exemplo.');

select pg_temp.q('Inteligência de Negócios', 'Fácil',
  'O que significa a sigla **KPI**?',
  'Indicador-chave de desempenho', 'Índice de preço do produto', 'Chave primária de informação', 'Programa de integração de dados',
  'KPI (Key Performance Indicator) é um número que mostra se um objetivo está sendo alcançado, como a taxa de acertos da turma.');

select pg_temp.q('Inteligência de Negócios', 'Fácil',
  'Qual a diferença entre **dado e informação**?',
  'Informação é o dado organizado e com significado', 'Não há diferença', 'Dado é sempre um número; informação é sempre um texto', 'Informação é o dado guardado no banco, e dado é o que está no papel',
  '"7" é um dado. "A média da turma em Banco de Dados é 7" é informação: o dado ganhou contexto e passou a servir para decidir.');

select pg_temp.q('Inteligência de Negócios', 'Fácil',
  'O que é um **data warehouse**?',
  'Um repositório que reúne dados de vários sistemas para análise', 'Um depósito físico onde ficam guardados os servidores da empresa', 'Um banco de dados usado só para registrar as vendas do dia, em tempo real', 'Um programa de planilhas',
  'O data warehouse recebe cópias organizadas dos dados dos sistemas da empresa e guarda o histórico para consultas de análise.');

select pg_temp.q('Inteligência de Negócios', 'Fácil',
  'Qual gráfico é mais indicado para mostrar a **evolução de um valor ao longo dos meses**?',
  'Gráfico de linhas', 'Gráfico de pizza', 'Mapa de calor por região', 'Tabela com os nomes dos clientes',
  'O gráfico de linhas mostra tendência no tempo. A pizza serve para mostrar partes de um todo em um único momento.');

select pg_temp.q('Inteligência de Negócios', 'Médio',
  'O que significa a sigla **ETL**?',
  'Extrair, transformar e carregar', 'Editar, testar e lançar', 'Entrada, tratamento e listagem de relatórios', 'Exportar tabelas para o Linux',
  'O ETL tira os dados dos sistemas de origem, limpa e padroniza, e carrega no data warehouse.');

select pg_temp.q('Inteligência de Negócios', 'Médio',
  'Qual a diferença entre **OLTP e OLAP**?',
  'OLTP registra as operações do dia a dia; OLAP analisa grandes volumes de dados', 'OLAP registra as operações do dia a dia; OLTP analisa grandes volumes de dados', 'OLTP é mais seguro que OLAP', 'Não há diferença',
  'OLTP é o sistema que grava cada venda ou cada resposta do quiz. OLAP é o lado da análise, com consultas que somam milhares de linhas.');

select pg_temp.q('Inteligência de Negócios', 'Médio',
  'No modelo dimensional, o que fica na **tabela fato**?',
  'As medidas do negócio, como o valor e a quantidade vendida', 'As descrições, como o nome do cliente, do produto e da loja onde comprou', 'Os usuários que podem acessar o data warehouse e as suas senhas', 'Os backups diários',
  'A tabela fato guarda os números (medidas) e as chaves das dimensões. As descrições ficam nas tabelas de dimensão.');

select pg_temp.q('Inteligência de Negócios', 'Médio',
  'O que é fazer um **drill-down** em uma análise?',
  'Detalhar um dado, como ir do ano para o mês', 'Apagar dados antigos', 'Exportar o relatório para PDF', 'Juntar os dados de vários anos em um único total geral do período',
  'Drill-down desce para mais detalhe (ano → mês → dia). O caminho contrário, de juntar em totais maiores, é o roll-up.');

select pg_temp.q('Inteligência de Negócios', 'Médio',
  'Qual esquema dimensional tem a tabela fato no centro ligada **diretamente** às dimensões?',
  'Esquema estrela', 'Esquema floco de neve', 'Esquema relacional normalizado na 3FN', 'Esquema em árvore',
  'No esquema estrela, cada dimensão é uma tabela só, ligada direto ao fato. No floco de neve, as dimensões são divididas em mais tabelas.');

select pg_temp.q('Inteligência de Negócios', 'Difícil',
  'Por que um data warehouse costuma ser **desnormalizado**?',
  'Para as consultas de análise ficarem mais simples e rápidas', 'Para economizar espaço em disco, já que os dados não se repetem', 'Porque a normalização é proibida em bancos de dados usados para relatórios gerenciais', 'Para impedir alterações',
  'Com menos tabelas para juntar, as consultas de análise ficam mais rápidas. Em troca, há repetição de dados, que no data warehouse é aceitável.');

select pg_temp.q('Inteligência de Negócios', 'Difícil',
  'O que é uma **dimensão de mudança lenta (SCD)**?',
  'Uma dimensão cujos atributos mudam com o tempo, como o endereço do cliente', 'Uma consulta que demora muito', 'Uma tabela fato sem índices', 'Uma dimensão que só é atualizada uma vez por ano, no fechamento do balanço',
  'Quando o cliente muda de cidade, o data warehouse precisa decidir se sobrescreve o valor ou guarda o histórico (com uma nova linha e datas de validade).');

select pg_temp.q('Inteligência de Negócios', 'Difícil',
  'O que é o **grão** de uma tabela fato?',
  'O nível de detalhe de cada linha, como uma venda por item', 'O tamanho do arquivo do banco de dados, medido em gigabytes por dia', 'A quantidade de dimensões', 'O número de usuários que consultam o data warehouse ao mesmo tempo',
  'Definir o grão é o primeiro passo do modelo: cada linha representa o quê? Uma venda, um item da venda, um dia de vendas?');

select pg_temp.q('Inteligência de Negócios', 'Difícil',
  'O que a **mineração de dados** procura?',
  'Padrões e relações escondidos em grandes volumes de dados', 'Erros de digitação nos formulários', 'Arquivos apagados por engano para recuperar do backup', 'Servidores com espaço livre',
  'A mineração usa estatística e aprendizado de máquina para achar padrões, como "quem compra A costuma comprar B".');


-- ============================================================
-- Governança de TI (ADS)
-- ============================================================
select pg_temp.q('Governança de TI', 'Fácil',
  'Qual é o objetivo da **governança de TI**?',
  'Alinhar a TI aos objetivos do negócio', 'Consertar os computadores com defeito o mais rápido possível', 'Comprar sempre os equipamentos mais caros do mercado', 'Programar os sistemas usados pela empresa',
  'Governança garante que os investimentos em TI gerem valor para a organização, com riscos controlados.');

select pg_temp.q('Governança de TI', 'Fácil',
  'O **ITIL** é um conjunto de boas práticas para quê?',
  'Gerenciamento de serviços de TI', 'Programação em Java', 'Contabilidade de empresas de tecnologia', 'Design de interfaces',
  'O ITIL descreve como planejar, entregar e melhorar serviços de TI, como suporte, gestão de incidentes e de mudanças.');

select pg_temp.q('Governança de TI', 'Fácil',
  'O **COBIT** é um modelo voltado principalmente para quê?',
  'Governança e gestão da TI', 'Desenvolvimento de jogos', 'Configuração de roteadores', 'Edição de vídeos',
  'O COBIT organiza objetivos e práticas para governar e gerir a TI, ligando as ações da TI às metas da empresa.');

select pg_temp.q('Governança de TI', 'Fácil',
  'O que é um **SLA**?',
  'Um acordo de nível de serviço', 'Um tipo de servidor de alta disponibilidade', 'Uma linguagem de programação para bancos de dados', 'Um antivírus corporativo instalado nos servidores',
  'O SLA (Service Level Agreement) define o que o cliente pode esperar do serviço, como "99,9% de disponibilidade" ou "resposta em até 4 horas".');

select pg_temp.q('Governança de TI', 'Fácil',
  'No ITIL, qual a diferença entre **incidente e problema**?',
  'Problema é a causa de um ou mais incidentes', 'Incidente é a causa de um ou mais problemas', 'São a mesma coisa', 'Problema é sempre de hardware',
  'Incidente é a interrupção (o sistema caiu). Problema é a causa por trás dela, investigada para que o incidente não se repita.');

select pg_temp.q('Governança de TI', 'Fácil',
  'Qual norma trata da **gestão de segurança da informação**?',
  'ISO/IEC 27001', 'ISO 9001', 'ISO 14001', 'IEEE 802.11 (Wi-Fi)',
  'A ISO/IEC 27001 define o sistema de gestão de segurança da informação. A 9001 é de qualidade e a 14001, de gestão ambiental.');

select pg_temp.q('Governança de TI', 'Médio',
  'Para que serve a **matriz RACI**?',
  'Definir quem é responsável, aprova, é consultado e é informado em cada atividade', 'Calcular o retorno financeiro dos projetos', 'Listar os riscos de segurança', 'Classificar os servidores da empresa pela quantidade de memória e de disco disponíveis',
  'RACI = Responsible (executa), Accountable (aprova e responde), Consulted (é consultado) e Informed (é informado). Evita tarefa sem dono.');

select pg_temp.q('Governança de TI', 'Médio',
  'No ITIL, o que é o **gerenciamento de mudanças**?',
  'Controlar as alterações nos serviços para reduzir os riscos', 'Trocar a equipe de TI todo ano', 'Mudar os sistemas sempre que o usuário pedir, sem análise', 'Mudar a empresa de endereço',
  'Cada mudança é avaliada, aprovada, planejada e registrada antes de entrar em produção, para não derrubar um serviço por descuido.');

select pg_temp.q('Governança de TI', 'Médio',
  'O que é **TI verde**?',
  'Usar a TI reduzindo o consumo de energia e o impacto ambiental', 'Pintar os servidores de verde', 'Comprar só computadores novos, que sempre gastam menos energia que os antigos', 'Uma área da TI que cuida apenas das plantas do escritório e da jardinagem',
  'Exemplos: desligar equipamentos ociosos, usar servidores virtualizados ou em nuvem e descartar o lixo eletrônico corretamente.');

select pg_temp.q('Governança de TI', 'Médio',
  'Em governança, o que é **compliance**?',
  'Estar de acordo com leis, normas e políticas', 'Um software de contabilidade usado em auditorias', 'Uma auditoria feita pelos próprios programadores no fim de cada sprint', 'Um tipo de contrato de trabalho para a equipe de TI terceirizada',
  'Compliance é cumprir as regras externas (como a LGPD) e internas (políticas da empresa) e conseguir comprovar isso.');

select pg_temp.q('Governança de TI', 'Médio',
  'Qual é a função do **catálogo de serviços** de TI?',
  'Listar os serviços oferecidos aos usuários', 'Listar os preços dos computadores e dos programas comprados', 'Guardar as senhas dos usuários com segurança', 'Registrar os incidentes já resolvidos e as soluções aplicadas',
  'O catálogo mostra o que a TI oferece (e-mail, acesso à rede, suporte), para quem e em quais condições.');

select pg_temp.q('Governança de TI', 'Difícil',
  'No COBIT, qual a diferença entre **governança e gestão**?',
  'A governança define a direção e avalia; a gestão planeja e executa', 'A gestão define a direção e avalia; a governança planeja e executa', 'São sinônimos', 'A governança cuida só do orçamento',
  'A governança (conselho, diretoria) avalia, direciona e monitora. A gestão (gerentes) planeja, constrói, executa e acompanha no dia a dia.');

select pg_temp.q('Governança de TI', 'Difícil',
  'Qual é o objetivo de um **plano de continuidade de negócios**?',
  'Manter as atividades essenciais funcionando durante e após um desastre', 'Planejar as férias da equipe', 'Definir o plano de carreira e os salários da equipe de TI', 'Trocar todos os equipamentos a cada dois anos',
  'O plano define o que fazer se um incêndio, uma enchente ou um ataque derrubar os sistemas, para a empresa continuar funcionando.');

select pg_temp.q('Governança de TI', 'Difícil',
  'O que mede o **RTO** (Recovery Time Objective)?',
  'O tempo máximo aceitável para restabelecer um serviço', 'A quantidade máxima de dados que se aceita perder em uma falha', 'O tempo de vida útil de um servidor', 'O tempo médio entre duas falhas de um equipamento, em horas de uso',
  'O RTO diz em quanto tempo o serviço precisa voltar. A quantidade de dados que se aceita perder é o RPO.');

select pg_temp.q('Governança de TI', 'Difícil',
  'Por que a **segregação de funções** é importante?',
  'Para que uma mesma pessoa não controle sozinha um processo crítico', 'Para que cada pessoa trabalhe em uma sala separada e sem interrupções', 'Para dividir o salário', 'Para que os programadores publiquem o próprio código em produção sem revisão',
  'Quem desenvolve não aprova sozinho a própria mudança em produção; quem pede um pagamento não é quem o autoriza. Isso reduz erros e fraudes.');
