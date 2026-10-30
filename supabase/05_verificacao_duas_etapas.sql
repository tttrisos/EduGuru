-- ============================================================
-- EduGuru — 05: verificação em duas etapas (MFA) exigida pelo banco
-- Antes: habilitar o TOTP em Authentication → Multi-Factor.
-- ============================================================


-- 1) A sessão passou pelo MFA? (aal2 = senha + código)
create or replace function public.sessao_mfa_ok()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt()->>'aal', '') = 'aal2';
$$;

-- Admin também precisa estar com MFA.
create or replace function public.eh_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.sessao_mfa_ok() and exists (
    select 1 from public.perfis where id = auth.uid() and papel = 'admin'
  );
$$;


-- 2) Sem MFA, nenhuma tabela pode ser lida ou alterada
drop policy if exists "mfa_obrigatorio" on public.perfis;
create policy "mfa_obrigatorio" on public.perfis
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop policy if exists "mfa_obrigatorio" on public.disciplinas;
create policy "mfa_obrigatorio" on public.disciplinas
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop policy if exists "mfa_obrigatorio" on public.perguntas;
create policy "mfa_obrigatorio" on public.perguntas
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop policy if exists "mfa_obrigatorio" on public.materiais;
create policy "mfa_obrigatorio" on public.materiais
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop policy if exists "mfa_obrigatorio" on public.logs_auditoria;
create policy "mfa_obrigatorio" on public.logs_auditoria
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop policy if exists "materiais_arquivos_mfa_obrigatorio" on storage.objects;
create policy "materiais_arquivos_mfa_obrigatorio" on storage.objects
  as restrictive for all to authenticated
  using (bucket_id <> 'materiais' or public.sessao_mfa_ok())
  with check (bucket_id <> 'materiais' or public.sessao_mfa_ok());
