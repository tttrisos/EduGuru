-- ============================================================
-- EduGuru — 09: log do pedido de "esqueci minha senha"
-- O e-mail é enviado pelo Supabase Auth. Limite: 5 registros por e-mail a cada 10 min.
-- ============================================================

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
