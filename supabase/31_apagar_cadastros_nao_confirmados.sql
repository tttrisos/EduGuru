-- ============================================================
-- EduGuru — 31: cadastro com e-mail errado não vira "usuário fantasma"
--   Quem cria a conta e nunca abre o link de confirmação (ex.: digitou o e-mail
--   errado) não consegue entrar, mas a conta ficava guardada no Supabase Auth e
--   aparecia em Usuários e no total de alunos do painel. Agora:
--   1) essas contas não aparecem em Usuários nem contam no painel do admin;
--   2) depois de 24 horas sem confirmação, a conta é apagada sozinha (pg_cron,
--      de hora em hora), com o perfil junto, e o e-mail fica livre de novo;
--   3) a limpeza fica no log só com a quantidade (sem e-mails: minimização, LGPD).
--   Contas de administrador nunca são apagadas por esta rotina.
-- Antes: pg_cron habilitado (já usado no 06). Rodar depois do 30. Pode ser rodado de novo.
-- ============================================================


-- 1) A conta já confirmou o e-mail? (o Supabase Auth grava email_confirmed_at ao abrir o link)
create or replace function public.conta_confirmada(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from auth.users u where u.id = uid and u.email_confirmed_at is not null);
$$;

revoke execute on function public.conta_confirmada(uuid) from public, anon, authenticated;


-- 2) Limpeza usada só pelo agendador (não pode ser chamada pelo site)
create or replace function public.limpar_cadastros_nao_confirmados()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  qtd integer;
begin
  delete from auth.users u
  where u.email_confirmed_at is null
    and u.created_at < now() - interval '24 hours'
    and not exists (select 1 from public.perfis p where p.id = u.id and p.papel = 'admin');
  get diagnostics qtd = row_count;

  if qtd > 0 then
    insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
    values (null, null, 'limpeza_cadastros', 'perfis', null,
            jsonb_build_object('removidos', qtd, 'prazo_horas', 24));
  end if;

  return qtd;
end;
$$;

revoke execute on function public.limpar_cadastros_nao_confirmados() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'limpeza-cadastros-nao-confirmados';

select cron.schedule(
  'limpeza-cadastros-nao-confirmados',
  '20 * * * *',
  $$select public.limpar_cadastros_nao_confirmados();$$
);


-- 3) Usuários (tela do admin): só contas confirmadas (mesma função do script 10)
create or replace function public.listar_usuarios_admin()
returns table (
  id uuid,
  nome text,
  email text,
  curso text,
  papel text,
  criado_em timestamptz,
  mfa_ativo boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem listar usuários.';
  end if;

  return query
    select p.id, p.nome, u.email::text, p.curso, p.papel, p.criado_em,
           exists (
             select 1 from auth.mfa_factors f
             where f.user_id = p.id and f.status = 'verified'
           )
    from public.perfis p
    join auth.users u on u.id = p.id
    where u.email_confirmed_at is not null
    order by p.nome;
end;
$$;

revoke execute on function public.listar_usuarios_admin() from public, anon;
grant execute on function public.listar_usuarios_admin() to authenticated;


-- 4) Painel do admin: "Alunos com duas etapas" conta só alunos confirmados (mesma função do 23)
create or replace function public.total_alunos_com_mfa()
returns table (com_mfa bigint, alunos bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.eh_admin() then
    raise exception 'Somente administradores.';
  end if;
  return query
    select count(*) filter (where exists (
             select 1 from auth.mfa_factors f where f.user_id = p.id and f.status = 'verified')),
           count(*)
    from public.perfis p
    where p.papel = 'aluno' and public.conta_confirmada(p.id);
end;
$$;

revoke execute on function public.total_alunos_com_mfa() from public, anon;
grant execute on function public.total_alunos_com_mfa() to authenticated;


-- 5) Painel do admin: "Alunos cadastrados" conta só contas confirmadas (mesma função do 12)
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
    -- só contas confirmadas (cadastro com e-mail errado não conta)
    'alunos', (select count(*) from public.perfis p
               where p.papel = 'aluno' and public.conta_confirmada(p.id)),
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


-- Conferência: quantos cadastros esperam confirmação (os com mais de 24 h saem na próxima hora)
select count(*) filter (where created_at >= now() - interval '24 hours') as aguardando_confirmacao,
       count(*) filter (where created_at <  now() - interval '24 hours') as serao_apagados
from auth.users u
where u.email_confirmed_at is null
  and not exists (select 1 from public.perfis p where p.id = u.id and p.papel = 'admin');
