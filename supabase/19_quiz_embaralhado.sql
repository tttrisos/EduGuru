-- ============================================================
-- EduGuru — 19: quiz embaralhado para cada aluno (contra "farmar" pontos)
--
-- O problema: as perguntas eram sorteadas, mas as alternativas ficavam sempre na
-- mesma posição. Refazendo o quiz, o aluno decorava "a certa é a C" e subia o
-- aproveitamento (que alimenta o Guru e o Carreiras) sem aprender.
--
-- O que muda (a tela Quiz.tsx NÃO muda: ela só conhece as letras que mostra):
--   1) cada rodada embaralha a ordem das alternativas de cada pergunta, só para
--      aquele aluno; a ordem fica gravada em respostas_quiz.ordem_alternativas
--      (ex.: 'CADB' = na tela, a letra A mostra a alternativa C do cadastro);
--   2) o sorteio dá preferência às perguntas que o aluno ainda NÃO acertou;
--      as já acertadas só entram para completar as 10;
--   3) responder_pergunta, finalizar_quiz e pedir_dica traduzem as letras:
--      a tela manda e recebe a letra mostrada; o banco guarda e corrige pela
--      letra do cadastro (a mesma da tabela gabaritos).
--   A regra de pontos continua: só o 1º acerto de cada pergunta pontua.
-- Rodar depois do 18. Pode ser rodado de novo.
-- ============================================================


-- 1) Ordem das alternativas de cada pergunta na rodada (null = sem embaralhar, rodadas antigas)
alter table public.respostas_quiz
  add column if not exists ordem_alternativas char(4)
  check (ordem_alternativas is null or ordem_alternativas ~ '^[ABCD]{4}$');


-- 2) Tradução de letras
-- Letra MOSTRADA na tela → letra do CADASTRO. Ex.: ordem 'CADB', mostrada 'A' → 'C'.
create or replace function public.letra_do_cadastro(p_ordem text, p_mostrada text)
returns text
language sql
immutable
as $$
  select case
    when p_mostrada is null then null
    when p_ordem is null then upper(p_mostrada)
    else substr(p_ordem, position(upper(p_mostrada) in 'ABCD'), 1)
  end;
$$;

-- Letra do CADASTRO → letra MOSTRADA na tela. Ex.: ordem 'CADB', cadastro 'C' → 'A'.
create or replace function public.letra_na_tela(p_ordem text, p_cadastro text)
returns text
language sql
immutable
as $$
  select case
    when p_cadastro is null then null
    when p_ordem is null then upper(p_cadastro)
    else substr('ABCD', position(upper(p_cadastro) in p_ordem), 1)
  end;
$$;

-- Texto da alternativa do cadastro pela letra (usado para montar a pergunta embaralhada).
create or replace function public.texto_alternativa(p public.perguntas, p_letra text)
returns text
language sql
immutable
as $$
  select case p_letra
    when 'A' then p.alternativa_a
    when 'B' then p.alternativa_b
    when 'C' then p.alternativa_c
    when 'D' then p.alternativa_d
  end;
$$;


-- 3) Iniciar rodada: prioriza perguntas ainda não acertadas e embaralha as alternativas
create or replace function public.iniciar_quiz(p_disciplina_id bigint)
returns table (
  tentativa_id bigint,
  pergunta_id bigint,
  enunciado text,
  alternativa_a text,
  alternativa_b text,
  alternativa_c text,
  alternativa_d text,
  nivel text,
  imagem_path text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  nova_tentativa bigint;
  qtd integer;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para jogar.';
  end if;

  -- Descarta rodadas abandonadas.
  delete from public.tentativas_quiz t
  where t.aluno_id = auth.uid() and t.finalizada_em is null;

  insert into public.tentativas_quiz (aluno_id, disciplina_id)
  values (auth.uid(), p_disciplina_id)
  returning id into nova_tentativa;

  insert into public.respostas_quiz (tentativa_id, pergunta_id, ordem_alternativas)
  select nova_tentativa,
         p.id,
         -- Uma ordem nova para cada pergunta (o "where p.id = p.id" faz o sorteio rodar
         -- para cada linha, e não uma vez só para a rodada inteira).
         (select string_agg(l, '' order by random())
          from unnest(array['A', 'B', 'C', 'D']) as l
          where p.id = p.id)
  from public.perguntas p
  join public.gabaritos g on g.pergunta_id = p.id
  where p.disciplina_id = p_disciplina_id
  order by
    -- false (ainda não acertou) vem antes de true (já acertou em outra rodada)
    exists (
      select 1
      from public.respostas_quiz anterior
      join public.tentativas_quiz t on t.id = anterior.tentativa_id
      where t.aluno_id = auth.uid()
        and t.finalizada_em is not null
        and anterior.pergunta_id = p.id
        and anterior.correta
    ),
    random()
  limit 10;

  get diagnostics qtd = row_count;

  if qtd = 0 then
    raise exception 'Esta disciplina ainda não tem perguntas para o quiz.';
  end if;

  update public.tentativas_quiz t set total_perguntas = qtd where t.id = nova_tentativa;

  -- Devolve as alternativas já na ordem embaralhada (A da tela = 1ª letra da ordem, e assim por diante).
  return query
    select nova_tentativa, p.id, p.enunciado::text,
           public.texto_alternativa(p, substr(r.ordem_alternativas, 1, 1)),
           public.texto_alternativa(p, substr(r.ordem_alternativas, 2, 1)),
           public.texto_alternativa(p, substr(r.ordem_alternativas, 3, 1)),
           public.texto_alternativa(p, substr(r.ordem_alternativas, 4, 1)),
           p.nivel::text,
           p.imagem_path
    from public.respostas_quiz r
    join public.perguntas p on p.id = r.pergunta_id
    where r.tentativa_id = nova_tentativa
    order by random();
end;
$$;

revoke execute on function public.iniciar_quiz(bigint) from public, anon;
grant execute on function public.iniciar_quiz(bigint) to authenticated;


-- 4) Responder: recebe a letra mostrada, corrige pela letra do cadastro e devolve
--    o gabarito já traduzido para a letra que o aluno viu
create or replace function public.responder_pergunta(p_tentativa_id bigint, p_pergunta_id bigint, p_resposta text)
returns table (
  gabarito text,
  acertou boolean,
  pontos integer,
  explicacao text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  rodada public.tentativas_quiz%rowtype;
  mostrada text := upper(trim(coalesce(p_resposta, '')));
  ordem text;
  letra text;
  certa char(1);
  texto_explicacao text;
  nivel_pergunta text;
  ganhou integer := 0;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para jogar.';
  end if;

  select * into rodada
  from public.tentativas_quiz t
  where t.id = p_tentativa_id and t.aluno_id = auth.uid();

  if not found or rodada.finalizada_em is not null then
    raise exception 'Rodada de quiz não encontrada.';
  end if;

  if rodada.iniciada_em < now() - interval '30 minutes' then
    raise exception 'O tempo da rodada (30 minutos) acabou. Comece um novo quiz.';
  end if;

  if mostrada not in ('A', 'B', 'C', 'D') then
    raise exception 'Escolha uma das alternativas.';
  end if;

  select r.ordem_alternativas into ordem
  from public.respostas_quiz r
  where r.tentativa_id = p_tentativa_id and r.pergunta_id = p_pergunta_id;

  if not found then
    raise exception 'Esta pergunta não faz parte da rodada.';
  end if;

  if exists (
    select 1 from public.respostas_quiz r
    where r.tentativa_id = p_tentativa_id and r.pergunta_id = p_pergunta_id and r.resposta is not null
  ) then
    raise exception 'Esta pergunta já foi respondida.';
  end if;

  letra := public.letra_do_cadastro(ordem, mostrada);

  select g.correta, g.explicacao, p.nivel into certa, texto_explicacao, nivel_pergunta
  from public.gabaritos g
  join public.perguntas p on p.id = g.pergunta_id
  where g.pergunta_id = p_pergunta_id;

  -- Pontua só se o aluno nunca tinha acertado essa pergunta em outra rodada.
  if letra = certa and not exists (
    select 1
    from public.respostas_quiz anterior
    join public.tentativas_quiz t on t.id = anterior.tentativa_id
    where t.aluno_id = auth.uid()
      and t.finalizada_em is not null
      and anterior.pergunta_id = p_pergunta_id
      and anterior.correta
  ) then
    ganhou := case nivel_pergunta when 'Difícil' then 30 when 'Médio' then 20 else 10 end;
  end if;

  -- Grava a letra do CADASTRO (a correção e os relatórios usam sempre ela).
  update public.respostas_quiz r
  set resposta = letra, correta = (letra = certa), pontos = ganhou
  where r.tentativa_id = p_tentativa_id and r.pergunta_id = p_pergunta_id;

  return query select public.letra_na_tela(ordem, certa), letra = certa, ganhou, texto_explicacao;
end;
$$;

revoke execute on function public.responder_pergunta(bigint, bigint, text) from public, anon;
grant execute on function public.responder_pergunta(bigint, bigint, text) to authenticated;


-- 5) Finalizar: traduz as respostas que faltavam e devolve tudo na letra da tela
create or replace function public.finalizar_quiz(p_tentativa_id bigint, p_respostas jsonb)
returns table (
  pergunta_id bigint,
  resposta text,
  gabarito text,
  acertou boolean,
  pontos integer
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  rodada public.tentativas_quiz%rowtype;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para jogar.';
  end if;

  select * into rodada
  from public.tentativas_quiz t
  where t.id = p_tentativa_id and t.aluno_id = auth.uid();

  if not found then
    raise exception 'Rodada de quiz não encontrada.';
  end if;

  if rodada.finalizada_em is not null then
    raise exception 'Esta rodada já foi finalizada.';
  end if;

  if rodada.iniciada_em < now() - interval '30 minutes' then
    raise exception 'O tempo da rodada (30 minutos) acabou. Comece um novo quiz.';
  end if;

  -- a) Grava as respostas que ainda faltavam (chegam na letra da tela)
  update public.respostas_quiz r
  set resposta = case
        when upper(p_respostas ->> r.pergunta_id::text) in ('A', 'B', 'C', 'D')
        then public.letra_do_cadastro(r.ordem_alternativas, p_respostas ->> r.pergunta_id::text)
        else null
      end
  where r.tentativa_id = p_tentativa_id and r.resposta is null;

  -- b) Corrige
  update public.respostas_quiz r
  set correta = (r.resposta is not null and r.resposta = g.correta)
  from public.gabaritos g
  where g.pergunta_id = r.pergunta_id and r.tentativa_id = p_tentativa_id;

  -- c) Pontua pelo nível (só se nunca acertou essa pergunta antes)
  update public.respostas_quiz r
  set pontos = case p.nivel when 'Difícil' then 30 when 'Médio' then 20 else 10 end
  from public.perguntas p
  where p.id = r.pergunta_id
    and r.tentativa_id = p_tentativa_id
    and r.correta
    and not exists (
      select 1
      from public.respostas_quiz anterior
      join public.tentativas_quiz t on t.id = anterior.tentativa_id
      where t.aluno_id = auth.uid()
        and t.finalizada_em is not null
        and anterior.pergunta_id = r.pergunta_id
        and anterior.correta
    );

  -- d) Fecha a rodada
  update public.tentativas_quiz t
  set finalizada_em = now(),
      acertos = (select count(*) from public.respostas_quiz r
                 where r.tentativa_id = p_tentativa_id and r.correta),
      pontos = (select coalesce(sum(r.pontos), 0) from public.respostas_quiz r
                where r.tentativa_id = p_tentativa_id)
  where t.id = p_tentativa_id
  returning * into rodada;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    'quiz_finalizado', 'tentativas_quiz', p_tentativa_id::text,
    jsonb_build_object('acertos', rodada.acertos, 'total', rodada.total_perguntas, 'pontos', rodada.pontos)
  );

  -- e) Devolve resposta e gabarito traduzidos para a letra que o aluno viu
  return query
    select r.pergunta_id,
           public.letra_na_tela(r.ordem_alternativas, r.resposta),
           public.letra_na_tela(r.ordem_alternativas, g.correta),
           coalesce(r.correta, false),
           r.pontos
    from public.respostas_quiz r
    left join public.gabaritos g on g.pergunta_id = r.pergunta_id
    where r.tentativa_id = p_tentativa_id;
end;
$$;

revoke execute on function public.finalizar_quiz(bigint, jsonb) from public, anon;
grant execute on function public.finalizar_quiz(bigint, jsonb) to authenticated;


-- 6) Dica 50/50: as duas alternativas eliminadas saem na letra da tela
create or replace function public.pedir_dica(p_tentativa_id bigint, p_pergunta_id bigint)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  rodada public.tentativas_quiz%rowtype;
  certa char(1);
  ordem text;
  eliminadas text[];
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para jogar.';
  end if;

  select * into rodada
  from public.tentativas_quiz t
  where t.id = p_tentativa_id and t.aluno_id = auth.uid();

  if not found or rodada.finalizada_em is not null then
    raise exception 'Rodada de quiz não encontrada.';
  end if;
  if rodada.dica_usada then
    raise exception 'Você já usou a dica desta rodada.';
  end if;

  select r.ordem_alternativas into ordem
  from public.respostas_quiz r
  where r.tentativa_id = p_tentativa_id and r.pergunta_id = p_pergunta_id and r.resposta is null;

  if not found then
    raise exception 'Esta pergunta não está aguardando resposta.';
  end if;

  select g.correta into certa from public.gabaritos g where g.pergunta_id = p_pergunta_id;

  -- Sorteia duas erradas (letras do cadastro) e traduz para a letra da tela.
  select array_agg(public.letra_na_tela(ordem, letra) order by public.letra_na_tela(ordem, letra)) into eliminadas
  from (
    select letra
    from unnest(array['A', 'B', 'C', 'D']) as letra
    where letra <> certa
    order by random()
    limit 2
  ) sorteio;

  update public.tentativas_quiz set dica_usada = true where id = p_tentativa_id;

  return eliminadas;
end;
$$;

revoke execute on function public.pedir_dica(bigint, bigint) from public, anon;
grant execute on function public.pedir_dica(bigint, bigint) to authenticated;
