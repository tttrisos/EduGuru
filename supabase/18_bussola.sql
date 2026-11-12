-- ============================================================
-- EduGuru — 18: Bússola EduGuru (autoavaliação de interesses)
--   - afirmações curtas ligadas às áreas de carreira (script 17), respondidas
--     de 1 ("nada a ver comigo") a 5 ("tem tudo a ver comigo");
--   - afinidade por área = média das respostas da área, em 0–100%;
--   - guarda só o resultado mais recente de cada aluno (refazer substitui);
--     o aluno pode apagar o resultado quando quiser;
--   - o resultado alimenta as áreas sugeridas do EduGuru Carreiras.
-- Não é teste vocacional nem psicológico: é uma orientação simples, opcional.
-- Rodar depois do 17. Pode ser rodado de novo.
-- ============================================================


-- 1) Afirmações
create table if not exists public.bussola_afirmacoes (
  id bigint generated always as identity primary key,
  texto text not null unique check (char_length(trim(texto)) between 10 and 200),
  area_id bigint not null references public.areas_carreira(id) on delete cascade,
  ordem integer not null default 0,
  ativa boolean not null default true
);

alter table public.bussola_afirmacoes enable row level security;

drop policy if exists "bussola_afirmacoes_leitura" on public.bussola_afirmacoes;
create policy "bussola_afirmacoes_leitura" on public.bussola_afirmacoes
  for select to authenticated using (true);

drop policy if exists "bussola_afirmacoes_admin_escreve" on public.bussola_afirmacoes;
create policy "bussola_afirmacoes_admin_escreve" on public.bussola_afirmacoes
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "mfa_obrigatorio" on public.bussola_afirmacoes;
create policy "mfa_obrigatorio" on public.bussola_afirmacoes
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop trigger if exists log_bussola_afirmacoes on public.bussola_afirmacoes;
create trigger log_bussola_afirmacoes
  after insert or update or delete on public.bussola_afirmacoes
  for each row execute function public.registrar_log_auditoria();


-- 2) Afirmações iniciais: 2 por área, intercaladas (a ordem não agrupa as áreas)
insert into public.bussola_afirmacoes (texto, area_id, ordem)
select v.texto, a.id, v.ordem
from (values
  ('Gosto de entender como um sistema funciona por dentro, além da tela.', 'Back-end', 1),
  ('Fico satisfeito quando uma tela fica bonita e fácil de usar.', 'Front-end', 2),
  ('Gosto de organizar informações e descobrir padrões em números.', 'Dados', 3),
  ('Tenho curiosidade sobre redes, servidores e como manter um sistema no ar.', 'Infraestrutura e Segurança', 4),
  ('Gosto de procurar erros e conferir se tudo funciona como deveria.', 'Qualidade e Testes', 5),
  ('Prefiro organizar a equipe, as tarefas e os prazos a programar.', 'Gestão e Produto', 6),
  ('Acompanho as novidades de inteligência artificial e gosto de testá-las.', 'Inteligência Artificial', 7),
  ('Gosto de construir um projeto inteiro, do banco de dados até a tela.', 'Full Stack', 8),
  ('Resolver um problema de lógica difícil me deixa animado.', 'Back-end', 9),
  ('Presto atenção em cores, espaçamentos e na experiência de quem usa um site.', 'Front-end', 10),
  ('Montar consultas e relatórios para responder perguntas me parece interessante.', 'Dados', 11),
  ('Me preocupo em proteger contas e dados contra ataques e vazamentos.', 'Infraestrutura e Segurança', 12),
  ('Escrever testes que evitam que um erro volte a acontecer me parece útil.', 'Qualidade e Testes', 13),
  ('Gosto de conversar com as pessoas para entender o que elas precisam.', 'Gestão e Produto', 14),
  ('Gostaria de criar sistemas que aprendem com dados ou automatizam tarefas.', 'Inteligência Artificial', 15),
  ('Prefiro saber um pouco de cada parte do sistema a me especializar em uma só.', 'Full Stack', 16)
) as v(texto, area, ordem)
join public.areas_carreira a on a.nome = v.area
on conflict (texto) do nothing;


-- 3) Resultado: um por aluno (o mais recente). Respostas guardadas para o aluno
--    ver e baixar o que respondeu; afinidades calculadas pelo banco.
create table if not exists public.bussola_resultados (
  aluno_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  respostas jsonb not null,
  afinidades jsonb not null,
  respondida_em timestamptz not null default now()
);

alter table public.bussola_resultados enable row level security;

-- O aluno lê e apaga o próprio resultado; gravar é só pela função abaixo.
drop policy if exists "bussola_resultado_proprio_leitura" on public.bussola_resultados;
create policy "bussola_resultado_proprio_leitura" on public.bussola_resultados
  for select to authenticated using (aluno_id = auth.uid());

drop policy if exists "bussola_resultado_proprio_exclusao" on public.bussola_resultados;
create policy "bussola_resultado_proprio_exclusao" on public.bussola_resultados
  for delete to authenticated using (aluno_id = auth.uid());

drop policy if exists "mfa_obrigatorio" on public.bussola_resultados;
create policy "mfa_obrigatorio" on public.bussola_resultados
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());


-- 4) Salvar respostas: confere se todas as afirmações ativas foram respondidas
--    com 1 a 5, calcula a afinidade por área e substitui o resultado anterior.
--    p_respostas: {"<id da afirmação>": 1..5, ...}
create or replace function public.salvar_bussola(p_respostas jsonb)
returns table (area_id bigint, area text, afinidade integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  faltando integer;
  invalidas integer;
  calculadas jsonb;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para salvar a Bússola.';
  end if;
  if p_respostas is null or jsonb_typeof(p_respostas) <> 'object' then
    raise exception 'Respostas inválidas.';
  end if;

  select count(*) into faltando
  from public.bussola_afirmacoes f
  where f.ativa and not (p_respostas ? f.id::text);
  if faltando > 0 then
    raise exception 'Responda todas as afirmações (faltam %).', faltando;
  end if;

  select count(*) into invalidas
  from jsonb_each(p_respostas) r
  where (case when jsonb_typeof(r.value) = 'number' then (r.value)::numeric else 0 end) not in (1, 2, 3, 4, 5)
     or not exists (select 1 from public.bussola_afirmacoes f where f.ativa and f.id::text = r.key);
  if invalidas > 0 then
    raise exception 'Cada resposta deve ser de 1 a 5, para uma afirmação da Bússola.';
  end if;

  -- Afinidade = (média - 1) / 4 → 0% (tudo 1) a 100% (tudo 5)
  select jsonb_object_agg(t.area_id::text, t.afinidade) into calculadas
  from (
    select f.area_id, round(100.0 * (avg((p_respostas ->> f.id::text)::numeric) - 1) / 4)::integer as afinidade
    from public.bussola_afirmacoes f
    where f.ativa
    group by f.area_id
  ) t;

  insert into public.bussola_resultados (aluno_id, respostas, afinidades, respondida_em)
  values (auth.uid(), p_respostas, calculadas, now())
  on conflict (aluno_id) do update
    set respostas = excluded.respostas, afinidades = excluded.afinidades, respondida_em = now();

  return query select * from public.minha_bussola_interna(auth.uid());
end;
$$;

-- Leitura do resultado com o nome das áreas (maior afinidade primeiro).
create or replace function public.minha_bussola_interna(p_aluno uuid)
returns table (area_id bigint, area text, afinidade integer)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.nome::text, (r.afinidades ->> a.id::text)::integer
  from public.bussola_resultados r
  join public.areas_carreira a on r.afinidades ? a.id::text
  where r.aluno_id = p_aluno
  order by 3 desc, 2;
$$;

revoke execute on function public.minha_bussola_interna(uuid) from public, anon, authenticated;

create or replace function public.minha_bussola()
returns table (area_id bigint, area text, afinidade integer)
language sql
stable
security definer
set search_path = public
as $$
  select * from public.minha_bussola_interna(auth.uid())
  where public.sessao_mfa_ok();
$$;

revoke execute on function public.salvar_bussola(jsonb) from public, anon;
grant execute on function public.salvar_bussola(jsonb) to authenticated;
revoke execute on function public.minha_bussola() from public, anon;
grant execute on function public.minha_bussola() to authenticated;


-- 5) Totais para o painel do admin (sem identificar ninguém): quantos responderam
--    e quantos alunos têm cada área como a de maior afinidade.
create or replace function public.estatisticas_bussola()
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
    'respondidas', (select count(*) from public.bussola_resultados),
    'area_preferida', (
      select coalesce(jsonb_agg(jsonb_build_object('area', area, 'total', total) order by total desc, area), '[]'::jsonb)
      from (
        select a.nome as area, count(*) as total
        from public.bussola_resultados r
        cross join lateral (
          select (e.key)::bigint as area_id
          from jsonb_each_text(r.afinidades) e
          order by (e.value)::integer desc, e.key
          limit 1
        ) top
        join public.areas_carreira a on a.id = top.area_id
        group by a.nome
      ) t
    )
  );
end;
$$;

revoke execute on function public.estatisticas_bussola() from public, anon;
grant execute on function public.estatisticas_bussola() to authenticated;
