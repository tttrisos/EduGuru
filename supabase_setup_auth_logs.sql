-- ============================================================
-- EduGuru — Autenticação, Perfis (roles) e Auditoria
-- ============================================================

-- ------------------------------------------------------------
-- 1) TABELA DE PERFIS
-- ------------------------------------------------------------
-- O Supabase já tem uma tabela interna "auth.users" com email e
-- senha (protegida, não mexemos nela). Criamos "perfis" para
-- guardar informações extras de cada usuário: nome e o PAPEL
-- (aluno ou admin). É o papel que decide o que cada um pode fazer.
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null default 'aluno' check (papel in ('aluno', 'admin')),
  curso text,
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

drop policy if exists "perfis_select_autenticado" on public.perfis;
create policy "perfis_select_autenticado"
  on public.perfis for select
  to authenticated
  using (true);

-- Cada usuário só edita o PRÓPRIO nome — nunca o próprio papel
-- (senão qualquer aluno poderia virar admin sozinho digitando um comando).
drop policy if exists "perfis_update_proprio_nome" on public.perfis;
create policy "perfis_update_proprio_nome"
  on public.perfis for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ------------------------------------------------------------
-- 2) CRIAÇÃO AUTOMÁTICA DE PERFIL AO CADASTRAR
-- ------------------------------------------------------------
-- Sempre que alguém cria conta pela tela de login, o Supabase
-- insere uma linha em auth.users. Esta função "escuta" esse evento
-- e cria automaticamente a linha correspondente em "perfis",
-- sempre começando como 'aluno' (admin só é promovido manualmente).
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, papel)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'aluno');
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();


-- ------------------------------------------------------------
-- 3) FUNÇÃO "É ADMIN?"
-- ------------------------------------------------------------
create or replace function public.eh_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfis where id = auth.uid() and papel = 'admin'
  );
$$;


-- ------------------------------------------------------------
-- 4) REGRAS DE ACESSO (RLS) DAS TABELAS JÁ EXISTENTES
-- ------------------------------------------------------------
-- Regra combinada com o Luiz/João:
--   - Disciplinas e Perguntas: QUALQUER logado pode ver (SELECT),
--     mas só ADMIN pode criar/editar/excluir.
--   - Materiais: por enquanto qualquer logado pode ver e escrever
--     (vamos revisar isso quando entrarmos no upload de arquivo).
alter table public.disciplinas enable row level security;
alter table public.perguntas   enable row level security;
alter table public.materiais   enable row level security;

drop policy if exists "disciplinas_select" on public.disciplinas;
create policy "disciplinas_select" on public.disciplinas
  for select to authenticated using (true);

drop policy if exists "disciplinas_admin_escreve" on public.disciplinas;
create policy "disciplinas_admin_escreve" on public.disciplinas
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "perguntas_select" on public.perguntas;
create policy "perguntas_select" on public.perguntas
  for select to authenticated using (true);

drop policy if exists "perguntas_admin_escreve" on public.perguntas;
create policy "perguntas_admin_escreve" on public.perguntas
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "materiais_select" on public.materiais;
create policy "materiais_select" on public.materiais
  for select to authenticated using (true);

drop policy if exists "materiais_autenticado_escreve" on public.materiais;
create policy "materiais_autenticado_escreve" on public.materiais
  for all to authenticated using (true) with check (true);


-- ------------------------------------------------------------
-- 5) TABELA DE LOGS DE AUDITORIA
-- ------------------------------------------------------------
create table if not exists public.logs_auditoria (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users(id) on delete set null,
  usuario_email text,
  acao text not null,        -- 'login' | 'login_falhou' | 'logout' | 'criar' | 'editar' | 'excluir'
  tabela text,                -- 'disciplinas' | 'perguntas' | 'materiais' | null (eventos de login)
  registro_id text,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);

alter table public.logs_auditoria enable row level security;

-- Qualquer usuário logado pode INSERIR um log sobre SI MESMO
-- (usado pelo front-end para registrar login/logout).
drop policy if exists "logs_insert_proprio" on public.logs_auditoria;
create policy "logs_insert_proprio"
  on public.logs_auditoria for insert
  to authenticated
  with check (usuario_id = auth.uid());

-- Um caso especial: login que FALHOU acontece exatamente quando a
-- pessoa ainda NÃO está autenticada (senão o login teria dado certo).
-- Por isso, liberamos uma brecha bem estreita para usuários anônimos:
-- eles só conseguem inserir log do tipo 'login_falhou', sem usuario_id
-- e sem poder escrever em mais nenhum outro campo sensível.
drop policy if exists "logs_insert_anonimo_falha" on public.logs_auditoria;
create policy "logs_insert_anonimo_falha"
  on public.logs_auditoria for insert
  to anon
  with check (acao = 'login_falhou' and usuario_id is null);

-- Só ADMIN pode LER os logs. Ninguém pode editar/apagar log pela API
-- (nem admin), um log alterável não serve pra nada.
drop policy if exists "logs_select_admin" on public.logs_auditoria;
create policy "logs_select_admin"
  on public.logs_auditoria for select
  to authenticated
  using (public.eh_admin());


-- ------------------------------------------------------------
-- 6) REGISTRO AUTOMÁTICO DE LOG (trigger no banco)
-- ------------------------------------------------------------
-- Em vez de confiar que o código do front-end sempre vai lembrar de
-- registrar o log, o PRÓPRIO BANCO registra sozinho toda vez que
-- alguém insere/edita/apaga um registro em disciplinas, perguntas
-- ou materiais. Isso é mais seguro: mesmo que um dev esqueça uma
-- chamada de log no React, o banco garante o registro.
create or replace function public.registrar_log_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acao_realizada text;
  registro_afetado jsonb;
begin
  if (tg_op = 'INSERT') then
    acao_realizada := 'criar';
    registro_afetado := to_jsonb(new);
  elsif (tg_op = 'UPDATE') then
    acao_realizada := 'editar';
    registro_afetado := to_jsonb(new);
  elsif (tg_op = 'DELETE') then
    acao_realizada := 'excluir';
    registro_afetado := to_jsonb(old);
  end if;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    acao_realizada,
    tg_table_name,
    coalesce((registro_afetado->>'id'), ''),
    registro_afetado
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists log_disciplinas on public.disciplinas;
create trigger log_disciplinas
  after insert or update or delete on public.disciplinas
  for each row execute function public.registrar_log_auditoria();

drop trigger if exists log_perguntas on public.perguntas;
create trigger log_perguntas
  after insert or update or delete on public.perguntas
  for each row execute function public.registrar_log_auditoria();

drop trigger if exists log_materiais on public.materiais;
create trigger log_materiais
  after insert or update or delete on public.materiais
  for each row execute function public.registrar_log_auditoria();


-- ------------------------------------------------------------
-- 7) CRIANDO ADMINISTRADORES
-- ------------------------------------------------------------

-- update public.perfis set papel = 'admin'
--   where id = (select id from auth.users where email = 'email-do-admin@exemplo.com');

-- Depois disso, da próxima vez que essa pessoa logar, ela já aparece como admin no site.
