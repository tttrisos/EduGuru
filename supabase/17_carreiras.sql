-- ============================================================
-- EduGuru — 17: EduGuru Carreiras
--   - áreas de carreira (Back-end, Front-end, Dados...) com as palavras-chave
--     usadas para filtrar as vagas da API do GitHub;
--   - ligação disciplina → área, mantida pelo admin;
--   - áreas sugeridas ao aluno: aquelas em que ele vai bem no quiz
--     (aproveitamento >= 60% com pelo menos 5 respostas, o oposto do Guru);
--   - registro dos cliques em "Candidatar-se" (um por aluno e vaga) e os
--     totais para o painel do admin.
-- O EduGuru não recebe currículo nem dado de candidatura: a vaga abre no site
-- de origem. Rodar depois do 16. Pode ser rodado de novo.
-- ============================================================


-- 1) Áreas de carreira
create table if not exists public.areas_carreira (
  id bigint generated always as identity primary key,
  nome text not null unique check (char_length(trim(nome)) between 2 and 60),
  descricao text check (descricao is null or char_length(descricao) <= 300),
  -- Termos procurados no título e nas etiquetas da vaga (sem acento, minúsculos).
  palavras_chave text[] not null default '{}'
    check (cardinality(palavras_chave) between 1 and 40)
);

alter table public.areas_carreira enable row level security;

drop policy if exists "areas_leitura" on public.areas_carreira;
create policy "areas_leitura" on public.areas_carreira
  for select to authenticated using (true);

drop policy if exists "areas_admin_escreve" on public.areas_carreira;
create policy "areas_admin_escreve" on public.areas_carreira
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "mfa_obrigatorio" on public.areas_carreira;
create policy "mfa_obrigatorio" on public.areas_carreira
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop trigger if exists log_areas_carreira on public.areas_carreira;
create trigger log_areas_carreira
  after insert or update or delete on public.areas_carreira
  for each row execute function public.registrar_log_auditoria();

-- Palavras-chave sempre sem acento, minúsculas, sem espaços nas pontas e sem repetição.
create or replace function public.normalizar_palavras_chave()
returns trigger
language plpgsql
as $$
begin
  new.nome := trim(new.nome);
  new.palavras_chave := (
    select coalesce(array_agg(distinct p order by p), '{}')
    from (
      select lower(public.sem_acento(trim(x))) as p
      from unnest(new.palavras_chave) as x
    ) t
    where p <> ''
  );
  if cardinality(new.palavras_chave) = 0 then
    raise exception 'Informe pelo menos uma palavra-chave.';
  end if;
  return new;
end;
$$;

drop trigger if exists normalizar_palavras_chave on public.areas_carreira;
create trigger normalizar_palavras_chave
  before insert or update on public.areas_carreira
  for each row execute function public.normalizar_palavras_chave();


-- 2) Disciplina → área (uma disciplina pode levar a mais de uma área)
create table if not exists public.disciplinas_areas (
  disciplina_id bigint not null references public.disciplinas(id) on delete cascade,
  area_id bigint not null references public.areas_carreira(id) on delete cascade,
  primary key (disciplina_id, area_id)
);

alter table public.disciplinas_areas enable row level security;

drop policy if exists "disciplinas_areas_leitura" on public.disciplinas_areas;
create policy "disciplinas_areas_leitura" on public.disciplinas_areas
  for select to authenticated using (true);

drop policy if exists "disciplinas_areas_admin_escreve" on public.disciplinas_areas;
create policy "disciplinas_areas_admin_escreve" on public.disciplinas_areas
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "mfa_obrigatorio" on public.disciplinas_areas;
create policy "mfa_obrigatorio" on public.disciplinas_areas
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());


-- 3) Áreas iniciais e ligações com as disciplinas da grade (script 13)
insert into public.areas_carreira (nome, descricao, palavras_chave) values
  ('Back-end', 'Servidores, APIs e regras de negócio.',
   array['back-end', 'backend', 'back end', 'api', 'node.js', 'nodejs', 'java', 'spring', 'python', 'django',
         'fastapi', 'php', 'laravel', 'c#', '.net', 'golang', 'ruby', 'kotlin', 'microservices', 'nestjs']),
  ('Front-end', 'Interfaces web, usabilidade e experiência do usuário.',
   array['front-end', 'frontend', 'front end', 'react', 'angular', 'vue', 'javascript', 'typescript',
         'css', 'html', 'next.js', 'ui', 'ux']),
  ('Full Stack', 'Do banco à tela: front-end e back-end juntos.',
   array['full stack', 'fullstack', 'full-stack']),
  ('Dados', 'Banco de dados, análise de dados e BI.',
   array['dados', 'data', 'sql', 'postgresql', 'mysql', 'oracle', 'mongodb', 'bi', 'power bi',
         'analytics', 'etl', 'dba', 'engenheiro de dados', 'analista de dados']),
  ('Infraestrutura e Segurança', 'Redes, nuvem, DevOps e segurança da informação.',
   array['devops', 'sre', 'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'linux', 'infra',
         'infraestrutura', 'redes', 'seguranca', 'security', 'ciberseguranca', 'terraform']),
  ('Qualidade e Testes', 'Testes de software, automação e qualidade.',
   array['qa', 'quality', 'qualidade', 'testes', 'teste', 'tester', 'testes automatizados', 'tdd']),
  ('Gestão e Produto', 'Gestão de projetos, produto, processos e governança de TI.',
   array['gerente de projetos', 'gestao', 'product owner', 'product manager', 'scrum', 'agile', 'agil',
         'tech lead', 'governanca', 'analista de negocios', 'analista de sistemas', 'po']),
  ('Inteligência Artificial', 'IA, aprendizado de máquina e automação inteligente.',
   array['ia', 'ai', 'inteligencia artificial', 'machine learning', 'llm', 'agentic', 'genai',
         'low-code', 'automacao'])
on conflict (nome) do nothing;

-- Liga as disciplinas pelo nome (só as que existem; pode rodar de novo).
insert into public.disciplinas_areas (disciplina_id, area_id)
select d.id, a.id
from (values
  ('Banco de Dados', 'Dados'),
  ('Banco de Dados', 'Back-end'),
  ('Banco de Dados Avançado', 'Dados'),
  ('Inteligência de Negócios', 'Dados'),
  ('Programação de Software', 'Back-end'),
  ('Lógica Computacional', 'Back-end'),
  ('Lógica e Programação', 'Back-end'),
  ('Paradigmas de Orientação a Objetos', 'Back-end'),
  ('Implementação Orientada aos Objetos', 'Back-end'),
  ('Padrões de Projetos Orientados a Objetos', 'Back-end'),
  ('Estruturas Lineares', 'Back-end'),
  ('Programação para Internet', 'Front-end'),
  ('Programação para Internet', 'Full Stack'),
  ('Aplicativos Web', 'Front-end'),
  ('Aplicativos Web', 'Full Stack'),
  ('Desenvolvimento de Aplicações', 'Full Stack'),
  ('Redes e Segurança', 'Infraestrutura e Segurança'),
  ('Redes e Arquitetura Computacional', 'Infraestrutura e Segurança'),
  ('Políticas de Segurança da Informação', 'Infraestrutura e Segurança'),
  ('Projeto de Software e Segurança da Informação', 'Infraestrutura e Segurança'),
  ('Software Básico', 'Infraestrutura e Segurança'),
  ('Implementação e Testes de Projetos de Software', 'Qualidade e Testes'),
  ('Engenharia de Software', 'Qualidade e Testes'),
  ('Engenharia de Software', 'Gestão e Produto'),
  ('Gestão de Projetos', 'Gestão e Produto'),
  ('Métodos Ágeis', 'Gestão e Produto'),
  ('Governança de TI', 'Gestão e Produto'),
  ('Administração de Sistemas de Informação', 'Gestão e Produto'),
  ('Fundamentos de Sistemas de Informação', 'Gestão e Produto'),
  ('Análise Orientada aos Objetos', 'Gestão e Produto'),
  ('Análise e Implementação de Software', 'Gestão e Produto'),
  ('Inovação e Estratégia em Inteligência Artificial', 'Inteligência Artificial'),
  ('Automação Inteligente com Low-Code', 'Inteligência Artificial'),
  ('Inteligência Artificial', 'Inteligência Artificial'),
  ('Inteligência Artificial', 'Dados'),
  ('Internet das Coisas (IoT)', 'Infraestrutura e Segurança'),
  ('Segurança da Informação', 'Infraestrutura e Segurança'),
  ('Desenvolvimento de Software Corporativo', 'Back-end'),
  ('Desenvolvimento de Software Corporativo', 'Full Stack'),
  ('Padrões de Projetos', 'Back-end'),
  ('Padrões de Projetos Orientados a Objetos - Orientação', 'Back-end'),
  ('Análise e Projeto de Software', 'Gestão e Produto'),
  ('Implementação e Testes de Projetos de Software I - Orientação', 'Qualidade e Testes'),
  ('Implementação e Testes de Projetos de Software II - Orientação', 'Qualidade e Testes'),
  ('Implementação e Testes de Projetos de Software III - Orientação', 'Qualidade e Testes')
) as v(disciplina, area)
join public.disciplinas d on lower(d.nome) = lower(v.disciplina)
join public.areas_carreira a on a.nome = v.area
on conflict do nothing;


-- 4) Áreas sugeridas ao aluno: as áreas das disciplinas em que ele vai bem
--    (>= 60% de acertos com pelo menos 5 respostas, mesmo corte do Guru).
create or replace function public.minhas_areas_carreira()
returns table (
  area_id bigint,
  area text,
  aproveitamento integer,
  disciplinas text[]
)
language sql
stable
security invoker
set search_path = public
as $$
  select a.id, a.nome::text,
         round(avg(d.aproveitamento))::integer,
         array_agg(d.disciplina order by d.aproveitamento desc)
  from public.meu_desempenho() d
  join public.disciplinas_areas da on da.disciplina_id = d.disciplina_id
  join public.areas_carreira a on a.id = da.area_id
  where d.respondidas >= 5
    and d.aproveitamento >= 60
  group by a.id, a.nome
  order by 3 desc, 2;
$$;

revoke execute on function public.minhas_areas_carreira() from public, anon;
grant execute on function public.minhas_areas_carreira() to authenticated;


-- 5) Cliques em "Candidatar-se": um por aluno e vaga (contar de novo não infla o total).
--    Guarda só qual vaga (pública) e quando; ninguém lê as linhas pela API, só os totais.
create table if not exists public.cliques_vagas (
  id bigint generated always as identity primary key,
  aluno_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  area_id bigint references public.areas_carreira(id) on delete set null,
  fonte text not null check (fonte in ('backend-br/vagas', 'frontendbr/vagas')),
  vaga_numero integer not null check (vaga_numero > 0),
  vaga_titulo text not null check (char_length(vaga_titulo) between 1 and 300),
  clicado_em timestamptz not null default now(),
  unique (aluno_id, fonte, vaga_numero)
);

alter table public.cliques_vagas enable row level security;

drop policy if exists "mfa_obrigatorio" on public.cliques_vagas;
create policy "mfa_obrigatorio" on public.cliques_vagas
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());
-- O aluno lê só os próprios cliques (direito de acesso: entram no "Baixar meus dados").
-- Gravar é só pela função abaixo; o admin vê apenas os totais.
drop policy if exists "cliques_proprios_leitura" on public.cliques_vagas;
create policy "cliques_proprios_leitura" on public.cliques_vagas
  for select to authenticated using (aluno_id = auth.uid());

create or replace function public.registrar_clique_vaga(
  p_fonte text,
  p_vaga_numero integer,
  p_vaga_titulo text,
  p_area_id bigint default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inseridas integer;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para registrar o clique.';
  end if;
  if p_fonte not in ('backend-br/vagas', 'frontendbr/vagas') then
    raise exception 'Fonte de vagas desconhecida.';
  end if;
  if p_vaga_numero is null or p_vaga_numero <= 0 then
    raise exception 'Número da vaga inválido.';
  end if;
  if p_area_id is not null and not exists (select 1 from public.areas_carreira where id = p_area_id) then
    p_area_id := null;
  end if;

  insert into public.cliques_vagas (aluno_id, area_id, fonte, vaga_numero, vaga_titulo)
  values (auth.uid(), p_area_id, p_fonte, p_vaga_numero, left(trim(coalesce(p_vaga_titulo, '')), 300))
  on conflict (aluno_id, fonte, vaga_numero) do nothing;

  get diagnostics inseridas = row_count;
  return inseridas > 0; -- true = primeiro clique deste aluno nesta vaga
end;
$$;

revoke execute on function public.registrar_clique_vaga(text, integer, text, bigint) from public, anon;
grant execute on function public.registrar_clique_vaga(text, integer, text, bigint) to authenticated;


-- 6) Totais para o painel do admin (sem identificar quem clicou)
create or replace function public.estatisticas_carreiras()
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
    'cliques', (select count(*) from public.cliques_vagas),
    'cliques_30_dias', (select count(*) from public.cliques_vagas where clicado_em >= now() - interval '30 days'),
    'alunos_que_clicaram', (select count(distinct aluno_id) from public.cliques_vagas),
    'cliques_por_area', (
      select coalesce(jsonb_agg(jsonb_build_object('area', area, 'total', total) order by total desc, area), '[]'::jsonb)
      from (
        select coalesce(a.nome, 'Sem área') as area, count(*) as total
        from public.cliques_vagas c
        left join public.areas_carreira a on a.id = c.area_id
        group by 1
      ) t
    ),
    'vagas_mais_clicadas', (
      select coalesce(jsonb_agg(jsonb_build_object('titulo', vaga_titulo, 'total', total) order by total desc), '[]'::jsonb)
      from (
        select vaga_titulo, count(*) as total
        from public.cliques_vagas
        group by fonte, vaga_numero, vaga_titulo
        order by total desc, max(clicado_em) desc
        limit 5
      ) t
    )
  );
end;
$$;

revoke execute on function public.estatisticas_carreiras() from public, anon;
grant execute on function public.estatisticas_carreiras() to authenticated;


-- 7) Retenção: os cliques são apagados com a conta (on delete cascade) e, no máximo,
--    depois de 12 meses (mesmo agendador dos logs, script 06).
create or replace function public.limpar_cliques_vagas_automatico()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  qtd integer;
begin
  delete from public.cliques_vagas where clicado_em < now() - interval '12 months';
  get diagnostics qtd = row_count;
  return qtd;
end;
$$;

revoke execute on function public.limpar_cliques_vagas_automatico() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'limpeza-cliques-vagas';

select cron.schedule(
  'limpeza-cliques-vagas',
  '15 6 * * *',
  $$select public.limpar_cliques_vagas_automatico();$$
);
