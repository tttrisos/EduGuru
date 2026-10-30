-- ============================================================
-- EduGuru — 07: direitos do titular (LGPD) e exclusão de conta
-- ============================================================


-- 1) Cada usuário lê os próprios logs
drop policy if exists "logs_select_proprio" on public.logs_auditoria;
create policy "logs_select_proprio" on public.logs_auditoria
  for select to authenticated
  using (usuario_id = auth.uid());


-- 2) Excluir a própria conta (perfil e materiais saem junto; o log fica até 90 dias)
create or replace function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  qtd_materiais integer;
begin
  if uid is null then
    raise exception 'Sessão não encontrada.';
  end if;

  if not public.sessao_mfa_ok() then
    raise exception 'Confirme o código do autenticador (MFA) antes de excluir a conta.';
  end if;

  -- O sistema não pode ficar sem administrador.
  if exists (select 1 from public.perfis where id = uid and papel = 'admin')
     and (select count(*) from public.perfis where papel = 'admin') <= 1 then
    raise exception 'Você é o único administrador. Promova outra pessoa a admin antes de excluir sua conta.';
  end if;

  delete from public.materiais where enviado_por = uid;
  get diagnostics qtd_materiais = row_count;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (
    uid,
    (select email from auth.users where id = uid),
    'conta_excluida', 'perfis', uid::text,
    jsonb_build_object('por', 'titular', 'materiais_removidos', qtd_materiais)
  );

  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;


-- 3) Exclusão de conta pelo administrador
create or replace function public.excluir_conta_usuario(alvo uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  qtd_materiais integer;
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem excluir contas de outros usuários.';
  end if;

  if alvo = auth.uid() then
    raise exception 'Para excluir a sua própria conta, use a tela Minha conta.';
  end if;

  if not exists (select 1 from auth.users where id = alvo) then
    raise exception 'Usuário não encontrado.';
  end if;

  delete from public.materiais where enviado_por = alvo;
  get diagnostics qtd_materiais = row_count;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    'conta_excluida', 'perfis', alvo::text,
    jsonb_build_object(
      'por', 'admin',
      'alvo_email', (select email from auth.users where id = alvo),
      'materiais_removidos', qtd_materiais
    )
  );

  delete from auth.users where id = alvo;
end;
$$;

revoke execute on function public.excluir_conta_usuario(uuid) from public, anon;
grant execute on function public.excluir_conta_usuario(uuid) to authenticated;
