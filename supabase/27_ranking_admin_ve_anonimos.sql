-- ============================================================
-- EduGuru — 27: no ranking, SÓ O ADMINISTRADOR vê quem é o "Aluno anônimo"
--   Para os colegas, quem desmarcou "Mostrar meu nome no ranking" continua
--   aparecendo só como "Aluno anônimo" (RF18-RN05). Para o administrador, a
--   linha mostra "Aluno anônimo (Nome Completo)", para ele saber quem é o aluno
--   (o administrador já vê os perfis de todos na tela Usuários).
--   O próprio aluno vê o seu nome abreviado na linha dele.
--   Também apaga qualquer outra versão da função "ranking" que exista no banco
--   (com outros parâmetros), para ficar só esta.
-- Rodar depois do 26. Pode ser rodado de novo.
-- ============================================================


-- 1) Apaga qualquer versão de public.ranking, seja qual for a lista de parâmetros.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'ranking'
  loop
    execute 'drop function ' || f.assinatura;
  end loop;
end;
$$;


-- 2) Top 10 + a linha do aluno que consulta. Sem disciplina = ranking geral.
create function public.ranking(p_disciplina_id bigint default null)
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
declare
  -- eh_admin() (script 26) só é verdadeiro para administrador com sessão aal2 ainda ativa.
  v_admin boolean := public.eh_admin();
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para ver o ranking.';
  end if;

  return query
    with soma as (
      -- Pontos de cada ALUNO (administradores não entram no ranking).
      select t.aluno_id, sum(t.pontos)::bigint as total
      from public.tentativas_quiz t
      join public.perfis p on p.id = t.aluno_id and p.papel = 'aluno'
      where t.finalizada_em is not null
        and (p_disciplina_id is null or t.disciplina_id = p_disciplina_id)
      group by t.aluno_id
      having sum(t.pontos) > 0
    ),
    classificacao as (
      -- rank(): empates ficam na mesma posição (RF18-RN04).
      select s.aluno_id, s.total, rank() over (order by s.total desc) as pos
      from soma s
    )
    select c.pos,
           case
             -- Nome visível (opção marcada) ou a linha do próprio aluno: nome abreviado ("Maria S.").
             when p.aparecer_no_ranking or c.aluno_id = auth.uid() then public.nome_publico(p.nome)
             -- Escolheu ficar anônimo: o ADMINISTRADOR vê quem é, entre parênteses.
             when v_admin then 'Aluno anônimo (' || p.nome || ')'
             -- Para os colegas, só "Aluno anônimo".
             else 'Aluno anônimo'
           end,
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
