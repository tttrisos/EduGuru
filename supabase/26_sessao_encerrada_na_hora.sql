-- ============================================================
-- EduGuru — 26: "Sair dos outros aparelhos" vale NA HORA
--   Antes: o "sair dos outros" do Supabase apagava as outras sessões, mas o
--   token que o outro aparelho já tinha continuava aceito pelo banco até
--   vencer (até 1 hora).
--   Agora: toda regra de segurança confere também se a sessão do token ainda
--   existe (tabela auth.sessions). Sessão encerrada → o banco não devolve
--   nada na hora, e o site manda o outro aparelho para o login.
--   Também: Minha conta marca qual aparelho lembrado é "este aparelho".
-- Rodar depois do 25. Pode ser rodado de novo.
-- ============================================================


-- 1) A sessão deste token ainda existe? (sem session_id no token, como em chamadas internas: não bloqueia)
create or replace function public.sessao_ativa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.sessao_atual() is null
      or exists (select 1 from auth.sessions s where s.id = public.sessao_atual());
$$;
revoke execute on function public.sessao_ativa() from public, anon;
grant execute on function public.sessao_ativa() to authenticated;


-- 2) A REGRA (mesma do script 25) + sessão ativa
create or replace function public.sessao_mfa_ok()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and public.sessao_ativa() and (
    public.sessao_aal2()
    or (
      not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = auth.uid() and f.status = 'verified'
      )
      and (
        not public.codigo_email_ligado()
        or public.sessao_email_ok()
        or exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
      )
    )
  );
$$;


-- 3) Administrador (mesma do script 23) + sessão ativa
create or replace function public.eh_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.sessao_ativa() and public.sessao_aal2() and exists (
    select 1 from public.perfis where id = auth.uid() and papel = 'admin'
  );
$$;


-- 4) Minha conta: agora recebe o token deste navegador para marcar "este aparelho"
drop function if exists public.meus_acessos();
create or replace function public.meus_acessos(p_token text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  meu_email text;
  meu_hash text := case when p_token is null then null else public.resumo_seguro(p_token) end;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre na sua conta para ver os seus acessos.';
  end if;
  select email into meu_email from auth.users where id = auth.uid();

  return jsonb_build_object(
    'logins', coalesce((
      select jsonb_agg(jsonb_build_object(
               'quando', l.criado_em,
               'aparelho', l.detalhes->>'aparelho',
               'com_codigo', coalesce(l.detalhes->>'mfa', '') = 'totp',
               'verificacao', coalesce(l.detalhes->>'mfa', 'nao')
             ) order by l.criado_em desc)
      from (
        select criado_em, detalhes from public.logs_auditoria
        where usuario_id = auth.uid() and acao = 'login'
        order by criado_em desc
        limit 10
      ) l
    ), '[]'::jsonb),
    'senhas_erradas_30_dias', (
      select count(*) from public.logs_auditoria
      where acao = 'login_falhou' and usuario_email = meu_email
        and criado_em > now() - interval '30 days'
    ),
    'ultima_senha_errada', (
      select max(criado_em) from public.logs_auditoria
      where acao = 'login_falhou' and usuario_email = meu_email
    ),
    'aparelhos_lembrados', coalesce((
      select jsonb_agg(jsonb_build_object(
               'aparelho', a.aparelho, 'ultimo_uso', a.ultimo_uso, 'expira_em', a.expira_em,
               'este', meu_hash is not null and a.token_hash = meu_hash
             ) order by a.ultimo_uso desc)
      from public.aparelhos_lembrados a
      where a.usuario_id = auth.uid() and a.expira_em > now()
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.meus_acessos(text) from public, anon;
grant execute on function public.meus_acessos(text) to authenticated;
