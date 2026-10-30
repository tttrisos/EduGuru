-- ============================================================
-- EduGuru — 04: segurança e LGPD (cidade/estado, aceite dos termos,
-- permissões do perfil, log sem dados pessoais e dono dos materiais)
-- ============================================================


-- 1) Perfis: cidade/estado (ViaCEP, opcional) e aceite dos termos
alter table public.perfis
  add column if not exists cidade text,
  add column if not exists estado text,
  add column if not exists consentimento_aceito boolean not null default false,
  add column if not exists consentimento_em timestamptz,
  add column if not exists versao_termos text;

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


-- 2) Perfis: o titular só altera nome, curso, cidade e estado (nunca o papel)
revoke update on public.perfis from anon, authenticated;
grant update (nome, curso, cidade, estado) on public.perfis to authenticated;

-- Cada um lê só o próprio perfil; admin lê todos.
drop policy if exists "perfis_select_proprio" on public.perfis;
create policy "perfis_select_proprio" on public.perfis
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "perfis_select_admin" on public.perfis;
create policy "perfis_select_admin" on public.perfis
  for select to authenticated
  using (public.eh_admin());


-- 3) Log do perfil: guarda só QUAIS campos mudaram, nunca os valores
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
      return new;
    end if;

    insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
    values (
      ator,
      (select email from auth.users where id = ator),
      'editar', 'perfis', new.id::text,
      jsonb_build_object('campos_alterados', to_jsonb(campos))
    );
    return new;

  else
    -- Exclusão de conta: o log completo é gravado antes, por excluir_minha_conta.
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


-- 4) Materiais: guardam quem enviou; só o dono ou o admin altera e exclui
alter table public.materiais
  add column if not exists enviado_por uuid
    references auth.users(id) on delete set null
    default auth.uid();

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

drop policy if exists "materiais_arquivos_delete" on storage.objects;
create policy "materiais_arquivos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'materiais' and (owner = auth.uid() or public.eh_admin()));
