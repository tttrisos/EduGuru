-- ============================================================
-- EduGuru — 25: código por e-mail ao entrar num aparelho novo
--   Para quem NÃO usa o aplicativo autenticador (o MFA é opcional, script 23):
--   1) o aluno acerta a senha num aparelho que o EduGuru não conhece;
--   2) o banco gera um código de 6 números, guarda só o "resumo" (hash) dele
--      e manda o código para o e-mail da conta pela API do Brevo (pg_net);
--   3) o aluno digita o código: ESTA sessão fica marcada como verificada e,
--      se ele quiser, o aparelho fica "lembrado" por 30 dias (nesse período,
--      só a senha basta nele).
--   O banco garante de verdade: sem a sessão verificada, as políticas
--   "mfa_obrigatorio" (que chamam sessao_mfa_ok) não liberam nada.
--   Quem tem o aplicativo autenticador continua usando o código do aplicativo.
--   Administrador continua obrigado a usar o aplicativo (script 23).
--   Entrar por um link enviado ao e-mail (confirmação de cadastro, nova senha)
--   já conta como verificado: a pessoa provou que tem acesso ao e-mail.
--
-- ANTES DE LIGAR (a proteção começa DESLIGADA, então rodar o script não muda nada):
--   a) Database → Extensions: habilite "pg_net" (ou o create extension abaixo faz isso);
--   b) Brevo → SMTP & API → API Keys → gere uma chave (começa com xkeysib-);
--   c) no SQL Editor, guarde a chave no Vault (cofre de segredos do Supabase):
--        select vault.create_secret('xkeysib-COLE-AQUI', 'brevo_api_key');
--   d) informe o remetente (o MESMO e-mail já validado no Brevo para o SMTP):
--        update public.config_seguranca set remetente_email = 'seu-remetente@dominio.com';
--   e) teste em você mesmo e então ligue:
--        update public.config_seguranca set codigo_email = true;
--   Para desligar (ex.: acabou a cota do Brevo): set codigo_email = false.
-- Rodar depois do 24. Pode ser rodado de novo.
-- ============================================================

create extension if not exists pg_net with schema extensions;


-- 1) Configuração (uma linha só). Ninguém do site lê ou altera: só o SQL Editor.
create table if not exists public.config_seguranca (
  id               int primary key default 1 check (id = 1),
  codigo_email     boolean not null default false,  -- liga/desliga a proteção
  remetente_email  text,
  remetente_nome   text not null default 'EduGuru',
  limite_diario    int not null default 150          -- máximo de códigos por dia (o Brevo grátis manda 300 e-mails/dia no total)
);
insert into public.config_seguranca (id) values (1) on conflict (id) do nothing;
alter table public.config_seguranca enable row level security;
revoke all on public.config_seguranca from anon, authenticated;


-- 2) Tabelas internas (só as funções abaixo mexem nelas; o site não lê direto)
-- Sessões que já passaram pelo código do e-mail (ou por um aparelho lembrado).
create table if not exists public.sessoes_verificadas (
  session_id    uuid primary key,
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  metodo        text not null check (metodo in ('email', 'aparelho')),
  verificada_em timestamptz not null default now()
);

-- Código pendente: um por usuário, preso à sessão que pediu. Só o hash fica guardado.
create table if not exists public.codigos_email (
  usuario_id  uuid primary key references auth.users(id) on delete cascade,
  session_id  uuid not null,
  codigo_hash text not null,
  tentativas  int not null default 0,
  enviado_em  timestamptz not null default now(),
  expira_em   timestamptz not null
);

-- Aparelhos lembrados: o navegador guarda um token aleatório; o banco guarda só o hash.
create table if not exists public.aparelhos_lembrados (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  aparelho   text,                                   -- ex.: "Chrome no Windows" (sem IP)
  criado_em  timestamptz not null default now(),
  ultimo_uso timestamptz not null default now(),
  expira_em  timestamptz not null default now() + interval '30 days'
);
create index if not exists aparelhos_lembrados_usuario_idx on public.aparelhos_lembrados (usuario_id);

alter table public.sessoes_verificadas enable row level security;
alter table public.codigos_email enable row level security;
alter table public.aparelhos_lembrados enable row level security;
revoke all on public.sessoes_verificadas, public.codigos_email, public.aparelhos_lembrados from anon, authenticated;


-- 3) Funções auxiliares
create or replace function public.resumo_seguro(texto text)
returns text
language sql
immutable
as $$
  select encode(sha256(convert_to(texto, 'UTF8')), 'hex');
$$;

create or replace function public.sessao_atual()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt()->>'session_id', '')::uuid;
$$;

-- A proteção está ligada?
create or replace function public.codigo_email_ligado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select codigo_email from public.config_seguranca where id = 1), false);
$$;

-- Esta sessão provou o acesso ao e-mail? (código digitado, aparelho lembrado ou entrou por link do e-mail)
create or replace function public.sessao_email_ok()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
           select 1 from public.sessoes_verificadas s
           where s.session_id = public.sessao_atual() and s.usuario_id = auth.uid()
         )
      or exists (
           select 1 from jsonb_array_elements(
             case when jsonb_typeof(auth.jwt()->'amr') = 'array' then auth.jwt()->'amr' else '[]'::jsonb end
           ) m
           where m->>'method' in ('otp', 'magiclink', 'recovery', 'invite', 'email/signup', 'email_change')
         );
$$;

-- t*****@gmail.com
create or replace function public.mascarar_email(email text)
returns text
language sql
immutable
as $$
  select left(split_part(email, '@', 1), 1)
         || repeat('*', least(greatest(length(split_part(email, '@', 1)) - 1, 1), 5))
         || '@' || split_part(email, '@', 2);
$$;


-- 4) A REGRA (mesma função do script 23, com a parte do e-mail):
--    a sessão está liberada se tem o código do aplicativo (aal2), OU se a conta não usa o
--    aplicativo e (a proteção por e-mail está desligada, ou a sessão já provou o e-mail,
--    ou é administrador — que é obrigado a usar o aplicativo e é barrado por eh_admin()).
create or replace function public.sessao_mfa_ok()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    public.sessao_aal2()
    or (
      not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = auth.uid() and f.status = 'verified'
      )
      and (
        not public.codigo_email_ligado()
        or public.sessao_email_ok()
        or exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
      )
    )
  );
$$;


-- 5) O site pergunta: esta sessão precisa do código do e-mail?
--    Se o navegador mandar o token de um aparelho lembrado válido, a sessão já fica verificada.
create or replace function public.situacao_codigo_email(p_token text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_aparelho uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Sessão não encontrada.';
  end if;

  if not public.codigo_email_ligado()
     or public.sessao_aal2()
     or exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
     or exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
     or public.sessao_email_ok() then
    return jsonb_build_object('precisa_codigo', false);
  end if;

  if public.sessao_atual() is null then
    raise exception 'Sessão sem identificador.';
  end if;

  if p_token is not null and length(p_token) between 32 and 128 then
    select id into v_aparelho from public.aparelhos_lembrados
    where usuario_id = auth.uid() and token_hash = public.resumo_seguro(p_token) and expira_em > now();
    if v_aparelho is not null then
      update public.aparelhos_lembrados set ultimo_uso = now() where id = v_aparelho;
      insert into public.sessoes_verificadas (session_id, usuario_id, metodo)
      values (public.sessao_atual(), auth.uid(), 'aparelho')
      on conflict (session_id) do nothing;
      return jsonb_build_object('precisa_codigo', false, 'aparelho_lembrado', true);
    end if;
  end if;

  select email into v_email from auth.users where id = auth.uid();
  return jsonb_build_object(
    'precisa_codigo', true,
    'email', public.mascarar_email(v_email),
    'token_invalido', p_token is not null
  );
end;
$$;


-- 6) Gera e envia o código (10 minutos de validade; 1 envio por minuto; 8 por dia por pessoa)
create or replace function public.enviar_codigo_email(p_aparelho text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.config_seguranca;
  v_email text;
  v_chave text;
  v_codigo text;
  v_ultimo timestamptz;
  v_aparelho text := left(coalesce(p_aparelho, 'aparelho não informado'), 60);
begin
  if auth.uid() is null or public.sessao_atual() is null then
    raise exception 'Sessão não encontrada.';
  end if;
  if public.sessao_mfa_ok() then
    return jsonb_build_object('ok', false, 'motivo', 'ja_verificada');
  end if;

  select * into cfg from public.config_seguranca where id = 1;
  select email into v_email from auth.users where id = auth.uid();

  select enviado_em into v_ultimo from public.codigos_email
  where usuario_id = auth.uid() and session_id = public.sessao_atual() and expira_em > now();
  if v_ultimo is not null and v_ultimo > now() - interval '60 seconds' then
    return jsonb_build_object('ok', false, 'motivo', 'aguarde', 'email', public.mascarar_email(v_email),
      'segundos', ceil(extract(epoch from (v_ultimo + interval '60 seconds' - now())))::int);
  end if;

  if (select count(*) from public.logs_auditoria
      where usuario_id = auth.uid() and acao = 'codigo_email_enviado'
        and criado_em > now() - interval '1 day') >= 8 then
    return jsonb_build_object('ok', false, 'motivo', 'limite_pessoal');
  end if;
  if (select count(*) from public.logs_auditoria
      where acao = 'codigo_email_enviado' and criado_em > now() - interval '1 day') >= cfg.limite_diario then
    return jsonb_build_object('ok', false, 'motivo', 'limite_geral');
  end if;

  select decrypted_secret into v_chave from vault.decrypted_secrets where name = 'brevo_api_key' limit 1;
  if v_chave is null or cfg.remetente_email is null then
    raise exception 'Envio do código não configurado (chave do Brevo ou remetente).';
  end if;

  -- 6 números a partir de um UUID aleatório (gerador seguro do Postgres)
  v_codigo := lpad(((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint) % 1000000)::text, 6, '0');

  insert into public.codigos_email (usuario_id, session_id, codigo_hash, tentativas, enviado_em, expira_em)
  values (auth.uid(), public.sessao_atual(),
          public.resumo_seguro(public.sessao_atual()::text || ':' || v_codigo), 0, now(), now() + interval '10 minutes')
  on conflict (usuario_id) do update
    set session_id = excluded.session_id, codigo_hash = excluded.codigo_hash, tentativas = 0,
        enviado_em = excluded.enviado_em, expira_em = excluded.expira_em;

  -- A API do Brevo recebe o pedido em segundo plano (pg_net): o envio leva alguns segundos.
  perform net.http_post(
    url     := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object('api-key', v_chave, 'content-type', 'application/json', 'accept', 'application/json'),
    body    := jsonb_build_object(
      'sender', jsonb_build_object('name', cfg.remetente_nome, 'email', cfg.remetente_email),
      'to', jsonb_build_array(jsonb_build_object('email', v_email)),
      'subject', 'Seu código de acesso ao EduGuru',
      'htmlContent',
        '<div style="font-family:Arial,sans-serif;max-width:480px">'
        || '<h2 style="color:#8257e5">EduGuru</h2>'
        || '<p>Alguém (provavelmente você) entrou na sua conta em um aparelho novo: <strong>'
        || replace(replace(v_aparelho, '<', ''), '>', '') || '</strong>.</p>'
        || '<p>Digite este código para continuar:</p>'
        || '<p style="font-size:32px;font-weight:bold;letter-spacing:6px">' || v_codigo || '</p>'
        || '<p>O código vale por 10 minutos. Não passe para ninguém: a equipe do EduGuru nunca pede este código.</p>'
        || '<p>Se não foi você, a sua senha pode ter vazado: troque-a em "Esqueci minha senha".</p>'
        || '</div>'
    )
  );

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (auth.uid(), v_email, 'codigo_email_enviado', null, null, jsonb_build_object('aparelho', v_aparelho));

  return jsonb_build_object('ok', true, 'email', public.mascarar_email(v_email));
end;
$$;


-- 7) Confere o código (5 tentativas por código). Certo → sessão verificada; se pedir, lembra o aparelho.
create or replace function public.confirmar_codigo_email(p_codigo text, p_lembrar boolean default false, p_aparelho text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pendente public.codigos_email;
  v_email text;
  v_token text;
begin
  if auth.uid() is null or public.sessao_atual() is null then
    raise exception 'Sessão não encontrada.';
  end if;
  select email into v_email from auth.users where id = auth.uid();

  select * into v_pendente from public.codigos_email
  where usuario_id = auth.uid() and session_id = public.sessao_atual();
  if v_pendente is null or v_pendente.expira_em <= now() then
    return jsonb_build_object('ok', false, 'motivo', 'expirado');
  end if;

  if v_pendente.codigo_hash <> public.resumo_seguro(public.sessao_atual()::text || ':' || coalesce(p_codigo, '')) then
    -- Sem "raise": o erro desfaria a contagem de tentativas.
    update public.codigos_email set tentativas = tentativas + 1 where usuario_id = auth.uid();
    insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
    values (auth.uid(), v_email, 'codigo_email_errado', null, null, null);
    if v_pendente.tentativas + 1 >= 5 then
      delete from public.codigos_email where usuario_id = auth.uid();
      return jsonb_build_object('ok', false, 'motivo', 'bloqueado');
    end if;
    return jsonb_build_object('ok', false, 'motivo', 'errado', 'restantes', 5 - (v_pendente.tentativas + 1));
  end if;

  delete from public.codigos_email where usuario_id = auth.uid();
  insert into public.sessoes_verificadas (session_id, usuario_id, metodo)
  values (public.sessao_atual(), auth.uid(), 'email')
  on conflict (session_id) do nothing;

  if coalesce(p_lembrar, false) then
    v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    insert into public.aparelhos_lembrados (usuario_id, token_hash, aparelho)
    values (auth.uid(), public.resumo_seguro(v_token), left(p_aparelho, 60));
  end if;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (auth.uid(), v_email, 'codigo_email_confirmado', null, null,
          jsonb_build_object('lembrar_aparelho', coalesce(p_lembrar, false)));

  return jsonb_build_object('ok', true, 'token', v_token);
end;
$$;


-- 8) "Sair dos outros aparelhos" também esquece os outros aparelhos lembrados
create or replace function public.esquecer_outros_aparelhos(p_token text default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qtd int;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre na sua conta para continuar.';
  end if;
  delete from public.aparelhos_lembrados
  where usuario_id = auth.uid()
    and token_hash <> coalesce(public.resumo_seguro(p_token), '');
  get diagnostics v_qtd = row_count;
  if v_qtd > 0 then
    insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
    values (auth.uid(), (select email from auth.users where id = auth.uid()), 'aparelhos_esquecidos', null, null,
            jsonb_build_object('quantidade', v_qtd));
  end if;
  return v_qtd;
end;
$$;


-- 9) Minha conta: últimos acessos (script 24) + como cada login foi verificado + aparelhos lembrados
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
               'com_codigo', coalesce(l.detalhes->>'mfa', '') = 'totp',
               'verificacao', coalesce(l.detalhes->>'mfa', 'nao')
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
    ),
    'aparelhos_lembrados', coalesce((
      select jsonb_agg(jsonb_build_object('aparelho', a.aparelho, 'ultimo_uso', a.ultimo_uso, 'expira_em', a.expira_em)
                       order by a.ultimo_uso desc)
      from public.aparelhos_lembrados a
      where a.usuario_id = auth.uid() and a.expira_em > now()
    ), '[]'::jsonb)
  );
end;
$$;


-- 10) Permissões: só usuários logados chamam; as auxiliares não ficam expostas
revoke execute on function public.resumo_seguro(text) from public, anon, authenticated;
revoke execute on function public.mascarar_email(text) from public, anon, authenticated;
revoke execute on function public.codigo_email_ligado() from public, anon;
revoke execute on function public.sessao_email_ok() from public, anon;
revoke execute on function public.situacao_codigo_email(text) from public, anon;
revoke execute on function public.enviar_codigo_email(text) from public, anon;
revoke execute on function public.confirmar_codigo_email(text, boolean, text) from public, anon;
revoke execute on function public.esquecer_outros_aparelhos(text) from public, anon;
revoke execute on function public.meus_acessos() from public, anon;
grant execute on function public.situacao_codigo_email(text) to authenticated;
grant execute on function public.enviar_codigo_email(text) to authenticated;
grant execute on function public.confirmar_codigo_email(text, boolean, text) to authenticated;
grant execute on function public.esquecer_outros_aparelhos(text) to authenticated;
grant execute on function public.meus_acessos() to authenticated;
-- usadas dentro das políticas (sessao_mfa_ok), por isso continuam liberadas para authenticated:
grant execute on function public.codigo_email_ligado() to authenticated;
grant execute on function public.sessao_email_ok() to authenticated;


-- 11) Limpeza diária: códigos vencidos, aparelhos vencidos e marcas de sessões que já acabaram
create or replace function public.limpar_verificacoes_email()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.codigos_email where expira_em < now();
  delete from public.aparelhos_lembrados where expira_em < now();
  delete from public.sessoes_verificadas s
  where not exists (select 1 from auth.sessions a where a.id = s.session_id);
$$;
revoke execute on function public.limpar_verificacoes_email() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'limpeza-verificacoes-email';
select cron.schedule('limpeza-verificacoes-email', '30 6 * * *', $$select public.limpar_verificacoes_email();$$);
