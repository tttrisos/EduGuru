-- ============================================================
-- EduGuru — 23: verificação em duas etapas (MFA) opcional para alunos
--   Antes (script 05): toda sessão precisava do código do aplicativo (aal2),
--   e o banco recusava qualquer leitura sem ele.
--   Agora:
--   - ALUNO: o MFA é opcional; ele ativa e desativa em Minha conta.
--     Quem ATIVOU continua precisando do código em todo login: com só a
--     senha (aal1), o banco não libera nada. Quem não ativou entra só com a senha.
--   - ADMINISTRADOR: continua obrigatório. Sem o código, eh_admin() é falso
--     e nenhuma função de admin funciona, mesmo pela API.
--   As políticas "mfa_obrigatorio" de todas as tabelas continuam as mesmas:
--   o que muda é a função que elas chamam (sessao_mfa_ok).
-- Rodar depois do 22. Pode ser rodado de novo.
-- ============================================================


-- 1) A sessão tem o código do aplicativo? (aal2 = senha + código). Regra estrita.
create or replace function public.sessao_aal2()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt()->>'aal', '') = 'aal2';
$$;


-- 2) A sessão cumpre a verificação que a conta exige?
--    Conta COM MFA ativo: só com aal2. Conta SEM MFA: basta estar logado.
--    (security definer para conseguir ler auth.mfa_factors)
create or replace function public.sessao_mfa_ok()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    public.sessao_aal2()
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = auth.uid() and f.status = 'verified'
    )
  );
$$;


-- 3) Administrador: o código continua obrigatório (regra estrita).
create or replace function public.eh_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.sessao_aal2() and exists (
    select 1 from public.perfis where id = auth.uid() and papel = 'admin'
  );
$$;


-- 4) Log: aceita 'mfa_desativado' (mesma função dos scripts 10 e 21, com o evento novo)
create or replace function public.registrar_evento_auth(acao text, detalhes jsonb default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sessão não encontrada.';
  end if;

  if acao not in ('login', 'logout', 'mfa_ativado', 'mfa_desativado', 'mfa_falhou', 'mfa_bloqueado',
                  'senha_redefinida', 'senha_alterada') then
    raise exception 'Evento de log não permitido: %', acao;
  end if;

  if acao in ('login', 'mfa_ativado', 'mfa_desativado', 'senha_alterada') and not public.sessao_mfa_ok() then
    raise exception 'Evento % exige a verificação em duas etapas concluída.', acao;
  end if;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    acao, null, null, detalhes
  );
end;
$$;

revoke execute on function public.registrar_evento_auth(text, jsonb) from public, anon;
grant execute on function public.registrar_evento_auth(text, jsonb) to authenticated;


-- 5) Painel do admin: quantos alunos ativaram o MFA (só o total, sem nomes)
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
    where p.papel = 'aluno';
end;
$$;

revoke execute on function public.total_alunos_com_mfa() from public, anon;
grant execute on function public.total_alunos_com_mfa() to authenticated;
