-- ============================================================
-- EduGuru — 29: mais 5 disciplinas no quiz (5 × 15 = 75 perguntas)
--   Banco de Dados Avançado (SI), Métodos Ágeis (ES), Inteligência Artificial (ES),
--   Implementação e Testes de Projetos de Software (ADS) e
--   Desenvolvimento de Aplicações (ES). Todas já existem na grade (script 13) e
--   estão ligadas às áreas de carreira (script 17): Dados, Gestão e Produto,
--   Inteligência Artificial, Qualidade e Testes e Full Stack.
--   Em cada disciplina: 6 Fácil, 5 Médio e 4 Difícil, todas com explicação.
--   As alternativas foram escritas para a certa NÃO ser sempre a mais longa
--   (teste: testes/compartilhado/perguntasEquilibradas.test.ts).
-- Em cada pergunta, a PRIMEIRA alternativa é a correta (a ordem é sorteada ao
-- gravar) e o último texto é a explicação mostrada depois da resposta.
-- Rodar depois do 28. Pode ser rodado de novo.
-- ============================================================


-- Função temporária (só existe durante este script). Igual à do script 28.
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
-- Banco de Dados Avançado (SI)
-- ============================================================
select pg_temp.q('Banco de Dados Avançado', 'Fácil',
  'O que é uma **transação** em um banco de dados?',
  'Um conjunto de operações que é feito por inteiro ou não é feito', 'Uma consulta que só lê dados, sem alterar nada', 'Uma cópia do banco feita toda noite', 'Uma tabela temporária criada pelo usuário',
  'Na transação, ou todas as operações dão certo, ou nenhuma vale. Exemplo: em uma transferência, tirar de uma conta e pôr na outra acontecem juntos.');

select pg_temp.q('Banco de Dados Avançado', 'Fácil',
  'Qual comando **confirma de vez** as alterações de uma transação?',
  'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'BEGIN WORK',
  'COMMIT grava de vez. ROLLBACK desfaz, SAVEPOINT marca um ponto intermediário e BEGIN (ou BEGIN WORK) inicia a transação.');

select pg_temp.q('Banco de Dados Avançado', 'Fácil',
  'Qual comando **desfaz** as alterações de uma transação ainda não confirmada?',
  'ROLLBACK', 'COMMIT', 'DELETE', 'TRUNCATE',
  'O ROLLBACK volta tudo ao estado de antes do BEGIN. DELETE e TRUNCATE apagam linhas, não desfazem uma transação.');

select pg_temp.q('Banco de Dados Avançado', 'Fácil',
  'O que é uma **view** (visão)?',
  'Uma consulta salva que pode ser usada como se fosse uma tabela', 'Uma cópia física de uma tabela, atualizada a cada minuto', 'Uma tela do sistema que mostra os dados ao usuário final', 'Um índice criado automaticamente pelo banco em toda tabela nova',
  'A view guarda só a consulta, não os dados: toda vez que é lida, a consulta roda de novo. Serve para simplificar consultas e esconder colunas.');

select pg_temp.q('Banco de Dados Avançado', 'Fácil',
  'O que garante o **D (durabilidade)** das propriedades ACID?',
  'Que uma transação confirmada não se perde, mesmo se o servidor cair', 'Que os dados duram no máximo 90 dias', 'Que duas transações não se misturam', 'Que o banco aceita dados de qualquer tipo em qualquer coluna, sem validação',
  'Depois do COMMIT, a alteração está gravada de forma permanente (no disco e no log do banco), mesmo que a energia acabe logo em seguida.');

select pg_temp.q('Banco de Dados Avançado', 'Fácil',
  'Para que serve um **trigger** (gatilho)?',
  'Executar uma ação automática quando uma linha é inserida, alterada ou excluída', 'Agendar backups', 'Criar usuários novos no banco e definir as senhas iniciais de cada um', 'Acelerar as consultas lentas guardando os resultados na memória do servidor',
  'O EduGuru usa gatilhos para gravar o log de auditoria e para aplicar o filtro de materiais, sem depender do código da tela.');

select pg_temp.q('Banco de Dados Avançado', 'Médio',
  'O que significa o **I (isolamento)** das propriedades ACID?',
  'Transações ao mesmo tempo não enxergam o trabalho incompleto umas das outras', 'Cada tabela fica em um arquivo separado no disco', 'O banco fica isolado da internet e só aceita conexões vindas da rede interna', 'Cada usuário só pode abrir uma transação por dia',
  'Com isolamento, duas pessoas alterando dados ao mesmo tempo não veem o meio do caminho uma da outra, como se as transações rodassem uma de cada vez.');

select pg_temp.q('Banco de Dados Avançado', 'Médio',
  'Qual a diferença entre **DELETE e TRUNCATE**?',
  'TRUNCATE esvazia a tabela inteira de uma vez; DELETE pode apagar só algumas linhas', 'DELETE apaga a tabela inteira com a estrutura; TRUNCATE apaga só algumas linhas', 'Não há diferença', 'TRUNCATE só funciona em tabelas vazias',
  'DELETE aceita WHERE e apaga linha por linha (disparando gatilhos). TRUNCATE esvazia tudo de uma vez, mais rápido. Nenhum dos dois apaga a estrutura: isso é o DROP.');

select pg_temp.q('Banco de Dados Avançado', 'Médio',
  'Para que serve uma **função de janela**, como RANK() OVER (...)?',
  'Calcular um valor para cada linha olhando as linhas vizinhas, sem agrupar', 'Abrir uma janela no navegador com o resultado', 'Juntar duas tabelas pela chave estrangeira, como um JOIN que nunca devolve nulos', 'Apagar linhas repetidas',
  'Diferente do GROUP BY, a função de janela não junta as linhas. O ranking do EduGuru usa rank() over (order by pontos desc) para dar a posição de cada aluno.');

select pg_temp.q('Banco de Dados Avançado', 'Médio',
  'O que é uma **função armazenada** (stored procedure) no banco?',
  'Um bloco de código guardado no banco e executado lá dentro', 'Um arquivo de backup', 'Um tipo de índice que guarda os dados ordenados por data de criação', 'Um usuário com permissão de administrador sobre todas as tabelas do banco',
  'As regras do quiz do EduGuru (iniciar_quiz, responder_pergunta) são funções do banco: rodam no servidor, onde o aluno não consegue mexer.');

select pg_temp.q('Banco de Dados Avançado', 'Médio',
  'O que é um **deadlock** entre transações?',
  'Duas transações esperando uma pela outra para liberar um bloqueio', 'Uma transação que demorou mais de um minuto', 'Um erro de digitação no comando SQL que trava o editor', 'Quando o disco do servidor fica cheio e o banco para de gravar novos dados',
  'A transação A bloqueia a linha 1 e espera a 2; a B bloqueia a 2 e espera a 1. O banco percebe o impasse e cancela uma delas.');

select pg_temp.q('Banco de Dados Avançado', 'Difícil',
  'O que é uma **leitura suja** (dirty read)?',
  'Ler dados de outra transação que ainda não foram confirmados', 'Ler uma tabela sem índice', 'Ler dados que foram apagados há mais de 90 dias pelo processo de limpeza automática', 'Ler dados de outro banco de dados, em outro servidor da empresa',
  'Se a outra transação fizer ROLLBACK, o dado lido nunca existiu de verdade. O PostgreSQL não permite leitura suja em nenhum nível de isolamento.');

select pg_temp.q('Banco de Dados Avançado', 'Difícil',
  'Em uma consulta lenta, para que serve o **EXPLAIN**?',
  'Mostrar o plano de execução que o banco vai usar', 'Explicar o erro de sintaxe ao usuário', 'Gerar a documentação das tabelas automaticamente para a equipe', 'Traduzir a consulta SQL para linguagem natural, em português',
  'O EXPLAIN mostra se o banco vai ler a tabela inteira ou usar um índice, e quanto cada etapa custa. É o primeiro passo para otimizar uma consulta.');

select pg_temp.q('Banco de Dados Avançado', 'Difícil',
  'O que é uma **view materializada**?',
  'Uma view cujo resultado fica gravado e precisa ser atualizado', 'Uma view que só o administrador pode ler', 'Uma tabela criada a partir de um arquivo CSV enviado pelo usuário', 'Uma view sem nenhum filtro',
  'A view materializada guarda o resultado, então a leitura é rápida; em troca, os dados ficam desatualizados até rodar REFRESH MATERIALIZED VIEW.');

select pg_temp.q('Banco de Dados Avançado', 'Difícil',
  'Por que um índice pode **atrapalhar** uma tabela que recebe muitas gravações?',
  'Porque cada inserção também precisa atualizar o índice', 'Porque o índice apaga dados antigos', 'Porque o índice impede consultas com WHERE e ORDER BY na mesma coluna', 'Porque o índice bloqueia a tabela inteira para leitura enquanto existe',
  'O índice acelera a leitura, mas cada INSERT, UPDATE e DELETE também precisa mexer nele. Em tabelas com muita gravação, índices demais deixam tudo mais lento.');


-- ============================================================
-- Métodos Ágeis (ES)
-- ============================================================
select pg_temp.q('Métodos Ágeis', 'Fácil',
  'Qual documento reúne os **valores e princípios** do desenvolvimento ágil?',
  'Manifesto Ágil', 'PMBOK', 'ISO 9001', 'Guia do Scrum',
  'O Manifesto Ágil (2001) traz 4 valores e 12 princípios. O Guia do Scrum descreve só o Scrum, que é um dos métodos ágeis.');

select pg_temp.q('Métodos Ágeis', 'Fácil',
  'Segundo o Manifesto Ágil, o que é **mais valorizado**?',
  'Software em funcionamento', 'Documentação abrangente', 'Seguir um plano à risca', 'Negociação de contratos detalhados com o cliente',
  'O Manifesto valoriza software funcionando mais que documentação, colaboração mais que contratos e resposta a mudanças mais que seguir um plano.');

select pg_temp.q('Métodos Ágeis', 'Fácil',
  'No Scrum, quem é responsável por **priorizar o Product Backlog**?',
  'Product Owner', 'Scrum Master', 'Desenvolvedores', 'Cliente final do sistema',
  'O Product Owner decide a ordem do backlog, pensando no valor para o negócio. O cliente participa, mas quem responde pela prioridade é o PO.');

select pg_temp.q('Métodos Ágeis', 'Fácil',
  'Qual é o papel do **Scrum Master**?',
  'Ajudar o time a seguir o Scrum e remover impedimentos', 'Mandar nas tarefas de cada desenvolvedor', 'Escrever todo o código do sistema', 'Aprovar o orçamento e o prazo final do projeto junto ao cliente',
  'O Scrum Master não é chefe: ele facilita os eventos, ensina o Scrum e tira do caminho o que atrapalha o time.');

select pg_temp.q('Métodos Ágeis', 'Fácil',
  'Quanto tempo dura, no máximo, a **Daily Scrum**?',
  '15 minutos', '1 hora e meia', '30 minutos', 'Um dia inteiro',
  'A Daily é curta: 15 minutos para o time combinar o trabalho do dia. Discussões longas ficam para depois, só com quem precisa.');

select pg_temp.q('Métodos Ágeis', 'Fácil',
  'O que é uma **user story** (história de usuário)?',
  'Uma necessidade descrita do ponto de vista de quem usa o sistema', 'Um manual do usuário', 'Um diagrama de classes', 'Uma história contada na reunião de encerramento do projeto',
  'A história descreve o que o usuário precisa e por quê, em linguagem simples, sem entrar em detalhes técnicos.');

select pg_temp.q('Métodos Ágeis', 'Médio',
  'Qual é o formato mais comum de uma **user story**?',
  'Como [usuário], quero [ação] para [benefício]', 'Se [condição], então [resultado]', 'Dado [contexto], quando [ação], então [resultado]', '[Nome da tela] – [botão] – [mensagem de erro]',
  'Ex.: "Como aluno, quero ver minhas notas para saber se preciso de exame". O formato "Dado, quando, então" é usado nos critérios de aceite, não na história.');

select pg_temp.q('Métodos Ágeis', 'Médio',
  'Para que serve a **Retrospectiva** da sprint?',
  'Melhorar a forma de trabalhar do time na próxima sprint', 'Apresentar o produto ao cliente', 'Planejar todas as tarefas do próximo ano junto com o cliente', 'Avaliar o desempenho individual de cada desenvolvedor para definir aumentos',
  'Na Retrospectiva o time olha para o próprio processo: o que funcionou, o que não funcionou e o que vai mudar. Apresentar o produto é a Sprint Review.');

select pg_temp.q('Métodos Ágeis', 'Médio',
  'O que é a **Definition of Done** (Definição de Pronto)?',
  'Os critérios que um item precisa cumprir para ser considerado pronto', 'A data de entrega final', 'A lista de bugs abertos', 'O documento que o cliente assina no fim do projeto, liberando o pagamento final',
  'Ex.: código revisado, testes passando e publicado. Com a definição combinada, ninguém chama de "pronto" algo que ainda falta testar.');

select pg_temp.q('Métodos Ágeis', 'Médio',
  'O que medem os **story points**?',
  'O esforço relativo de um item', 'As horas exatas que cada tarefa vai levar', 'A quantidade de linhas de código', 'A nota que o cliente dá para cada funcionalidade entregue',
  'Os pontos comparam itens entre si (este é o dobro daquele), sem prometer horas. Costumam seguir a sequência 1, 2, 3, 5, 8, 13.');

select pg_temp.q('Métodos Ágeis', 'Médio',
  'O que mostra o **gráfico de burndown**?',
  'O trabalho que ainda falta ao longo da sprint', 'Os bugs que causaram falhas no servidor durante a sprint', 'As horas extras da equipe', 'A temperatura dos servidores do data center durante a sprint',
  'A linha desce conforme o trabalho é concluído. Se ela fica acima da linha ideal, o time está atrasado em relação ao planejado.');

select pg_temp.q('Métodos Ágeis', 'Difícil',
  'Qual a diferença entre **Scrum e Kanban** quanto ao tempo?',
  'O Scrum trabalha em sprints fixas; o Kanban tem fluxo contínuo', 'O Kanban trabalha em sprints fixas; o Scrum tem fluxo contínuo', 'Os dois usam sprints de exatamente duas semanas', 'O Kanban não permite mudar a prioridade das tarefas',
  'No Scrum, o trabalho é planejado em ciclos de tamanho fixo. No Kanban, as tarefas entram e saem a qualquer momento, controladas pelo limite de WIP.');

select pg_temp.q('Métodos Ágeis', 'Difícil',
  'O que é a **velocity** (velocidade) de um time Scrum?',
  'Quantos pontos o time costuma entregar por sprint', 'A velocidade da internet do escritório', 'Quantas linhas de código cada pessoa escreve por hora de trabalho', 'O tempo que o servidor leva para responder às requisições dos usuários',
  'A velocity é a média de pontos entregues nas últimas sprints. Serve para o time planejar quanto cabe na próxima, não para comparar times.');

select pg_temp.q('Métodos Ágeis', 'Difícil',
  'No XP (Extreme Programming), o que é **programação em par**?',
  'Duas pessoas no mesmo código, uma escreve e a outra revisa', 'Dois times desenvolvendo o mesmo sistema em paralelo', 'Programar só em pares de arquivos .h e .c', 'Cada programador revisar o código do colega uma vez por mês, no fim da sprint',
  'Em par, um digita (piloto) e o outro acompanha e pensa no todo (navegador), trocando de papel. A revisão acontece na hora, e o conhecimento se espalha.');

select pg_temp.q('Métodos Ágeis', 'Difícil',
  'O que é **TDD** (Test-Driven Development)?',
  'Escrever o teste antes do código que o faz passar', 'Testar o sistema só no fim do projeto', 'Deixar os testes para a equipe de qualidade fazer depois da entrega', 'Escrever o código e depois gerar os testes automaticamente com uma ferramenta',
  'O ciclo do TDD é: escrever um teste que falha (vermelho), o código mínimo para passar (verde) e melhorar o código (refatorar).');


-- ============================================================
-- Inteligência Artificial (ES)
-- ============================================================
select pg_temp.q('Inteligência Artificial', 'Fácil',
  'O que é **aprendizado de máquina** (machine learning)?',
  'Fazer o computador aprender padrões a partir de dados', 'Ensinar o usuário a usar o computador e os programas básicos', 'Montar as peças de um computador para treinar modelos maiores', 'Programar uma regra fixa para cada situação possível do sistema',
  'Em vez de escrever cada regra à mão, o programa recebe muitos exemplos e ajusta um modelo que consegue prever casos novos.');

select pg_temp.q('Inteligência Artificial', 'Fácil',
  'No aprendizado **supervisionado**, os dados de treino têm o quê?',
  'A resposta certa (rótulo) de cada exemplo', 'Só imagens, vídeos e áudios, sem nenhuma descrição', 'Nenhuma informação além dos números', 'Um supervisor humano que corrige o modelo a cada nova previsão em produção',
  'Ex.: milhares de e-mails já marcados como spam ou não. O modelo aprende comparando as previsões dele com essas respostas.');

select pg_temp.q('Inteligência Artificial', 'Fácil',
  'Qual destas tarefas é um exemplo de **classificação**?',
  'Dizer se um e-mail é spam ou não', 'Prever o preço de uma casa pelo tamanho e pelo bairro', 'Agrupar clientes parecidos sem saber os grupos antes', 'Gerar uma imagem nova',
  'Classificar é escolher uma categoria (spam ou não). Prever um número, como o preço, é regressão; agrupar sem rótulos é agrupamento (clustering).');

select pg_temp.q('Inteligência Artificial', 'Fácil',
  'O que é um **chatbot**?',
  'Um programa que conversa com pessoas por texto ou voz', 'Um robô físico de limpeza', 'Um antivírus que conversa com o usuário quando acha uma ameaça', 'Um grupo de mensagens entre os alunos de uma mesma turma do curso',
  'Chatbots vão de menus simples, com respostas prontas, até assistentes com modelos de linguagem que entendem perguntas livres.');

select pg_temp.q('Inteligência Artificial', 'Fácil',
  'O que é o **conjunto de treino** (dataset) de um modelo?',
  'Os dados usados para o modelo aprender', 'O computador com placa de vídeo onde o modelo roda', 'A lista de pessoas que vão usar o sistema', 'O código-fonte do modelo',
  'A qualidade do modelo depende muito dos dados: exemplos errados ou desequilibrados ensinam coisas erradas.');

select pg_temp.q('Inteligência Artificial', 'Fácil',
  'O que é **IA generativa**?',
  'IA que cria conteúdo novo, como textos e imagens', 'IA que só classifica imagens', 'Um gerador de energia para data centers', 'IA que só responde sim ou não',
  'Modelos generativos produzem textos, imagens, código ou áudio a partir de um pedido (prompt), com base no que aprenderam.');

select pg_temp.q('Inteligência Artificial', 'Médio',
  'O que é **overfitting** (sobreajuste)?',
  'O modelo decorar o treino e errar com dados novos', 'O modelo ficar grande demais para caber na memória', 'O treino demorar mais de um dia', 'Ter mais dados de teste que de treino',
  'O modelo sobreajustado vai muito bem nos exemplos de treino e mal nos novos, como o aluno que decora a letra da resposta e não o conteúdo.');

select pg_temp.q('Inteligência Artificial', 'Médio',
  'Por que se separa um **conjunto de teste** que o modelo não vê no treino?',
  'Para medir como o modelo vai se sair com dados novos', 'Para o treino ficar mais rápido, usando menos memória e menos processador', 'Para guardar um backup dos dados', 'Para o modelo decorar as respostas antes de ser usado',
  'Se o modelo fosse avaliado com os mesmos dados do treino, um modelo que só decorou pareceria ótimo. O teste simula o uso real.');

select pg_temp.q('Inteligência Artificial', 'Médio',
  'O que é **aprendizado não supervisionado**?',
  'Encontrar grupos e padrões em dados sem rótulos', 'Treinar com dados que já têm a resposta certa', 'Um modelo que aprende sozinho, sem nenhum dado', 'Aprender com recompensas e punições a cada ação tomada em um ambiente',
  'Sem respostas prontas, o modelo procura estrutura nos dados, como agrupar alunos com desempenho parecido. Recompensas e punições são o aprendizado por reforço.');

select pg_temp.q('Inteligência Artificial', 'Médio',
  'Em uma rede neural, o que são os **pesos**?',
  'Os valores ajustados no treino que definem a força de cada ligação', 'O tamanho do arquivo do modelo, em megabytes, salvo no disco', 'A quantidade de camadas da rede', 'O número de exemplos usados no treino',
  'Treinar uma rede é ajustar os pesos aos poucos para diminuir o erro. Um modelo grande pode ter bilhões deles.');

select pg_temp.q('Inteligência Artificial', 'Médio',
  'O que é **viés** (bias) em um modelo de IA?',
  'Erros sistemáticos que vêm, por exemplo, de dados de treino desequilibrados', 'Um vírus que ataca modelos', 'A velocidade com que o modelo responde a cada pergunta que recebe do usuário', 'O custo de manter o modelo rodando na nuvem durante um mês inteiro',
  'Se os dados de treino representam mal um grupo de pessoas, o modelo tende a errar mais com esse grupo. Por isso é preciso conferir os dados e os resultados.');

select pg_temp.q('Inteligência Artificial', 'Difícil',
  'O que mede a **precisão** de um classificador?',
  'Dos itens que ele marcou como positivos, quantos eram positivos de verdade', 'Dos positivos de verdade, quantos ele encontrou', 'Quantas previsões ele fez por segundo', 'A porcentagem de acertos do modelo considerando todas as classes juntas, sem exceção',
  'Precisão = verdadeiros positivos ÷ tudo o que ele marcou como positivo. "Dos positivos, quantos encontrou" é a revocação (recall), e o acerto geral é a acurácia.');

select pg_temp.q('Inteligência Artificial', 'Difícil',
  'Para que serve a **função de ativação** em uma rede neural?',
  'Introduzir não linearidade, para a rede aprender relações complexas', 'Ligar o computador', 'Ativar a licença do software de IA comprado pela empresa', 'Escolher quais dados de treino entram na rede em cada uma das épocas',
  'Sem ativação (como ReLU ou sigmoide), várias camadas equivalem a uma só conta linear, e a rede não aprenderia padrões complexos.');

select pg_temp.q('Inteligência Artificial', 'Difícil',
  'O que é a **validação cruzada** (k-fold)?',
  'Treinar e testar o modelo k vezes, cada vez com uma parte diferente como teste', 'Pedir a k pessoas que confiram o resultado', 'Usar k modelos diferentes e escolher o mais rápido', 'Treinar o modelo k vezes com os mesmos dados para ele decorar melhor',
  'Os dados são divididos em k partes; cada uma serve de teste uma vez. A média dos resultados é uma avaliação mais confiável do que um único teste.');

select pg_temp.q('Inteligência Artificial', 'Difícil',
  'Por que **dados pessoais** no treino de uma IA preocupam a LGPD?',
  'O modelo pode memorizar e expor esses dados', 'Dados pessoais deixam o treino mais lento e caro', 'A LGPD proíbe qualquer uso de inteligência artificial no Brasil', 'Porque nomes ocupam mais espaço que números',
  'Modelos podem "lembrar" trechos do treino e repeti-los. Por isso, antes de treinar, os dados devem ser minimizados ou anonimizados, com base legal para o uso.');


-- ============================================================
-- Implementação e Testes de Projetos de Software (ADS)
-- ============================================================
select pg_temp.q('Implementação e Testes de Projetos de Software', 'Fácil',
  'O que é um **teste unitário**?',
  'Um teste que confere uma pequena parte do código, isolada', 'Um teste feito pelo usuário final', 'Um teste que só roda uma única vez', 'Um teste do sistema inteiro, com banco de dados, rede e servidor funcionando juntos',
  'O teste unitário confere uma função ou módulo sozinho, sem banco nem rede, por isso é rápido. O EduGuru testa assim o cálculo das notas, por exemplo.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Fácil',
  'O que é um **bug**?',
  'Um defeito que faz o sistema agir diferente do esperado', 'Uma nova funcionalidade', 'Um tipo de teste automatizado que roda toda noite', 'Uma versão do sistema',
  'Bug é qualquer comportamento diferente do especificado. Quanto mais cedo é encontrado, mais barato é corrigir.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Fácil',
  'O que faz um **teste de regressão**?',
  'Confere se algo que funcionava continuou funcionando', 'Volta o sistema para uma versão antiga quando um teste falha', 'Testa só o que é novo', 'Mede quantos usuários o sistema aguenta ao mesmo tempo, sem cair',
  'Toda mudança pode quebrar algo que já funcionava. Rodar os testes antigos de novo, de preferência automaticamente, pega essas regressões.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Fácil',
  'Qual ferramenta é usada nos **testes unitários** do EduGuru?',
  'Vitest', 'Postman', 'Selenium', 'Jira',
  'O EduGuru usa o Vitest, que roda os testes a cada publicação. Postman testa APIs à mão, Selenium automatiza o navegador e Jira organiza tarefas.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Fácil',
  'O que é um **caso de teste**?',
  'Entrada, passos e resultado esperado para verificar algo', 'Uma caixa onde ficam os testes', 'O relatório final do projeto, entregue ao cliente', 'Um erro encontrado em produção pelos usuários do sistema depois da entrega',
  'Ex.: entrada M1 = 10, ND = 2 e NI = 2; resultado esperado MD = 4,7 e "Em exame". Se o resultado real for diferente, o teste falha.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Fácil',
  'Para que serve o **controle de versão**, como o Git?',
  'Guardar o histórico das mudanças do código', 'Controlar a versão do sistema operacional', 'Um antivírus que analisa cada arquivo de código', 'Um programa que corrige os erros do código automaticamente antes de cada entrega',
  'Com o Git, cada mudança vira um commit: dá para ver quem mudou o quê, voltar versões e trabalhar em paralelo com branches.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Médio',
  'Qual a diferença entre teste **caixa-branca e caixa-preta**?',
  'Caixa-branca olha o código por dentro; caixa-preta testa só entradas e saídas', 'Caixa-preta olha o código por dentro; caixa-branca testa só entradas e saídas', 'Caixa-branca é feito de dia e caixa-preta, à noite', 'Não há diferença',
  'Na caixa-preta, quem testa não precisa conhecer o código, só o que o sistema deve fazer. Na caixa-branca, os testes são pensados para passar por cada caminho do código.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Médio',
  'O que é **cobertura de código**?',
  'A parte do código executada pelos testes', 'Quantos testes passaram na última execução', 'Quantas linhas o projeto tem no total, contando os testes', 'O tempo que os testes levam para rodar em todas as máquinas da equipe',
  'Cobertura alta mostra que os testes passam por quase todo o código, mas não garante que conferem o resultado certo.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Médio',
  'Para que serve um **mock** em testes?',
  'Imitar uma dependência, como uma API, para testar sem ela', 'Apagar os dados de teste', 'Medir a velocidade de cada função do código, em milissegundos', 'Esconder os erros do teste para ele passar mesmo com defeito',
  'Os testes de vagas do EduGuru usam um fetch falso para simular a API do GitHub fora do ar, sem depender da internet.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Médio',
  'O que é **integração contínua** (CI)?',
  'Rodar build e testes a cada envio de código ao repositório', 'Juntar todo o código uma vez por mês', 'Integrar o sistema com a API do GitHub para buscar vagas de emprego', 'Contratar novos desenvolvedores todo semestre para a equipe de testes',
  'No EduGuru, o GitHub Actions roda lint, testes e build a cada atualização da branch principal; se algo falhar, o site não é publicado.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Médio',
  'O que é um **teste de aceitação**?',
  'Verifica se o sistema atende aos critérios combinados com o cliente', 'Testa uma função isolada', 'Mede o consumo de memória do servidor', 'Confere se o código segue o padrão de formatação da equipe',
  'Os critérios de aceite no formato "dado, quando, então", como os dos requisitos do EduGuru, viram testes de aceitação.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Difícil',
  'No padrão **AAA** de testes, o que significam as três etapas?',
  'Arrange, Act, Assert (preparar, agir, verificar)', 'Analisar, aprovar, arquivar', 'Ajustar, aguardar, apagar', 'Abrir, alterar e atualizar o arquivo de teste no repositório',
  'Cada teste prepara os dados (Arrange), chama o que está sendo testado (Act) e confere o resultado (Assert). Isso deixa os testes fáceis de ler.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Difícil',
  'Qual a diferença entre **verificação e validação**?',
  'Verificação: construímos certo? Validação: construímos a coisa certa?', 'São a mesma coisa', 'Validação é feita só pelo programador', 'Verificação é feita só depois da entrega, pelo próprio cliente, no ambiente de produção',
  'Verificar é conferir se o sistema segue a especificação. Validar é conferir se ele resolve o problema real do usuário.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Difícil',
  'O que é um **teste instável** (flaky)?',
  'Um teste que às vezes passa e às vezes falha sem mudar o código', 'Um teste que sempre falha', 'Um teste muito lento, que leva vários minutos para terminar de rodar', 'Um teste escrito em outra linguagem, diferente da usada no sistema',
  'Testes instáveis costumam depender de horário, ordem de execução ou rede. Eles fazem a equipe deixar de confiar nos testes, por isso devem ser corrigidos.');

select pg_temp.q('Implementação e Testes de Projetos de Software', 'Difícil',
  'Por que se usa um **banco de dados separado** para os testes?',
  'Para os testes não estragarem os dados reais', 'Porque o banco real é mais rápido e não aceita consultas de teste', 'Para os testes rodarem sem internet', 'Porque a LGPD proíbe testar qualquer sistema com dados reais de qualquer pessoa',
  'Os testes criam e apagam dados à vontade. O EduGuru testa os scripts SQL em um PostgreSQL local, sem tocar no banco publicado.');


-- ============================================================
-- Desenvolvimento de Aplicações (ES)
-- ============================================================
select pg_temp.q('Desenvolvimento de Aplicações', 'Fácil',
  'O que é o **front-end** de uma aplicação?',
  'A parte que o usuário vê e usa', 'O banco de dados', 'O servidor que guarda as senhas', 'A parte do sistema que roda no servidor e conversa com o banco',
  'O front-end são as telas, que rodam no navegador. No EduGuru, ele é feito com React e TypeScript.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Fácil',
  'O que é o **back-end** de uma aplicação?',
  'A parte que roda no servidor, com as regras e os dados', 'As telas do sistema', 'O teclado e o mouse', 'O design das cores, das fontes e dos ícones das telas',
  'O back-end guarda os dados e aplica as regras que não podem ficar no navegador. No EduGuru, esse papel é do Supabase (PostgreSQL, Auth e Storage).');

select pg_temp.q('Desenvolvimento de Aplicações', 'Fácil',
  'Qual formato é o mais usado para **trocar dados** entre front-end e back-end na web?',
  'JSON', 'PDF', 'MP3', 'DOCX',
  'O JSON representa objetos em texto, como {"nome": "Ana", "pontos": 30}, e é lido facilmente pelo JavaScript.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Fácil',
  'O que é um **framework**?',
  'Uma base pronta de código que define a estrutura da aplicação', 'Uma moldura para fotos', 'Um computador mais potente', 'Um tipo de banco de dados que guarda arquivos de imagem e vídeo',
  'O framework já resolve problemas comuns (rotas, telas, acesso a dados) e diz onde o seu código entra.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Fácil',
  'O que é fazer o **deploy** de uma aplicação?',
  'Publicar a aplicação para os usuários usarem', 'Apagar a aplicação', 'Escrever a documentação do sistema para a banca', 'Testar a aplicação no computador do desenvolvedor antes de enviar',
  'O deploy leva a versão nova para o ambiente que os usuários acessam. No EduGuru, ele é automático, no GitHub Pages.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Fácil',
  'O que é uma **variável de ambiente**?',
  'Uma configuração lida fora do código, como o endereço do banco', 'Uma variável que guarda a temperatura', 'Uma variável que só existe dentro de um laço de repetição', 'Um arquivo de imagem',
  'Assim, o mesmo código roda em teste e em produção com configurações diferentes, e segredos não ficam escritos no código.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Médio',
  'O que é um **ORM**?',
  'Uma camada que mapeia tabelas do banco para objetos do código', 'Um formato de imagem', 'Um tipo de servidor de e-mail', 'Uma regra que obriga todas as tabelas a terem exatamente três colunas',
  'Com um ORM, o programador trabalha com objetos (aluno.nome) e o ORM gera o SQL. Exemplos: Prisma, Hibernate e Entity Framework.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Médio',
  'Qual a diferença entre **autenticação e autorização**?',
  'Autenticação confirma quem é; autorização decide o que pode fazer', 'Autorização confirma quem é; autenticação decide o que pode fazer', 'São a mesma coisa', 'Autenticação só existe em aplicativos de celular',
  'No EduGuru, o login com senha (e o código) é a autenticação; as regras de RLS que dizem o que aluno e administrador podem ver são a autorização.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Médio',
  'O que é **paginação** em uma API?',
  'Devolver os resultados em partes, como 100 por vez', 'Numerar as páginas de um PDF', 'Dividir o site em várias páginas HTML', 'Mostrar todos os registros do banco de uma vez, sem nenhum limite',
  'A tela de logs do EduGuru busca 100 registros por vez e o botão "Mostrar mais" carrega os próximos, sem trazer milhares de linhas de uma vez.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Médio',
  'Por que **senhas e chaves secretas** não devem ir para o repositório Git?',
  'Porque qualquer pessoa com acesso ao repositório poderia usá-las', 'Porque o Git não aceita arquivos de configuração com letras e números misturados', 'Porque deixam o deploy mais lento', 'Porque ocupam espaço',
  'O histórico do Git guarda tudo, mesmo o que foi apagado depois. Segredos ficam em variáveis de ambiente ou no cofre do servidor, como a chave do Brevo no Vault do Supabase.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Médio',
  'O que faz um **gerenciador de pacotes** como o npm?',
  'Instala e atualiza as bibliotecas que o projeto usa', 'Entrega encomendas', 'Compacta o projeto', 'Gerencia as senhas dos usuários do sistema',
  'O package.json lista as dependências e o npm install baixa todas, nas versões certas, para qualquer pessoa da equipe.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Difícil',
  'O que é **cache** em uma aplicação?',
  'Guardar um resultado para não buscar de novo', 'Apagar dados antigos do banco', 'Um tipo de erro de rede', 'Uma cópia completa do banco de dados, feita a cada hora pelo servidor',
  'O EduGuru guarda a lista de vagas por 30 minutos no navegador: abre mais rápido e continua funcionando se o GitHub sair do ar.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Difícil',
  'O que é **idempotência** em uma requisição?',
  'Repetir a mesma requisição não muda o resultado', 'A requisição sempre falha na segunda vez que é enviada', 'A requisição só funciona com o usuário logado', 'A requisição é feita uma vez por dia, de madrugada, por uma tarefa agendada',
  'Ex.: clicar duas vezes em "Candidatar-se" no EduGuru conta só um clique. Isso protege contra cliques repetidos e reenvios automáticos.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Difícil',
  'Qual destes métodos HTTP é **idempotente**?',
  'PUT', 'POST', 'PATCH', 'CONNECT',
  'Enviar o mesmo PUT várias vezes deixa o recurso igual. Repetir um POST, em geral, cria vários registros.');

select pg_temp.q('Desenvolvimento de Aplicações', 'Difícil',
  'Por que o EduGuru aplica o **filtro de materiais no banco**, e não só na tela?',
  'Porque a tela pode ser burlada chamando a API direto', 'Porque o banco é mais bonito', 'Porque o React não sabe comparar textos com acentos e símbolos', 'Porque o navegador não consegue enviar arquivos PDF maiores que 5 MB para o servidor',
  'Tudo o que roda no navegador pode ser alterado pelo usuário. Com o filtro em um gatilho do banco, até quem chama a API direto passa por ele.');
