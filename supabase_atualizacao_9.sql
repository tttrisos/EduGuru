-- ============================================================
-- EduGuru — Atualização 9: logs da redefinição de senha ("esqueci minha senha")
-- Rodar no SQL Editor do Supabase, DEPOIS da atualização 8.
-- Pode ser rodado mais de uma vez (idempotente).
--
-- O e-mail de redefinição é enviado pelo próprio Supabase Auth. Aqui só
-- registramos em auditoria:
--   - o PEDIDO de redefinição (acontece sem login, como o login_falhou);
--   - a redefinição CONCLUÍDA (com a sessão aberta pelo link do e-mail).
-- ============================================================


-- ------------------------------------------------------------
-- 1) Evento 'senha_redefinida' na lista fechada de eventos
-- ------------------------------------------------------------
-- Mesma função da atualização 5, com um evento a mais. 'senha_redefinida'
-- não exige aal2: uma conta que ainda não ativou o MFA também pode
-- redefinir a senha (quem tem MFA passa pelo código antes, na tela).
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

  if acao not in ('login', 'logout', 'mfa_ativado', 'mfa_falhou', 'senha_redefinida') then
    raise exception 'Evento de log não permitido: %', acao;
  end if;

  if acao in ('login', 'mfa_ativado') and not public.sessao_mfa_ok() then
    raise exception 'Evento % exige sessão com MFA concluído.', acao;
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


-- ------------------------------------------------------------
-- 2) Pedido de redefinição (sem login)
-- ------------------------------------------------------------
-- Mesmo cuidado do login_falhou: no máximo 5 registros por e-mail a cada
-- 10 minutos, para a função não virar porta de spam na tabela de logs.
-- O registro acontece mesmo que o e-mail não tenha conta (o site não
-- revela se a conta existe).
create or replace function public.registrar_pedido_redefinicao(email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  email_limpo text := lower(trim(left(coalesce(email, ''), 254)));
  recentes integer;
begin
  if email_limpo = '' then
    return;
  end if;

  select count(*) into recentes
  from public.logs_auditoria l
  where l.acao = 'redefinicao_senha_solicitada'
    and l.usuario_email = email_limpo
    and l.criado_em > now() - interval '10 minutes';

  if recentes >= 5 then
    return;
  end if;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (null, email_limpo, 'redefinicao_senha_solicitada', null, null, null);
end;
$$;

revoke execute on function public.registrar_pedido_redefinicao(text) from public;
grant execute on function public.registrar_pedido_redefinicao(text) to anon, authenticated;
