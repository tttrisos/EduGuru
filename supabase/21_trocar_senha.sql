-- ============================================================
-- EduGuru — 21: trocar a senha estando logado (tela Minha conta)
--
-- Antes: para trocar a senha era preciso sair e usar "Esqueci minha senha".
-- Agora: em Minha conta o usuário informa a senha atual e a nova.
--   1) conferir_senha_atual(): confere a senha atual SEM abrir outra sessão
--      (abrir outra sessão perderia a verificação em duas etapas). Compara com o
--      hash guardado pelo Supabase Auth (bcrypt, função crypt do pgcrypto).
--      5 erros em 15 minutos bloqueiam novas tentativas por um tempo.
--   2) a nova senha é gravada pelo próprio Supabase Auth (supabase.auth.updateUser)
--      no front-end (TrocarSenha.tsx); ele também recusa senha igual à atual.
--   3) o evento 'senha_alterada' passa a ser aceito no log de auditoria.
-- Rodar depois do 20. Pode ser rodado de novo.
-- ============================================================

-- O Supabase já traz o pgcrypto no schema "extensions".
create extension if not exists pgcrypto with schema extensions;


-- 1) Conferir a senha atual do próprio usuário
create or replace function public.conferir_senha_atual(p_senha text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  hash_guardado text;
  erros_recentes integer;
  confere boolean;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para trocar a senha.';
  end if;

  -- Limite contra tentativa e erro: 5 senhas atuais erradas em 15 minutos.
  select count(*) into erros_recentes
  from public.logs_auditoria
  where usuario_id = auth.uid()
    and acao = 'senha_atual_incorreta'
    and criado_em > now() - interval '15 minutes';

  if erros_recentes >= 5 then
    raise exception 'Muitas tentativas com a senha atual errada. Espere 15 minutos e tente de novo.';
  end if;

  select encrypted_password into hash_guardado from auth.users where id = auth.uid();

  confere := hash_guardado is not null
             and coalesce(p_senha, '') <> ''
             and hash_guardado = extensions.crypt(p_senha, hash_guardado);

  if not confere then
    insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
    values (auth.uid(), (select email from auth.users where id = auth.uid()), 'senha_atual_incorreta', null, null, null);
  end if;

  return confere;
end;
$$;

revoke execute on function public.conferir_senha_atual(text) from public, anon;
grant execute on function public.conferir_senha_atual(text) to authenticated;


-- 2) Log: aceita o evento 'senha_alterada' (mesma função do script 10, com o evento novo)
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

  if acao not in ('login', 'logout', 'mfa_ativado', 'mfa_falhou', 'mfa_bloqueado', 'senha_redefinida', 'senha_alterada') then
    raise exception 'Evento de log não permitido: %', acao;
  end if;

  if acao in ('login', 'mfa_ativado', 'senha_alterada') and not public.sessao_mfa_ok() then
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
