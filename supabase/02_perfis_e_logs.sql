-- ============================================================
-- EduGuru — 02: perfis (aluno/admin), regras de acesso e logs de auditoria
-- ============================================================


-- 1) Perfis: dados extras de cada usuário do Supabase Auth
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null default 'aluno' check (papel in ('aluno', 'admin')),
  curso text,
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

drop policy if exists "perfis_update_proprio_nome" on public.perfis;
create policy "perfis_update_proprio_nome"
  on public.perfis for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- 2) Cria o perfil automaticamente no cadastro (sempre como aluno)
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


-- 3) "É admin?"
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


-- 4) Regras de acesso (RLS): todos leem; só admin altera disciplinas e perguntas
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


-- 5) Logs de auditoria (ninguém edita nem apaga pela API)
create table if not exists public.logs_auditoria (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users(id) on delete set null,
  usuario_email text,
  acao text not null,
  tabela text,
  registro_id text,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);

alter table public.logs_auditoria enable row level security;

drop policy if exists "logs_select_admin" on public.logs_auditoria;
create policy "logs_select_admin"
  on public.logs_auditoria for select
  to authenticated
  using (public.eh_admin());


-- 6) Log automático de criar/editar/excluir
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


-- 7) Para tornar alguém administrador (rodar à mão):
-- update public.perfis set papel = 'admin'
--   where id = (select id from auth.users where email = 'email-do-admin@exemplo.com');
