-- ============================================================
-- EduGuru — Atualização 7: direitos do titular (LGPD) e exclusão de conta
-- Rodar no SQL Editor do Supabase, DEPOIS da atualização 6.
-- Pode ser rodado mais de uma vez (idempotente).
--
-- RF15 (exclusão de conta) e LGPD art. 18 (acesso, correção, revogação
-- do consentimento e eliminação), exercidos pela tela "Minha conta".
-- ============================================================


-- ------------------------------------------------------------
-- 1) Acesso: o titular enxerga os próprios registros de log
-- ------------------------------------------------------------
-- Antes só admin lia logs. O direito de acesso (art. 18, II) inclui os
-- registros de atividade ligados à pessoa, então cada um passa a ler os
-- SEUS (admin continua lendo todos pela política "logs_select_admin").
drop policy if exists "logs_select_proprio" on public.logs_auditoria;
create policy "logs_select_proprio" on public.logs_auditoria
  for select to authenticated
  using (usuario_id = auth.uid());


-- ------------------------------------------------------------
-- 2) Exclusão da própria conta
-- ------------------------------------------------------------
-- A conta de autenticação (auth.users) só pode ser apagada com
-- privilégio de servidor. Em vez de expor a chave service_role no site
-- (nunca!), esta função roda com o privilégio do dono do banco
-- ("security definer") e só apaga a conta de QUEM CHAMOU.
--
-- O que acontece com cada dado:
--   - perfil: apagado (cascata a partir de auth.users);
--   - fator MFA e sessões: apagados pelo próprio Supabase Auth;
--   - materiais enviados pela pessoa: apagados (são arquivos pessoais
--     de estudo). O ARQUIVO no Storage é removido antes pelo site,
--     pela API de Storage — o Supabase não deixa apagar arquivo por SQL;
--   - logs de auditoria: mantidos até completar 90 dias (segurança e
--     rastreabilidade, legítimo interesse), com usuario_id = null mas
--     ainda com o e-mail; depois somem pela limpeza automática.
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

  -- Não deixa o sistema ficar sem nenhum administrador.
  if exists (select 1 from public.perfis where id = uid and papel = 'admin')
     and (select count(*) from public.perfis where papel = 'admin') <= 1 then
    raise exception 'Você é o único administrador. Promova outra pessoa a admin antes de excluir sua conta.';
  end if;

  delete from public.materiais where enviado_por = uid;
  get diagnostics qtd_materiais = row_count;

  -- O log é gravado ANTES de apagar a conta (depois, o usuário não existe mais).
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


-- ------------------------------------------------------------
-- 3) Exclusão de conta por administrador
-- ------------------------------------------------------------
-- eh_admin() já exige sessão com MFA (atualização 5).
-- O admin não usa esta função para apagar a si mesmo (usa a de cima),
-- então sempre sobra pelo menos um administrador.
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


-- ------------------------------------------------------------
-- 4) Lista de usuários para o admin
-- ------------------------------------------------------------
-- O e-mail fica em auth.users (não acessível pelo site). Esta função
-- devolve só o necessário para o admin identificar a conta a gerenciar.
-- Cidade/estado ficam de fora de propósito (minimização).
create or replace function public.listar_usuarios_admin()
returns table (
  id uuid,
  nome text,
  email text,
  curso text,
  papel text,
  criado_em timestamptz
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
    select p.id, p.nome, u.email::text, p.curso, p.papel, p.criado_em
    from public.perfis p
    join auth.users u on u.id = p.id
    order by p.nome;
end;
$$;

revoke execute on function public.listar_usuarios_admin() from public, anon;
grant execute on function public.listar_usuarios_admin() to authenticated;
