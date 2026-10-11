-- ============================================================
-- EduGuru — Atualização 4: correções de segurança e LGPD
-- Rodar no SQL Editor do Supabase, DEPOIS dos SQLs anteriores.
-- Pode ser rodado mais de uma vez (idempotente).
--
-- Corrige problemas encontrados na revisão da Etapa 2:
--   1) aluno conseguia virar admin (UPDATE liberado em todas as colunas);
--   2) cidade/estado nunca foram gravados (a atualização 3 não tinha
--      sido aplicada no banco — aqui as colunas são criadas de novo,
--      de forma segura, caso ainda não existam);
--   3) aceite do Termo/Política não ficava registrado no banco;
--   4) todo aluno lia o perfil de todos os outros (inclusive cidade);
--   5) qualquer aluno podia editar/apagar material de outra pessoa;
--   6) bucket de arquivos era público (link funcionava sem login);
--   7) o piso de 90 dias da limpeza de logs só existia na tela;
--   8) o front podia gravar log com qualquer "acao" (log forjado).
-- ============================================================


-- ------------------------------------------------------------
-- 1) PERFIS: colunas de cidade/estado e de consentimento
-- ------------------------------------------------------------
alter table public.perfis
  add column if not exists cidade text,
  add column if not exists estado text,
  add column if not exists consentimento_aceito boolean not null default false,
  add column if not exists consentimento_em timestamptz,
  add column if not exists versao_termos text;

-- Contas antigas ficam com consentimento_aceito = false e
-- consentimento_em = null: o aceite delas aconteceu só na tela, sem
-- registro no banco. A decisão de pedir (ou não) um novo aceite fica
-- para quando o Termo/Política mudarem de versão.

-- Função de cadastro: além de nome/curso/cidade/estado, grava o aceite
-- (o front só envia o cadastro depois que o checkbox foi marcado).
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  aceitou boolean := coalesce((new.raw_user_meta_data->>'consentimento_aceito')::boolean, false);
begin
  insert into public.perfis (
    id, nome, papel, curso, cidade, estado,
    consentimento_aceito, consentimento_em, versao_termos
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    'aluno',
    new.raw_user_meta_data->>'curso',
    new.raw_user_meta_data->>'cidade',
    new.raw_user_meta_data->>'estado',
    aceitou,
    case when aceitou then now() else null end,
    case when aceitou then new.raw_user_meta_data->>'versao_termos' else null end
  );
  return new;
end;
$$;


-- ------------------------------------------------------------
-- 2) PERFIS: quem pode alterar o quê (correção da escalada de privilégio)
-- ------------------------------------------------------------
-- A política "perfis_update_proprio_nome" deixa cada um alterar a
-- PRÓPRIA linha, mas não limitava as COLUNAS — então um aluno podia
-- mandar { papel: 'admin' } e virar administrador. Aqui tiramos o
-- UPDATE geral e liberamos só as colunas que o titular pode corrigir.
-- Papel e consentimento só mudam por SQL/funções do servidor.
revoke update on public.perfis from anon, authenticated;
grant update (nome, curso, cidade, estado) on public.perfis to authenticated;

-- Leitura: antes qualquer logado lia o perfil de todo mundo (inclusive
-- cidade/estado). Agora cada um lê só o próprio; admin lê todos.
-- Ranking (Fase C) vai usar uma função própria que expõe só nome e pontos.
drop policy if exists "perfis_select_autenticado" on public.perfis;

drop policy if exists "perfis_select_proprio" on public.perfis;
create policy "perfis_select_proprio" on public.perfis
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "perfis_select_admin" on public.perfis;
create policy "perfis_select_admin" on public.perfis
  for select to authenticated
  using (public.eh_admin());


-- ------------------------------------------------------------
-- 3) PERFIS: auditoria com minimização
-- ------------------------------------------------------------
-- Não usamos registrar_log_auditoria() aqui porque ela grava a linha
-- inteira em "detalhes" — no caso do perfil, isso copiaria nome,
-- cidade e estado para dentro do log. Aqui guardamos só QUAIS campos
-- mudaram, nunca os valores (minimização de dados, LGPD art. 6º, III).
create or replace function public.registrar_log_perfis()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ator uuid := auth.uid();
  campos text[];
begin
  if (tg_op = 'INSERT') then
    -- Cadastro: quem "age" é o próprio usuário recém-criado.
    insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
    values (
      new.id,
      (select email from auth.users where id = new.id),
      'criar', 'perfis', new.id::text,
      jsonb_build_object('evento', 'cadastro_de_conta',
                         'consentimento_aceito', new.consentimento_aceito,
                         'versao_termos', new.versao_termos)
    );
    return new;

  elsif (tg_op = 'UPDATE') then
    select array_agg(chave order by chave) into campos
    from jsonb_each(to_jsonb(new)) as n(chave, valor)
    where n.valor is distinct from (to_jsonb(old) -> n.chave);

    if campos is null then
      return new; -- nada mudou de fato
    end if;

    insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
    values (
      ator,
      (select email from auth.users where id = ator),
      'editar', 'perfis', new.id::text,
      jsonb_build_object('campos_alterados', to_jsonb(campos))
    );
    return new;

  else -- DELETE (acontece em cascata quando a conta de autenticação é apagada)
    -- Se quem apagou foi o próprio titular, o usuário dele já não existe
    -- mais em auth.users nesse momento; por isso usuario_id fica null.
    -- O registro completo da exclusão é feito pelas funções de exclusão
    -- de conta (atualização 7), ANTES de apagar.
    insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
    values (
      case when ator = old.id then null else ator end,
      case when ator = old.id then null else (select email from auth.users where id = ator) end,
      'excluir', 'perfis', old.id::text,
      jsonb_build_object('evento', 'perfil_removido')
    );
    return old;
  end if;
end;
$$;

drop trigger if exists log_perfis on public.perfis;
create trigger log_perfis
  after insert or update or delete on public.perfis
  for each row execute function public.registrar_log_perfis();


-- ------------------------------------------------------------
-- 4) MATERIAIS: dono do material
-- ------------------------------------------------------------
-- Alunos também enviam materiais, então cada material passa a guardar
-- quem enviou. Isso permite: aluno edita/apaga só o que é dele, admin
-- gerencia tudo. Materiais antigos ficam com enviado_por = null (só
-- admin gerencia). Se a conta for apagada por fora das funções do
-- sistema, o material fica sem dono em vez de sumir.
alter table public.materiais
  add column if not exists enviado_por uuid
    references auth.users(id) on delete set null
    default auth.uid();

drop policy if exists "materiais_autenticado_escreve" on public.materiais;

drop policy if exists "materiais_insert_proprio" on public.materiais;
create policy "materiais_insert_proprio" on public.materiais
  for insert to authenticated
  with check (enviado_por = auth.uid());

drop policy if exists "materiais_update_dono_ou_admin" on public.materiais;
create policy "materiais_update_dono_ou_admin" on public.materiais
  for update to authenticated
  using (enviado_por = auth.uid() or public.eh_admin())
  with check (enviado_por = auth.uid() or public.eh_admin());

drop policy if exists "materiais_delete_dono_ou_admin" on public.materiais;
create policy "materiais_delete_dono_ou_admin" on public.materiais
  for delete to authenticated
  using (enviado_por = auth.uid() or public.eh_admin());


-- ------------------------------------------------------------
-- 5) STORAGE: bucket privado
-- ------------------------------------------------------------
-- Com o bucket público, qualquer pessoa com o link baixava o arquivo
-- sem login. Agora o site gera um link temporário (assinado, 1 hora)
-- só para quem está logado.
update storage.buckets set public = false where id = 'materiais';

-- Admin também pode apagar arquivo (necessário para excluir material
-- de outra pessoa e para a exclusão de conta feita por admin).
drop policy if exists "materiais_arquivos_delete" on storage.objects;
create policy "materiais_arquivos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'materiais' and (owner = auth.uid() or public.eh_admin()));


-- ------------------------------------------------------------
-- 6) LIMPEZA MANUAL DE LOGS: piso de 90 dias no servidor
-- ------------------------------------------------------------
create or replace function public.limpar_logs_antigos(dias integer default 90)
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

  -- O prazo de retenção da Política de Privacidade é 90 dias: não
  -- deixamos apagar nada mais novo que isso, nem chamando a API direto.
  if dias is null or dias < 90 then
    raise exception 'O prazo mínimo para limpeza de logs é de 90 dias.';
  end if;

  delete from public.logs_auditoria
  where criado_em < now() - make_interval(days => dias);

  get diagnostics qtd_removida = row_count;
  return qtd_removida;
end;
$$;

revoke execute on function public.limpar_logs_antigos(integer) from public, anon;
grant execute on function public.limpar_logs_antigos(integer) to authenticated;


-- ------------------------------------------------------------
-- 7) LOGS DE EVENTOS DE ACESSO: só por funções, com lista fechada
-- ------------------------------------------------------------
-- Antes o front inseria direto na tabela e podia gravar qualquer
-- "acao" (ex.: um 'excluir' falso). Agora o INSERT direto é fechado e
-- o front chama funções que só aceitam os eventos previstos e sempre
-- usam o usuário da sessão (não o que o front mandar).
drop policy if exists "logs_insert_proprio" on public.logs_auditoria;
drop policy if exists "logs_insert_anonimo_falha" on public.logs_auditoria;

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

-- Login com senha errada acontece SEM sessão (anônimo). Para não virar
-- uma porta para encher a tabela de lixo, há um limite simples: no
-- máximo 20 registros por e-mail a cada 10 minutos (o resto é ignorado).
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
