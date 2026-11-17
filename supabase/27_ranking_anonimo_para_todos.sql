-- ============================================================
-- EduGuru — 27: "Aluno anônimo" vale para TODOS, inclusive o administrador
--   Problema: no banco publicado, o administrador via o nome verdadeiro ao
--   lado de "Aluno anônimo", entre parênteses. A versão do script 11 não faz
--   isso, então a função do banco estava diferente da do repositório (alterada
--   à mão ou com uma segunda versão da função "ranking" com outros parâmetros).
--   Agora: apaga TODAS as versões de public.ranking e cria de novo a única
--   versão oficial. A oposição do aluno (RF18-RN05, LGPD art. 18) vale para
--   qualquer pessoa que consulte o ranking; só o próprio aluno vê o seu nome
--   abreviado na linha dele.
-- Rodar depois do 26. Pode ser rodado de novo.
--
-- Para conferir ANTES de rodar o que está no banco hoje (opcional):
--   select pg_get_functiondef(p.oid)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname = 'ranking';
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


-- 2) A versão oficial (mesma regra do script 11, com o anonimato explicado linha a linha).
--    Top 10 + a linha do aluno que consulta. Sem disciplina = ranking geral.
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
           -- O nome só aparece se o aluno deixou "Mostrar meu nome no ranking" marcado, ou se a
           -- linha é do próprio aluno que está consultando. Para TODOS os outros (colegas e
           -- administrador) aparece só "Aluno anônimo", sem nada junto.
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
