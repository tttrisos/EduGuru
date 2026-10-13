-- ============================================================
-- EduGuru — Atualização 8: novo aceite do Termo/Política (reaceite)
-- Rodar no SQL Editor do Supabase, DEPOIS da atualização 7.
-- Pode ser rodado mais de uma vez (idempotente).
--
-- Por quê: contas criadas antes da atualização 4 não têm nenhum registro
-- de aceite no banco (o aceite existia só na tela). Além disso, sempre
-- que o Termo/Política mudarem de versão, o site pede um novo aceite
-- antes de liberar a área logada. O aceite é gravado por esta função
-- porque as colunas de consentimento NÃO podem ser alteradas direto pelo
-- usuário (atualização 4 só libera nome, curso, cidade e estado).
--
-- O registro em log é automático: o gatilho de auditoria de perfis grava
-- "editar perfis" com os campos alterados (consentimento_em, versao_termos).
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

  -- Só aceita formato de versão (ex.: 1.1), para ninguém gravar texto livre.
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
