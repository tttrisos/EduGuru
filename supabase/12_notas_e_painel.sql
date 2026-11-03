-- ============================================================
-- EduGuru — 12: notas e faltas (RF29) e indicadores do painel do admin (RF30)
-- Os cálculos de M2, MD, MF e situação ficam em src/funcionalidades/notas/calculoNotas.ts.
-- ============================================================


-- 1) O limite de faltas é fixo (40 por disciplina): o total de aulas não é mais usado
alter table public.disciplinas drop column if exists total_aulas;


-- 2) Notas: uma linha por aluno e disciplina (nota vazia = ainda não saiu)
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

-- M2 digitada pelo aluno (usada quando ND e NI ainda não saíram, para simular a MF).
alter table public.notas add column if not exists m2 numeric(4, 2) check (m2 between 0 and 10);

alter table public.notas enable row level security;

-- Só o próprio aluno lê e altera as notas (nem o admin vê).
drop policy if exists "notas_proprias" on public.notas;
create policy "notas_proprias" on public.notas
  for all to authenticated
  using (aluno_id = auth.uid())
  with check (aluno_id = auth.uid());

drop policy if exists "mfa_obrigatorio" on public.notas;
create policy "mfa_obrigatorio" on public.notas
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());


-- 3) Log das notas sem os valores
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


-- 4) Indicadores do painel do admin (só números gerais)
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

    'aproveitamento_geral', (
      select coalesce(round(100.0 * count(*) filter (where r.correta) / nullif(count(*), 0)), 0)
      from public.respostas_quiz r
      join public.tentativas_quiz t on t.id = r.tentativa_id
      where t.finalizada_em is not null
    ),

    -- Quizzes por dia nos últimos 7 dias (horário de Brasília).
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
