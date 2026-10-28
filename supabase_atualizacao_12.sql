-- ============================================================
-- EduGuru — Atualização 12: notas e faltas (Dashboard Acadêmico)
-- e indicadores do painel do administrador
-- Rodar no SQL Editor do Supabase, DEPOIS da atualização 11.
-- Pode ser rodado mais de uma vez (idempotente).
--
-- O aluno registra manualmente as próprias notas e faltas de cada
-- disciplina, com os mesmos campos do boletim da UMC: M1, ND, NI, MS
-- (nota única), Exame e Faltas. O cálculo de M2, MD, MF e da situação
-- (aprovado, exame, reprovado, limite de faltas) fica em src/lib/notas.ts.
-- ============================================================


-- ------------------------------------------------------------
-- 1) DISCIPLINAS: total de aulas (base do limite de faltas)
-- ------------------------------------------------------------
alter table public.disciplinas
  add column if not exists total_aulas integer not null default 80;

alter table public.disciplinas drop constraint if exists disciplinas_total_aulas_valido;
alter table public.disciplinas
  add constraint disciplinas_total_aulas_valido check (total_aulas between 1 and 400);


-- ------------------------------------------------------------
-- 2) NOTAS
-- ------------------------------------------------------------
-- Uma linha por aluno e disciplina. As notas vão de 0 a 10 e podem ficar
-- vazias (ainda não saiu). As faltas não podem ser negativas.
--   m1 = avaliações do 1º bimestre     nd = avaliações do 2º bimestre
--   ni = avaliação integrada           ms = média semestral (nota única)
-- M2 e MD não são guardadas: são calculadas a partir destas.
create table if not exists public.notas (
  id bigint generated always as identity primary key,
  aluno_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  disciplina_id bigint not null references public.disciplinas(id) on delete cascade,
  m1 numeric(4, 2) check (m1 between 0 and 10),
  nd numeric(4, 2) check (nd between 0 and 10),
  ni numeric(4, 2) check (ni between 0 and 10),
  ms numeric(4, 2) check (ms between 0 and 10),
  exame numeric(4, 2) check (exame between 0 and 10),
  faltas integer not null default 0 check (faltas between 0 and 400),
  atualizado_em timestamptz not null default now(),
  unique (aluno_id, disciplina_id)
);

-- Para quem já rodou a primeira versão deste script (que tinha "m2"):
-- cria as colunas novas e remove a antiga.
alter table public.notas add column if not exists nd numeric(4, 2) check (nd between 0 and 10);
alter table public.notas add column if not exists ni numeric(4, 2) check (ni between 0 and 10);
alter table public.notas add column if not exists ms numeric(4, 2) check (ms between 0 and 10);
alter table public.notas drop column if exists m2;

alter table public.notas enable row level security;

-- Notas são do aluno: só ele lê e altera. Nem o admin enxerga (não
-- precisa, e são dados acadêmicos pessoais).
drop policy if exists "notas_proprias" on public.notas;
create policy "notas_proprias" on public.notas
  for all to authenticated
  using (aluno_id = auth.uid())
  with check (aluno_id = auth.uid());

drop policy if exists "mfa_obrigatorio" on public.notas;
create policy "mfa_obrigatorio" on public.notas
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());


-- ------------------------------------------------------------
-- 3) Log das notas SEM os valores
-- ------------------------------------------------------------
-- O gatilho genérico (registrar_log_auditoria) copia a linha inteira para
-- o log, e o admin lê os logs. Para notas isso exporia as notas do aluno.
-- Aqui registramos só que houve a ação e em qual registro.
create or replace function public.registrar_log_sem_valores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    case tg_op when 'INSERT' then 'criar' when 'UPDATE' then 'editar' else 'excluir' end,
    tg_table_name,
    coalesce(new.id, old.id)::text,
    null
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists log_notas on public.notas;
create trigger log_notas
  after insert or update or delete on public.notas
  for each row execute function public.registrar_log_sem_valores();

-- Mantém "atualizado_em" certo a cada alteração.
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists notas_atualizado_em on public.notas;
create trigger notas_atualizado_em
  before update on public.notas
  for each row execute function public.tocar_atualizado_em();


-- ------------------------------------------------------------
-- 4) Indicadores do painel do administrador
-- ------------------------------------------------------------
-- Só números agregados (nenhum dado de aluno individual).
create or replace function public.estatisticas_admin()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem ver estas estatísticas.';
  end if;

  return jsonb_build_object(
    'alunos', (select count(*) from public.perfis where papel = 'aluno'),
    'disciplinas', (select count(*) from public.disciplinas),
    'perguntas_prontas', (select count(*) from public.gabaritos),
    'materiais', (select count(*) from public.materiais),
    'quizzes', (select count(*) from public.tentativas_quiz where finalizada_em is not null),

    -- % de acertos de todas as respostas já dadas.
    'aproveitamento_geral', (
      select coalesce(round(100.0 * count(*) filter (where r.correta) / nullif(count(*), 0)), 0)
      from public.respostas_quiz r
      join public.tentativas_quiz t on t.id = r.tentativa_id
      where t.finalizada_em is not null
    ),

    -- Quizzes finalizados em cada um dos últimos 7 dias (horário de Brasília).
    'quizzes_por_dia', (
      select jsonb_agg(jsonb_build_object('dia', to_char(dia, 'DD/MM'), 'total', total) order by dia)
      from (
        select d::date as dia,
               (select count(*) from public.tentativas_quiz t
                where t.finalizada_em is not null
                  and (t.finalizada_em at time zone 'America/Sao_Paulo')::date = d::date) as total
        from generate_series(
          (now() at time zone 'America/Sao_Paulo')::date - 6,
          (now() at time zone 'America/Sao_Paulo')::date,
          interval '1 day'
        ) as d
      ) dias
    ),

    -- Aproveitamento médio da turma em cada disciplina com respostas.
    'aproveitamento_por_disciplina', (
      select coalesce(jsonb_agg(jsonb_build_object('disciplina', nome, 'aproveitamento', aproveitamento)
                                order by aproveitamento), '[]'::jsonb)
      from (
        select d.nome,
               round(100.0 * count(*) filter (where r.correta) / count(*)) as aproveitamento
        from public.respostas_quiz r
        join public.tentativas_quiz t on t.id = r.tentativa_id
        join public.perguntas p on p.id = r.pergunta_id
        join public.disciplinas d on d.id = p.disciplina_id
        where t.finalizada_em is not null
        group by d.nome
      ) por_disciplina
    )
  );
end;
$$;

revoke execute on function public.estatisticas_admin() from public, anon;
grant execute on function public.estatisticas_admin() to authenticated;
