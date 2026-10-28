-- ============================================================
-- EduGuru — Atualização 11: Quiz, pontuação, ranking e Guru
-- Rodar no SQL Editor do Supabase, DEPOIS da atualização 10.
-- Pode ser rodado mais de uma vez (idempotente).
--
-- Regras de negócio (as mesmas dos RF25 a RF28 da monografia):
--   - Uma rodada de quiz tem até 10 perguntas sorteadas de UMA disciplina.
--   - Só entram no quiz perguntas com 4 alternativas e gabarito.
--   - O aluno NUNCA lê o gabarito: ele fica em uma tabela separada que só
--     admin enxerga, e a correção é feita aqui no banco.
--   - Pontos por acerto: Fácil = 10, Médio = 20, Difícil = 30.
--   - Cada pergunta só dá pontos na PRIMEIRA vez que o aluno acerta
--     (repetir o quiz serve para estudar, não para "farmar" pontos).
--   - A rodada tem 30 minutos para ser finalizada.
--   - Ranking: soma dos pontos; só alunos; mostra nome abreviado
--     (ex.: "Maria S."); quem não quiser aparecer vira "Aluno anônimo".
--   - Guru: "baixo desempenho" = aproveitamento abaixo de 60% em uma
--     disciplina, com pelo menos 5 perguntas respondidas nela. Nesse caso
--     o Guru indica os materiais daquela disciplina.
-- ============================================================


-- ------------------------------------------------------------
-- 1) PERGUNTAS: disciplina vira chave estrangeira + 4 alternativas
-- ------------------------------------------------------------
-- Antes "disciplina" era um texto com a sigla do curso (sem ligação com a
-- tabela disciplinas). Agora cada pergunta pertence a uma disciplina de
-- verdade. Se a disciplina for excluída, as perguntas dela também são.
alter table public.perguntas
  add column if not exists disciplina_id bigint references public.disciplinas(id) on delete cascade,
  add column if not exists alternativa_a text,
  add column if not exists alternativa_b text,
  add column if not exists alternativa_c text,
  add column if not exists alternativa_d text;

-- A coluna de texto antiga sai. Perguntas antigas ficam sem disciplina e
-- sem alternativas: aparecem como "incompletas" para o admin e não
-- entram no quiz até serem recriadas.
alter table public.perguntas drop column if exists disciplina;

-- Nível só pode ser um dos três ("not valid" = não reclama de linhas
-- antigas, mas vale para tudo que for gravado daqui para frente).
alter table public.perguntas drop constraint if exists perguntas_nivel_valido;
alter table public.perguntas
  add constraint perguntas_nivel_valido
  check (nivel in ('Fácil', 'Médio', 'Difícil')) not valid;


-- ------------------------------------------------------------
-- 2) GABARITOS: tabela separada, só admin lê
-- ------------------------------------------------------------
-- Se a resposta certa ficasse na própria tabela perguntas, qualquer aluno
-- logado poderia ler pela API (as perguntas são públicas para logados).
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


-- ------------------------------------------------------------
-- 3) Cadastro de pergunta (pergunta + gabarito juntos)
-- ------------------------------------------------------------
-- Uma função só grava as duas coisas: ou grava tudo, ou não grava nada
-- (não fica pergunta sem gabarito). As validações também ficam aqui,
-- para valerem mesmo chamando a API direto.
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


-- ------------------------------------------------------------
-- 4) MATERIAIS: ligados a uma disciplina (para o Guru indicar)
-- ------------------------------------------------------------
-- Opcional: material sem disciplina continua valendo, só não é indicado
-- pelo Guru. Se a disciplina for excluída, o material fica sem disciplina.
alter table public.materiais
  add column if not exists disciplina_id bigint references public.disciplinas(id) on delete set null;


-- ------------------------------------------------------------
-- 5) RODADAS DE QUIZ e RESPOSTAS
-- ------------------------------------------------------------
-- tentativas_quiz = uma rodada (classe "Quiz" no diagrama).
-- respostas_quiz  = liga a rodada às perguntas sorteadas (muitos-para-
--                   muitos entre Quiz e Pergunta) e guarda a resposta.
create table if not exists public.tentativas_quiz (
  id bigint generated always as identity primary key,
  aluno_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- Se a disciplina for excluída, a rodada (e os pontos) continuam.
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

-- O aluno LÊ só as próprias rodadas e respostas. Não existe política de
-- INSERT/UPDATE/DELETE: gravar só é possível pelas funções iniciar_quiz e
-- finalizar_quiz (assim ninguém inventa a própria pontuação pela API).
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


-- ------------------------------------------------------------
-- 6) Iniciar uma rodada
-- ------------------------------------------------------------
-- Sorteia até 10 perguntas completas da disciplina e devolve SEM o
-- gabarito. As perguntas sorteadas ficam gravadas em respostas_quiz, então
-- na hora de finalizar só valem respostas para ESSAS perguntas.
--
-- "#variable_conflict use_column": as colunas de retorno têm o mesmo nome
-- de colunas das tabelas (ex.: enunciado); isso manda o PostgreSQL usar a
-- coluna da tabela quando houver dúvida.
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

  -- Só uma rodada aberta por vez: rodadas abandonadas são descartadas.
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

  -- O "raise" desfaz tudo o que a função fez (a rodada vazia some).
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


-- ------------------------------------------------------------
-- 7) Finalizar a rodada (correção e pontuação no banco)
-- ------------------------------------------------------------
-- p_respostas vem do site no formato { "id_da_pergunta": "A", ... }.
-- Devolve, para cada pergunta, a resposta dada, a correta e os pontos —
-- é o que a tela mostra como resultado.
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

  -- a) Grava a letra escolhida (qualquer coisa fora de A-D vira "não respondeu").
  update public.respostas_quiz r
  set resposta = case
        when upper(p_respostas ->> r.pergunta_id::text) in ('A', 'B', 'C', 'D')
        then upper(p_respostas ->> r.pergunta_id::text)
        else null
      end
  where r.tentativa_id = p_tentativa_id;

  -- b) Corrige comparando com o gabarito.
  update public.respostas_quiz r
  set correta = (r.resposta is not null and r.resposta = g.correta)
  from public.gabaritos g
  where g.pergunta_id = r.pergunta_id and r.tentativa_id = p_tentativa_id;

  -- c) Pontua pelo nível — só se o aluno nunca tinha acertado essa
  --    pergunta em uma rodada anterior.
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

  -- d) Fecha a rodada com os totais.
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


-- ------------------------------------------------------------
-- 8) Ranking
-- ------------------------------------------------------------
-- O aluno pode sair do ranking por nome (direito de oposição, LGPD):
-- nesse caso aparece "Aluno anônimo". Ele mesmo altera em Minha conta.
alter table public.perfis
  add column if not exists aparecer_no_ranking boolean not null default true;

grant update (aparecer_no_ranking) on public.perfis to authenticated;

-- "Maria Silva Souza" -> "Maria S." (minimização: só o necessário para
-- o aluno se reconhecer no ranking).
create or replace function public.nome_publico(nome text)
returns text
language sql
immutable
as $$
  select split_part(trim(nome), ' ', 1)
         || coalesce(' ' || left(nullif(split_part(trim(nome), ' ', 2), ''), 1) || '.', '');
$$;

-- Os perfis dos outros alunos não são legíveis pela API (atualização 4).
-- Esta função devolve só posição, nome abreviado e pontos: os 10 primeiros
-- e, se o aluno estiver fora deles, também a linha dele.
-- p_disciplina_id = null -> ranking geral; com valor -> ranking da disciplina.
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


-- ------------------------------------------------------------
-- 9) Desempenho do aluno por disciplina e Guru
-- ------------------------------------------------------------
-- "security invoker": roda com as permissões de quem chamou, então o RLS
-- garante que cada aluno só calcula o PRÓPRIO desempenho.
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

-- Guru: disciplinas com baixo desempenho (aproveitamento < 60% e pelo
-- menos 5 respostas) e os materiais dessas disciplinas. "left join" para
-- a disciplina aparecer mesmo quando ainda não há material (a tela avisa).
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
  where d.respondidas >= 5      -- mínimo de respostas para avaliar
    and d.aproveitamento < 60   -- critério de "baixo desempenho"
  order by d.aproveitamento, m.titulo;
$$;

grant execute on function public.recomendacoes_guru() to authenticated;
