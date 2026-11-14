-- ============================================================
-- EduGuru — 24: últimos acessos em Minha conta e filtros nos logs
--   - meus_acessos(): o próprio usuário vê os últimos logins (com o tipo de
--     aparelho, ex.: "Chrome no Windows") e quantas vezes erraram a senha da
--     conta dele nos últimos 30 dias (essas falhas são gravadas sem usuario_id,
--     só com o e-mail, por isso não aparecem na lista comum de registros);
--   - log aceita 'sessoes_encerradas' ("Sair dos outros aparelhos");
--   - índices para os filtros da tela de Logs (por data, por ação e por e-mail).
-- Rodar depois do 23. Pode ser rodado de novo.
-- ============================================================


-- 1) Log: aceita 'sessoes_encerradas' (mesma função dos scripts 10, 21 e 23, com o evento novo)
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
                  'senha_redefinida', 'senha_alterada', 'sessoes_encerradas') then
    raise exception 'Evento de log não permitido: %', acao;
  end if;

  if acao in ('login', 'mfa_ativado', 'mfa_desativado', 'senha_alterada', 'sessoes_encerradas')
     and not public.sessao_mfa_ok() then
    raise exception 'Evento % exige a verificação em duas etapas concluída.', acao;
  end if;

  -- Detalhes vêm do navegador: só aceita um objeto pequeno (ex.: {"mfa":"nao","aparelho":"Chrome no Windows"}).
  if detalhes is not null and (jsonb_typeof(detalhes) <> 'object' or length(detalhes::text) > 300) then
    raise exception 'Detalhes do log inválidos.';
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


-- 2) Últimos acessos do próprio usuário (Minha conta)
create or replace function public.meus_acessos()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  meu_email text;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre na sua conta para ver os seus acessos.';
  end if;
  select email into meu_email from auth.users where id = auth.uid();

  return jsonb_build_object(
    'logins', coalesce((
      select jsonb_agg(jsonb_build_object(
               'quando', l.criado_em,
               'aparelho', l.detalhes->>'aparelho',
               'com_codigo', coalesce(l.detalhes->>'mfa', '') = 'totp'
             ) order by l.criado_em desc)
      from (
        select criado_em, detalhes from public.logs_auditoria
        where usuario_id = auth.uid() and acao = 'login'
        order by criado_em desc
        limit 10
      ) l
    ), '[]'::jsonb),
    'senhas_erradas_30_dias', (
      select count(*) from public.logs_auditoria
      where acao = 'login_falhou' and usuario_email = meu_email
        and criado_em > now() - interval '30 days'
    ),
    'ultima_senha_errada', (
      select max(criado_em) from public.logs_auditoria
      where acao = 'login_falhou' and usuario_email = meu_email
    )
  );
end;
$$;

revoke execute on function public.meus_acessos() from public, anon;
grant execute on function public.meus_acessos() to authenticated;


-- 3) Índices para os filtros da tela de Logs
create index if not exists logs_auditoria_criado_em_idx on public.logs_auditoria (criado_em desc);
create index if not exists logs_auditoria_acao_idx on public.logs_auditoria (acao, criado_em desc);
create index if not exists logs_auditoria_email_idx on public.logs_auditoria (usuario_email, criado_em desc);
