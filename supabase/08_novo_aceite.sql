-- ============================================================
-- EduGuru — 08: novo aceite do Termo/Política quando a versão muda
-- ============================================================

create or replace function public.registrar_aceite(versao text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sessão não encontrada.';
  end if;

  if not public.sessao_mfa_ok() then
    raise exception 'Confirme o código do autenticador (MFA) antes de aceitar os termos.';
  end if;

  if versao is null or versao !~ '^[0-9]{1,3}\.[0-9]{1,3}$' then
    raise exception 'Versão dos termos inválida.';
  end if;

  update public.perfis
  set consentimento_aceito = true,
      consentimento_em = now(),
      versao_termos = versao
  where id = auth.uid();
end;
$$;

revoke execute on function public.registrar_aceite(text) from public, anon;
grant execute on function public.registrar_aceite(text) to authenticated;
