-- ============================================================
-- EduGuru — 11: quiz, pontuação, ranking e Guru (RF25 a RF28)
--   - até 10 perguntas sorteadas de uma disciplina, corrigidas no banco;
--   - pontos: Fácil 10, Médio 20, Difícil 30 (só no 1º acerto da pergunta);
--   - Guru: aproveitamento < 60% com pelo menos 5 respostas na disciplina.
-- ============================================================


-- 1) Perguntas: disciplina e 4 alternativas
alter table public.perguntas
  add column if not exists disciplina_id bigint references public.disciplinas(id) on delete cascade,
  add column if not exists alternativa_a text,
  add column if not exists alternativa_b text,
  add column if not exists alternativa_c text,
  add column if not exists alternativa_d text;

alter table public.perguntas drop constraint if exists perguntas_nivel_valido;
alter table public.perguntas
  add constraint perguntas_nivel_valido
  check (nivel in ('Fácil', 'Médio', 'Difícil')) not valid;


-- 2) Gabaritos: tabela separada, que só o admin lê
create table if not exists public.gabaritos (
  pergunta_id bigint primary key references public.perguntas(id) on delete cascade,
  correta char(1) not null check (correta in ('A', 'B', 'C', 'D'))
);

alter table public.gabaritos enable row level security;

drop policy if exists "gabaritos_somente_admin" on public.gabaritos;
create policy "gabaritos_somente_admin" on public.gabaritos
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "mfa_obrigatorio" on public.gabaritos;
create policy "mfa_obrigatorio" on public.gabaritos
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());


-- 3) Cadastro de pergunta: grava pergunta e gabarito juntos
create or replace function public.criar_pergunta(
  p_enunciado text,
  p_disciplina_id bigint,
  p_nivel text,
  p_alternativa_a text,
  p_alternativa_b text,
  p_alternativa_c text,
  p_alternativa_d text,
  p_correta text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  nova_id bigint;
  alternativas text[] := array[
    trim(coalesce(p_alternativa_a, '')), trim(coalesce(p_alternativa_b, '')),
    trim(coalesce(p_alternativa_c, '')), trim(coalesce(p_alternativa_d, ''))
  ];
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem cadastrar perguntas.';
  end if;

  if length(trim(coalesce(p_enunciado, ''))) < 10 then
    raise exception 'O enunciado precisa ter pelo menos 10 caracteres.';
  end if;

  if length(p_enunciado) > 500 then
    raise exception 'O enunciado pode ter no máximo 500 caracteres.';
  end if;

  if not exists (select 1 from public.disciplinas where id = p_disciplina_id) then
    raise exception 'Escolha uma disciplina válida.';
  end if;

  if p_nivel not in ('Fácil', 'Médio', 'Difícil') then
    raise exception 'Nível inválido.';
  end if;

  if '' = any(alternativas) then
    raise exception 'Preencha as quatro alternativas.';
  end if;

  if (select count(distinct lower(a)) from unnest(alternativas) as a) < 4 then
    raise exception 'As quatro alternativas precisam ser diferentes.';
  end if;

  if upper(coalesce(p_correta, '')) not in ('A', 'B', 'C', 'D') then
    raise exception 'Escolha qual alternativa é a correta.';
  end if;

  insert into public.perguntas (enunciado, disciplina_id, nivel,
                                alternativa_a, alternativa_b, alternativa_c, alternativa_d)
  values (trim(p_enunciado), p_disciplina_id, p_nivel,
          alternativas[1], alternativas[2], alternativas[3], alternativas[4])
  returning id into nova_id;

  insert into public.gabaritos (pergunta_id, correta)
  values (nova_id, upper(p_correta));

  return nova_id;
end;
$$;

revoke execute on function public.criar_pergunta(text, bigint, text, text, text, text, text, text) from public, anon;
grant execute on function public.criar_pergunta(text, bigint, text, text, text, text, text, text) to authenticated;


-- 4) Materiais ligados a uma disciplina (para o Guru indicar)
alter table public.materiais
  add column if not exists disciplina_id bigint references public.disciplinas(id) on delete set null;


-- 5) Rodadas do quiz (tentativas_quiz) e respostas de cada pergunta (respostas_quiz)
create table if not exists public.tentativas_quiz (
  id bigint generated always as identity primary key,
  aluno_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  disciplina_id bigint references public.disciplinas(id) on delete set null,
  iniciada_em timestamptz not null default now(),
  finalizada_em timestamptz,
  total_perguntas integer not null default 0,
  acertos integer not null default 0,
  pontos integer not null default 0
);

create table if not exists public.respostas_quiz (
  tentativa_id bigint not null references public.tentativas_quiz(id) on delete cascade,
  pergunta_id bigint not null references public.perguntas(id) on delete cascade,
  resposta char(1) check (resposta in ('A', 'B', 'C', 'D')),  -- null = não respondeu
  correta boolean,
  pontos integer not null default 0,
  primary key (tentativa_id, pergunta_id)
);

alter table public.tentativas_quiz enable row level security;
alter table public.respostas_quiz enable row level security;

-- O aluno só lê as próprias rodadas. Gravar, só pelas funções do quiz.
drop policy if exists "tentativas_select_propria" on public.tentativas_quiz;
create policy "tentativas_select_propria" on public.tentativas_quiz
  for select to authenticated
  using (aluno_id = auth.uid());

drop policy if exists "respostas_select_propria" on public.respostas_quiz;
create policy "respostas_select_propria" on public.respostas_quiz
  for select to authenticated
  using (exists (
    select 1 from public.tentativas_quiz t
    where t.id = respostas_quiz.tentativa_id and t.aluno_id = auth.uid()
  ));

drop policy if exists "mfa_obrigatorio" on public.tentativas_quiz;
create policy "mfa_obrigatorio" on public.tentativas_quiz
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop policy if exists "mfa_obrigatorio" on public.respostas_quiz;
create policy "mfa_obrigatorio" on public.respostas_quiz
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());


-- 6) Iniciar rodada: sorteia até 10 perguntas e devolve sem o gabarito
create or replace function public.iniciar_quiz(p_disciplina_id bigint)
returns table (
  tentativa_id bigint,
  pergunta_id bigint,
  enunciado text,
  alternativa_a text,
  alternativa_b text,
  alternativa_c text,
  alternativa_d text,
  nivel text
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

  insert into public.respostas_quiz (tentativa_id, pergunta_id)
  select nova_tentativa, p.id
  from public.perguntas p
  join public.gabaritos g on g.pergunta_id = p.id
  where p.disciplina_id = p_disciplina_id
  order by random()
  limit 10;

  get diagnostics qtd = row_count;

  if qtd = 0 then
    raise exception 'Esta disciplina ainda não tem perguntas para o quiz.';
  end if;

  update public.tentativas_quiz t set total_perguntas = qtd where t.id = nova_tentativa;

  return query
    select nova_tentativa, p.id, p.enunciado::text,
           p.alternativa_a, p.alternativa_b, p.alternativa_c, p.alternativa_d, p.nivel::text
    from public.respostas_quiz r
    join public.perguntas p on p.id = r.pergunta_id
    where r.tentativa_id = nova_tentativa
    order by random();
end;
$$;

revoke execute on function public.iniciar_quiz(bigint) from public, anon;
grant execute on function public.iniciar_quiz(bigint) to authenticated;


-- 7) Finalizar rodada: corrige e pontua. p_respostas = { "id_da_pergunta": "A", ... }
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

  -- a) Grava a resposta
  update public.respostas_quiz r
  set resposta = case
        when upper(p_respostas ->> r.pergunta_id::text) in ('A', 'B', 'C', 'D')
        then upper(p_respostas ->> r.pergunta_id::text)
        else null
      end
  where r.tentativa_id = p_tentativa_id;

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

  return query
    select r.pergunta_id, r.resposta::text, g.correta::text, coalesce(r.correta, false), r.pontos
    from public.respostas_quiz r
    left join public.gabaritos g on g.pergunta_id = r.pergunta_id
    where r.tentativa_id = p_tentativa_id;
end;
$$;

revoke execute on function public.finalizar_quiz(bigint, jsonb) from public, anon;
grant execute on function public.finalizar_quiz(bigint, jsonb) to authenticated;


-- 8) Ranking (quem desmarca em Minha conta aparece como "Aluno anônimo")
alter table public.perfis
  add column if not exists aparecer_no_ranking boolean not null default true;

grant update (aparecer_no_ranking) on public.perfis to authenticated;

-- "Maria Silva Souza" -> "Maria S."
create or replace function public.nome_publico(nome text)
returns text
language sql
immutable
as $$
  select split_part(trim(nome), ' ', 1)
         || coalesce(' ' || left(nullif(split_part(trim(nome), ' ', 2), ''), 1) || '.', '');
$$;

-- Top 10 + a linha do aluno. Sem disciplina = ranking geral.
create or replace function public.ranking(p_disciplina_id bigint default null)
returns table (
  posicao bigint,
  nome text,
  pontos bigint,
  eh_voce boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para ver o ranking.';
  end if;

  return query
    with soma as (
      select t.aluno_id, sum(t.pontos)::bigint as total
      from public.tentativas_quiz t
      join public.perfis p on p.id = t.aluno_id and p.papel = 'aluno'
      where t.finalizada_em is not null
        and (p_disciplina_id is null or t.disciplina_id = p_disciplina_id)
      group by t.aluno_id
      having sum(t.pontos) > 0
    ),
    classificacao as (
      select s.aluno_id, s.total, rank() over (order by s.total desc) as pos
      from soma s
    )
    select c.pos,
           case when p.aparecer_no_ranking or c.aluno_id = auth.uid()
                then public.nome_publico(p.nome)
                else 'Aluno anônimo' end,
           c.total,
           c.aluno_id = auth.uid()
    from classificacao c
    join public.perfis p on p.id = c.aluno_id
    where c.pos <= 10 or c.aluno_id = auth.uid()
    order by c.pos;
end;
$$;

revoke execute on function public.ranking(bigint) from public, anon;
grant execute on function public.ranking(bigint) to authenticated;


-- 9) Desempenho do aluno por disciplina e Guru
create or replace function public.meu_desempenho()
returns table (
  disciplina_id bigint,
  disciplina text,
  respondidas bigint,
  acertos bigint,
  aproveitamento integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select d.id::bigint,
         d.nome::text,
         count(*),
         count(*) filter (where r.correta),
         round(100.0 * count(*) filter (where r.correta) / count(*))::integer
  from public.respostas_quiz r
  join public.tentativas_quiz t on t.id = r.tentativa_id
  join public.perguntas p on p.id = r.pergunta_id
  join public.disciplinas d on d.id = p.disciplina_id
  where t.aluno_id = auth.uid() and t.finalizada_em is not null
  group by d.id, d.nome
  order by d.nome;
$$;

grant execute on function public.meu_desempenho() to authenticated;

-- Guru: materiais das disciplinas com aproveitamento < 60% (mínimo 5 respostas).
create or replace function public.recomendacoes_guru()
returns table (
  disciplina_id bigint,
  disciplina text,
  aproveitamento integer,
  material_id bigint,
  titulo text,
  link text,
  arquivo_path text,
  arquivo_nome text
)
language sql
stable
security invoker
set search_path = public
as $$
  select d.disciplina_id, d.disciplina, d.aproveitamento,
         m.id::bigint, m.titulo::text, m.link::text, m.arquivo_path::text, m.arquivo_nome::text
  from public.meu_desempenho() d
  left join public.materiais m on m.disciplina_id = d.disciplina_id
  where d.respondidas >= 5
    and d.aproveitamento < 60
  order by d.aproveitamento, m.titulo;
$$;

grant execute on function public.recomendacoes_guru() to authenticated;
