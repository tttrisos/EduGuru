-- ============================================================
-- EduGuru — Atualização 5: MFA (TOTP) exigido também no banco
-- Rodar no SQL Editor do Supabase, DEPOIS da atualização 4.
-- Pode ser rodado mais de uma vez (idempotente).
--
-- ANTES DE RODAR: confira no painel do Supabase, em
-- Authentication → Multi-Factor, se o TOTP está habilitado.
--
-- ATENÇÃO: depois deste SQL, quem estiver logado só com senha (sessão
-- "aal1") não lê nem grava mais nada. Rode junto com a publicação da
-- versão do site que tem a tela de MFA.
--
-- Por quê no banco e não só na tela: se o MFA ficasse só no front,
-- quem descobrisse a senha de alguém poderia chamar a API do Supabase
-- direto (a chave pública está no código do site) e pular a tela do
-- código de 6 dígitos. Com as regras abaixo, o próprio banco recusa
-- qualquer sessão que não tenha passado pelo segundo fator.
-- ============================================================


-- ------------------------------------------------------------
-- 1) "A sessão passou pelo MFA?"
-- ------------------------------------------------------------
-- O token (JWT) de uma sessão que concluiu o segundo fator traz
-- aal = 'aal2'. Só senha = 'aal1'.
create or replace function public.sessao_mfa_ok()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt()->>'aal', '') = 'aal2';
$$;

-- eh_admin() passa a exigir MFA também. Como todas as funções de admin
-- (limpar logs, excluir conta etc.) usam eh_admin(), nenhuma delas
-- funciona numa sessão só com senha, mesmo chamada direto pela API.
create or replace function public.eh_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.sessao_mfa_ok() and exists (
    select 1 from public.perfis where id = auth.uid() and papel = 'admin'
  );
$$;


-- ------------------------------------------------------------
-- 2) Políticas RESTRITIVAS: valem por cima de todas as outras
-- ------------------------------------------------------------
-- Políticas normais (permissivas) dizem "pode, se...". Uma política
-- "as restrictive" diz "além disso, SÓ pode se...". Assim não precisamos
-- reescrever cada política existente: basta uma por tabela.
drop policy if exists "mfa_obrigatorio" on public.perfis;
create policy "mfa_obrigatorio" on public.perfis
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop policy if exists "mfa_obrigatorio" on public.disciplinas;
create policy "mfa_obrigatorio" on public.disciplinas
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop policy if exists "mfa_obrigatorio" on public.perguntas;
create policy "mfa_obrigatorio" on public.perguntas
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop policy if exists "mfa_obrigatorio" on public.materiais;
create policy "mfa_obrigatorio" on public.materiais
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

drop policy if exists "mfa_obrigatorio" on public.logs_auditoria;
create policy "mfa_obrigatorio" on public.logs_auditoria
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

-- Arquivos do bucket "materiais" também exigem MFA.
drop policy if exists "materiais_arquivos_mfa_obrigatorio" on storage.objects;
create policy "materiais_arquivos_mfa_obrigatorio" on storage.objects
  as restrictive for all to authenticated
  using (bucket_id <> 'materiais' or public.sessao_mfa_ok())
  with check (bucket_id <> 'materiais' or public.sessao_mfa_ok());


-- ------------------------------------------------------------
-- 3) Eventos de acesso com MFA
-- ------------------------------------------------------------
-- 'login' agora significa LOGIN CONCLUÍDO (senha + código), então só
-- é aceito em sessão aal2; o mesmo vale para 'mfa_ativado'.
-- 'mfa_falhou' acontece justamente antes do MFA (aal1) e 'logout' pode
-- acontecer na tela do código (a pessoa desistiu), então esses dois
-- continuam aceitos sem aal2.
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

  if acao not in ('login', 'logout', 'mfa_ativado', 'mfa_falhou') then
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
-- 4) Perdeu o celular?
-- ------------------------------------------------------------
-- Não há autorrecuperação nesta versão. Um administrador remove o fator
-- pelo painel: Authentication → Users → (usuário) → remover fator MFA.
-- No próximo login, a pessoa cadastra o autenticador de novo.
