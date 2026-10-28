-- ============================================================
-- EduGuru — Atualização 10: ajustes de segurança pedidos na
-- validação de 05/10 (orientador)
-- Rodar no SQL Editor do Supabase, DEPOIS da atualização 9.
-- Pode ser rodado mais de uma vez (idempotente).
--
--   1) limpar_logs_antigos: prazo de 90 dias fixo DENTRO da função
--      (antes recebia "dias" como parâmetro);
--   2) log anônimo de login falho: só grava se o e-mail tem conta
--      (evita encher a tabela com e-mails inventados);
--   3) novo evento 'mfa_bloqueado' (limite de tentativas do código);
--   4) recuperação do MFA: admin pode redefinir o autenticador de um
--      usuário que perdeu o celular (antes só pelo painel do Supabase);
--   5) lista de usuários do admin mostra se o MFA está ativo.
-- ============================================================


-- ------------------------------------------------------------
-- 1) Limpeza manual de logs com prazo fixo
-- ------------------------------------------------------------
-- O orientador apontou: mesmo com o piso, deixar o prazo como parâmetro
-- é uma porta desnecessária. Agora a função não recebe nada e sempre
-- usa 90 dias. A versão antiga (com parâmetro) é apagada.
drop function if exists public.limpar_logs_antigos(integer);

create or replace function public.limpar_logs_antigos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  qtd_removida integer;
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem limpar logs.';
  end if;

  delete from public.logs_auditoria
  where criado_em < now() - interval '90 days';

  get diagnostics qtd_removida = row_count;

  -- A limpeza manual também fica registrada (quem fez e quantos saíram).
  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    'limpeza_manual', 'logs_auditoria', null,
    jsonb_build_object('removidos', qtd_removida, 'prazo_dias', 90)
  );

  return qtd_removida;
end;
$$;

revoke execute on function public.limpar_logs_antigos() from public, anon;
grant execute on function public.limpar_logs_antigos() to authenticated;


-- ------------------------------------------------------------
-- 2) Login falho (sem sessão): só para e-mails que têm conta
-- ------------------------------------------------------------
-- Continua com o limite de 20 registros por e-mail a cada 10 minutos.
-- A novidade: se o e-mail não pertence a nenhuma conta, nada é gravado.
-- Assim ninguém consegue criar logs com e-mails inventados. A função não
-- devolve nada, então quem chama não descobre se o e-mail existe.
create or replace function public.registrar_login_falhou(email text)
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

  if not exists (select 1 from auth.users u where lower(u.email) = email_limpo) then
    return;
  end if;

  select count(*) into recentes
  from public.logs_auditoria l
  where l.acao = 'login_falhou'
    and l.usuario_email = email_limpo
    and l.criado_em > now() - interval '10 minutes';

  if recentes >= 20 then
    return;
  end if;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (null, email_limpo, 'login_falhou', null, null, null);
end;
$$;

revoke execute on function public.registrar_login_falhou(text) from public;
grant execute on function public.registrar_login_falhou(text) to anon, authenticated;


-- ------------------------------------------------------------
-- 3) Evento 'mfa_bloqueado' na lista fechada
-- ------------------------------------------------------------
-- Depois de 5 códigos errados seguidos, a tela do MFA encerra a sessão
-- (a pessoa precisa digitar a senha de novo) e grava este evento.
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

  if acao not in ('login', 'logout', 'mfa_ativado', 'mfa_falhou', 'mfa_bloqueado', 'senha_redefinida') then
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
-- 4) Recuperação do MFA (perdeu o celular)
-- ------------------------------------------------------------
-- O admin apaga o autenticador do usuário. No próximo login (com senha),
-- a pessoa vê o QR Code de novo e cadastra o app outra vez.
-- A senha continua sendo exigida, então isso não abre a conta para
-- ninguém: só volta ao passo de cadastro do autenticador.
create or replace function public.redefinir_mfa_usuario(alvo uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem redefinir a verificação em duas etapas.';
  end if;

  if alvo = auth.uid() then
    raise exception 'Você não pode redefinir o seu próprio autenticador (peça a outro administrador).';
  end if;

  if not exists (select 1 from auth.users where id = alvo) then
    raise exception 'Usuário não encontrado.';
  end if;

  delete from auth.mfa_factors where user_id = alvo;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    'mfa_redefinido', 'perfis', alvo::text,
    jsonb_build_object('alvo_email', (select email from auth.users where id = alvo))
  );
end;
$$;

revoke execute on function public.redefinir_mfa_usuario(uuid) from public, anon;
grant execute on function public.redefinir_mfa_usuario(uuid) to authenticated;


-- ------------------------------------------------------------
-- 5) Lista de usuários do admin: com "MFA ativo?"
-- ------------------------------------------------------------
-- O formato de retorno mudou (coluna nova), por isso é preciso apagar
-- a função antiga antes de criar de novo.
drop function if exists public.listar_usuarios_admin();

create or replace function public.listar_usuarios_admin()
returns table (
  id uuid,
  nome text,
  email text,
  curso text,
  papel text,
  criado_em timestamptz,
  mfa_ativo boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem listar usuários.';
  end if;

  return query
    select p.id, p.nome, u.email::text, p.curso, p.papel, p.criado_em,
           exists (
             select 1 from auth.mfa_factors f
             where f.user_id = p.id and f.status = 'verified'
           )
    from public.perfis p
    join auth.users u on u.id = p.id
    order by p.nome;
end;
$$;

revoke execute on function public.listar_usuarios_admin() from public, anon;
grant execute on function public.listar_usuarios_admin() to authenticated;
