-- ============================================================
-- EduGuru — 13: disciplinas da grade de cada curso da UMC
-- No final ficam SÓ as disciplinas desta grade. Disciplina comum a mais de
-- um curso é cadastrada uma vez só, com todos os cursos na coluna "cursos"
-- (ex.: Banco de Dados = SI, ADS e ES). Pode ser rodado de novo.
-- ============================================================


-- 0) Uma disciplina pode ser de mais de um curso. "curso" fica sendo o primeiro da lista.
alter table public.disciplinas add column if not exists cursos text[];

update public.disciplinas set cursos = array[curso] where cursos is null or cardinality(cursos) = 0;

alter table public.disciplinas drop constraint if exists disciplinas_cursos_validos;
alter table public.disciplinas
  add constraint disciplinas_cursos_validos
  check (cardinality(cursos) > 0 and cursos <@ array['SI', 'ADS', 'ES']);

create or replace function public.sincronizar_cursos_disciplina()
returns trigger
language plpgsql
as $$
begin
  if new.cursos is null or cardinality(new.cursos) = 0 then
    new.cursos := array[new.curso];
  end if;
  new.curso := new.cursos[1];
  return new;
end;
$$;

drop trigger if exists sincronizar_cursos_disciplina on public.disciplinas;
create trigger sincronizar_cursos_disciplina
  before insert or update on public.disciplinas
  for each row execute function public.sincronizar_cursos_disciplina();


-- 1) Grade dos cursos (tabela temporária, só existe durante este script)
drop table if exists pg_temp.grade_umc;
create temp table grade_umc (ordem serial, nome text, curso text);

insert into grade_umc (nome, curso) values
  -- Sistemas de Informação: unidades curriculares de área (UCA)
  ('Software Básico', 'SI'),
  ('Redes e Segurança', 'SI'),
  ('Banco de Dados', 'SI'),
  -- Sistemas de Informação: unidades curriculares profissionalizantes (UCP)
  ('Fundamentos de Sistemas de Informação', 'SI'),
  ('Lógica Computacional', 'SI'),
  ('Programação de Software', 'SI'),
  ('Engenharia de Software', 'SI'),
  ('Administração de Sistemas de Informação', 'SI'),
  ('Gestão de Projetos', 'SI'),
  ('Inteligência de Negócios', 'SI'),
  ('Banco de Dados Avançado', 'SI'),
  ('Políticas de Segurança da Informação', 'SI'),
  ('Paradigmas de Orientação a Objetos', 'SI'),
  ('Estruturas Lineares', 'SI'),
  ('Programação para Internet', 'SI'),
  ('Aplicativos Web', 'SI'),
  -- Análise e Desenvolvimento de Sistemas: UCA
  ('Software Básico', 'ADS'),
  ('Redes e Segurança', 'ADS'),
  ('Banco de Dados', 'ADS'),
  -- Análise e Desenvolvimento de Sistemas: UCP
  ('Automação Inteligente com Low-Code', 'ADS'),
  ('Implementação e Testes de Projetos de Software I - Orientação', 'ADS'),
  ('Lógica e Programação', 'ADS'),
  ('Inovação e Estratégia em Inteligência Artificial', 'ADS'),
  ('Implementação e Testes de Projetos de Software II - Orientação', 'ADS'),
  ('Administração de Sistemas de Informação', 'ADS'),
  ('Projeto de Software e Segurança da Informação', 'ADS'),
  ('Governança de TI', 'ADS'),
  ('Análise e Implementação de Software', 'ADS'),
  -- Análise e Desenvolvimento de Sistemas: projeto prático (PP)
  ('Implementação e Testes de Projetos de Software III - Orientação', 'ADS'),
  ('Implementação e Testes de Projetos de Software', 'ADS'),
  ('Padrões de Projetos Orientados a Objetos - Orientação', 'ADS'),
  ('Padrões de Projetos Orientados a Objetos', 'ADS'),
  -- Engenharia de Software: UCA
  ('Software Básico', 'ES'),
  ('Redes e Arquitetura Computacional', 'ES'),
  ('Banco de Dados', 'ES'),
  -- Engenharia de Software: UCP
  ('Engenharia de Software', 'ES'),
  ('Análise Orientada aos Objetos', 'ES'),
  ('Implementação Orientada aos Objetos', 'ES'),
  ('Métodos Ágeis', 'ES'),
  ('Desenvolvimento de Aplicações', 'ES'),
  ('Inteligência de Negócios', 'ES'),
  ('Padrões de Projetos', 'ES'),
  ('Gestão de Projetos', 'ES'),
  ('Inteligência Artificial', 'ES'),
  ('Segurança da Informação', 'ES'),
  ('Internet das Coisas (IoT)', 'ES'),
  ('Análise e Projeto de Software', 'ES'),
  ('Desenvolvimento de Software Corporativo', 'ES');


-- 2) Disciplinas da primeira versão viram a equivalente da grade
--    (mantém as perguntas, notas e materiais ligados a elas)
update public.disciplinas set nome = 'Lógica e Programação', curso = 'ADS'
where lower(nome) = lower('Algoritmos e Lógica de Programação')
  and not exists (select 1 from public.disciplinas where lower(nome) = lower('Lógica e Programação'));

update public.disciplinas set nome = 'Estruturas Lineares', curso = 'SI'
where lower(nome) = lower('Estruturas de Dados')
  and not exists (select 1 from public.disciplinas where lower(nome) = lower('Estruturas Lineares'));

update public.disciplinas set nome = 'Redes e Segurança', curso = 'SI'
where lower(nome) = lower('Redes de Computadores')
  and not exists (select 1 from public.disciplinas where lower(nome) = lower('Redes e Segurança'));


-- 3) Inclui as disciplinas da grade que ainda não existem
insert into public.disciplinas (nome, curso)
select distinct on (lower(g.nome)) g.nome, g.curso
from grade_umc g
where not exists (
  select 1 from public.disciplinas d where lower(d.nome) = lower(g.nome)
)
order by lower(g.nome), g.ordem;


-- 4) Cada disciplina da grade recebe todos os cursos em que aparece (na ordem SI, ADS, ES)
update public.disciplinas d
set cursos = (
  select array_agg(g.curso order by g.ordem) from grade_umc g where lower(g.nome) = lower(d.nome)
)
where exists (select 1 from grade_umc g where lower(g.nome) = lower(d.nome));


-- 5) Remove repetidas (mesmo nome) sem nada ligado a elas; fica a mais antiga
delete from public.disciplinas d
where exists (
    select 1 from public.disciplinas o
    where lower(o.nome) = lower(d.nome) and o.id < d.id
  )
  and not exists (select 1 from public.perguntas p where p.disciplina_id = d.id)
  and not exists (select 1 from public.notas n where n.disciplina_id = d.id)
  and not exists (select 1 from public.materiais m where m.disciplina_id = d.id)
  and not exists (select 1 from public.tentativas_quiz t where t.disciplina_id = d.id);


-- 6) Remove as disciplinas que não estão na grade
--    (as perguntas e notas delas também saem; materiais e quizzes ficam sem disciplina)
delete from public.disciplinas d
where not exists (select 1 from grade_umc g where lower(g.nome) = lower(d.nome));


-- Conferência: disciplinas por curso (as comuns contam em cada curso) — SI 16, ADS 16, ES 16
select c.curso, count(*) as disciplinas
from public.disciplinas d, unnest(d.cursos) as c(curso)
group by c.curso
order by c.curso;
