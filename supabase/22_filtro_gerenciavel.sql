-- ============================================================
-- EduGuru — 22: filtro de materiais gerenciável pelo admin
--   Antes (script 15): as listas de sites permitidos e de termos bloqueados
--   estavam escritas dentro da função e repetidas no front-end. Para mudar
--   uma palavra era preciso alterar o código, criar um script e publicar.
--   Agora:
--   - as listas ficam em duas tabelas (filtro_sites e filtro_termos), que o
--     admin edita pela tela Materiais → "Listas do filtro", com log;
--   - a regra fica só no banco: a tela pergunta a verificar_material();
--   - link de site que não está na lista vai para a análise da equipe, em vez
--     de ser recusado; o admin pode "Aprovar e liberar o site", e os próximos
--     links desse site passam direto (a lista cresce com o uso);
--   - números e símbolos usados para disfarçar palavras (p0rn, t0rr3nt)
--     são convertidos antes da comparação;
--   - ao incluir um termo, os materiais já publicados podem ser reanalisados.
-- Rodar depois do 21. Pode ser rodado de novo.
-- ============================================================


-- 1) Tabelas das listas
create table if not exists public.filtro_sites (
  id bigserial primary key,
  dominio text not null unique,
  criado_em timestamptz not null default now()
);

create table if not exists public.filtro_termos (
  id bigserial primary key,
  termo text not null unique,
  criado_em timestamptz not null default now()
);


-- 2) Disfarces comuns: 0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s
create or replace function public.sem_disfarce(texto text)
returns text
language sql
immutable
as $$
  select translate(coalesce(texto, ''), '013457@$', 'oieastas');
$$;


-- 3) O que o admin digita é padronizado antes de gravar
--    Site: "https://www.Blog.com.br/aula" -> "blog.com.br". Termo: "Pirataría" -> "pirataria".
create or replace function public.padronizar_filtro_site()
returns trigger
language plpgsql
as $$
begin
  new.dominio := lower(trim(coalesce(new.dominio, '')));
  new.dominio := regexp_replace(new.dominio, '^[a-z]+://', '');
  new.dominio := regexp_replace(new.dominio, '[/:?#].*$', '');
  new.dominio := regexp_replace(new.dominio, '^www\.', '');

  if new.dominio !~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$' or char_length(new.dominio) > 100 then
    raise exception 'Informe só o endereço do site, por exemplo: youtube.com ou blog.exemplo.com.br.';
  end if;
  -- "com.br" sozinho liberaria qualquer site .com.br
  if new.dominio ~ '^(com|net|org|edu|io|dev|app|info|xyz|site|online)(\.[a-z]{2})?$' then
    raise exception 'Esse endereço é genérico demais: liberaria sites de qualquer pessoa.';
  end if;
  return new;
end;
$$;

drop trigger if exists padronizar_filtro_site on public.filtro_sites;
create trigger padronizar_filtro_site
  before insert or update on public.filtro_sites
  for each row execute function public.padronizar_filtro_site();

create or replace function public.padronizar_filtro_termo()
returns trigger
language plpgsql
as $$
begin
  new.termo := public.sem_disfarce(public.sem_acento(trim(coalesce(new.termo, ''))));
  new.termo := regexp_replace(new.termo, '\s+', ' ', 'g');

  if new.termo !~ '^[a-z]+( [a-z]+)*$' or char_length(new.termo) not between 2 and 40 then
    raise exception 'O termo precisa ter de 2 a 40 letras (pode ter espaços, sem símbolos).';
  end if;
  return new;
end;
$$;

drop trigger if exists padronizar_filtro_termo on public.filtro_termos;
create trigger padronizar_filtro_termo
  before insert or update on public.filtro_termos
  for each row execute function public.padronizar_filtro_termo();


-- 4) Listas iniciais: as mesmas que estavam escritas no script 15
insert into public.filtro_sites (dominio)
select unnest(array[
  'youtube.com', 'youtu.be', 'github.com', 'gitlab.com', 'developer.mozilla.org',
  'w3schools.com', 'wikipedia.org', 'stackoverflow.com', 'freecodecamp.org',
  'khanacademy.org', 'alura.com.br', 'dio.me', 'rocketseat.com.br', 'udemy.com',
  'coursera.org', 'edx.org', 'cursoemvideo.com', 'devmedia.com.br', 'geeksforgeeks.org',
  'microsoft.com', 'react.dev', 'typescriptlang.org', 'python.org', 'postgresql.org',
  'supabase.com', 'git-scm.com', 'umc.br', 'scielo.br', 'scielo.org', 'gov.br'
])
on conflict (dominio) do nothing;

insert into public.filtro_termos (termo)
select unnest(array[
  'porn', 'porno', 'pornografia', 'xxx', 'nude', 'nudes', 'putaria', 'hentai', 'onlyfans',
  'cocaina', 'maconha', 'crack', 'crackeado', 'keygen', 'torrent', 'warez', 'pirata', 'pirataria',
  'cassino', 'apostas', 'bet', 'tigrinho', 'arma de fogo', 'explosivo', 'explosivos',
  'pedofilia', 'nazismo', 'terrorismo',
  'porra', 'caralho', 'merda', 'puta', 'buceta', 'foder', 'fdp', 'vtnc'
])
on conflict (termo) do nothing;


-- 5) Quem vê e quem altera
--    Sites: todos os logados leem (a tela de envio mostra a lista); só o admin altera.
--    Termos: só o admin lê e altera (mostrar a lista ensinaria a burlar o filtro).
alter table public.filtro_sites enable row level security;
alter table public.filtro_termos enable row level security;

revoke all on public.filtro_sites, public.filtro_termos from anon, authenticated;
grant select, insert, delete on public.filtro_sites, public.filtro_termos to authenticated;
grant usage on sequence public.filtro_sites_id_seq, public.filtro_termos_id_seq to authenticated;

drop policy if exists "filtro_sites_le" on public.filtro_sites;
create policy "filtro_sites_le" on public.filtro_sites
  for select to authenticated using (true);
drop policy if exists "filtro_sites_admin_inclui" on public.filtro_sites;
create policy "filtro_sites_admin_inclui" on public.filtro_sites
  for insert to authenticated with check (public.eh_admin());
drop policy if exists "filtro_sites_admin_exclui" on public.filtro_sites;
create policy "filtro_sites_admin_exclui" on public.filtro_sites
  for delete to authenticated using (public.eh_admin());

drop policy if exists "filtro_termos_admin_le" on public.filtro_termos;
create policy "filtro_termos_admin_le" on public.filtro_termos
  for select to authenticated using (public.eh_admin());
drop policy if exists "filtro_termos_admin_inclui" on public.filtro_termos;
create policy "filtro_termos_admin_inclui" on public.filtro_termos
  for insert to authenticated with check (public.eh_admin());
drop policy if exists "filtro_termos_admin_exclui" on public.filtro_termos;
create policy "filtro_termos_admin_exclui" on public.filtro_termos
  for delete to authenticated using (public.eh_admin());

drop policy if exists "mfa_obrigatorio" on public.filtro_sites;
create policy "mfa_obrigatorio" on public.filtro_sites
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());
drop policy if exists "mfa_obrigatorio" on public.filtro_termos;
create policy "mfa_obrigatorio" on public.filtro_termos
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

-- Toda inclusão e exclusão fica no log de auditoria (quem, quando, o quê).
drop trigger if exists log_filtro_sites on public.filtro_sites;
create trigger log_filtro_sites
  after insert or delete on public.filtro_sites
  for each row execute function public.registrar_log_auditoria();
drop trigger if exists log_filtro_termos on public.filtro_termos;
create trigger log_filtro_termos
  after insert or delete on public.filtro_termos
  for each row execute function public.registrar_log_auditoria();


-- 6) As regras, agora lendo as tabelas
-- Domínio do link: "https://www.youtube.com/watch?v=1" -> "youtube.com"
create or replace function public.dominio_do_link(p_link text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(substring(coalesce(p_link, '') from '^https://([^/:?#]+)')), '^www\.', '');
$$;

-- O site está na lista? Vale também para subdomínios (pt.wikipedia.org).
create or replace function public.site_permitido(p_link text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.filtro_sites s
    where public.dominio_do_link(p_link) = s.dominio
       or right(public.dominio_do_link(p_link), char_length(s.dominio) + 1) = '.' || s.dominio
  );
$$;

-- Motivo para RECUSAR o material, ou null. Site fora da lista não recusa:
-- quem decide é a moderação (ver o gatilho abaixo).
create or replace function public.motivo_bloqueio_material(
  p_titulo text,
  p_descricao text,
  p_link text,
  p_arquivo_nome text
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  texto text := public.sem_acento(concat_ws(' ', p_titulo, p_descricao, p_arquivo_nome));
  -- "_", "." e "-" viram espaço para pegar nomes como "resumo_keygen.pdf".
  para_termos text;
  termos text;
begin
  para_termos := regexp_replace(
    public.sem_disfarce(regexp_replace(concat_ws(' ', texto, public.sem_acento(p_link)), '[_.-]', ' ', 'g')),
    '\s+', ' ', 'g');
  select '\m(' || string_agg(termo, '|' order by char_length(termo) desc) || ')\M'
    into termos
    from public.filtro_termos;

  if termos is not null and para_termos ~ termos then
    return 'O material tem termos impróprios ou ligados a crimes (pirataria, drogas, apostas, conteúdo adulto, ofensas).';
  end if;

  if texto ~ '\d{3}\.?\d{3}\.?\d{3}-?\d{2}'
     or texto ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
     or texto ~ '\(?\d{2}\)?\s?9\d{4}-?\d{4}' then
    return 'Não coloque dados pessoais (CPF, e-mail ou telefone) no material. Isso protege você e os colegas (LGPD).';
  end if;

  if coalesce(p_link, '') <> '' and p_link !~* '^https://[^\s]+$' then
    return 'O link precisa começar com https:// e não pode ter espaços.';
  end if;

  return null;
end;
$$;

-- Ninguém chama essas duas direto pela API: só os gatilhos e as funções abaixo.
revoke execute on function public.motivo_bloqueio_material(text, text, text, text) from public, anon, authenticated;
revoke execute on function public.site_permitido(text) from public, anon, authenticated;


-- 7) A tela pergunta ao banco antes de enviar (a regra fica num lugar só)
--    Devolve {"motivo": texto ou null, "site_novo": true/false}.
create or replace function public.verificar_material(
  p_titulo text,
  p_descricao text default null,
  p_link text default null,
  p_arquivo_nome text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  motivo text;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para enviar materiais.';
  end if;

  motivo := public.motivo_bloqueio_material(p_titulo, p_descricao, p_link, p_arquivo_nome);
  return jsonb_build_object(
    'motivo', motivo,
    'site_novo', motivo is null and coalesce(trim(p_link), '') <> '' and not public.site_permitido(trim(p_link))
  );
end;
$$;

revoke execute on function public.verificar_material(text, text, text, text) from public, anon;
grant execute on function public.verificar_material(text, text, text, text) to authenticated;


-- 8) Gatilho dos materiais (substitui o do script 15)
--    Recusa: termos, dados pessoais e link sem https.
--    Análise da equipe: arquivo de aluno e link de site fora da lista.
create or replace function public.moderar_material()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  motivo text;
  site_novo boolean;
begin
  new.titulo := trim(new.titulo);
  new.descricao := nullif(trim(coalesce(new.descricao, '')), '');
  new.link := nullif(trim(coalesce(new.link, '')), '');

  if char_length(new.titulo) not between 3 and 120 then
    raise exception 'O título precisa ter de 3 a 120 caracteres.';
  end if;
  if char_length(coalesce(new.descricao, '')) > 500 then
    raise exception 'A descrição pode ter no máximo 500 caracteres.';
  end if;

  motivo := public.motivo_bloqueio_material(new.titulo, new.descricao, new.link, new.arquivo_nome);
  if motivo is not null then
    raise exception '%', motivo;
  end if;

  site_novo := new.link is not null and not public.site_permitido(new.link);

  if tg_op = 'INSERT' then
    new.criado_em := now();
    if public.eh_admin() then
      new.status := 'aprovado';
      new.motivo_moderacao := null;
    elsif new.arquivo_path is not null then
      new.status := 'pendente';
      new.motivo_moderacao := 'Arquivo aguardando a análise da equipe.';
    elsif site_novo then
      new.status := 'pendente';
      new.motivo_moderacao := 'Site novo: aguardando a análise da equipe.';
    else
      new.status := 'aprovado';
      new.motivo_moderacao := null;
    end if;
  elsif not public.eh_admin() then
    if old.status = 'recusado' then
      new.status := 'pendente';
      new.motivo_moderacao := 'Alterado pelo autor; aguardando nova análise.';
    elsif site_novo and new.link is distinct from old.link then
      new.status := 'pendente';
      new.motivo_moderacao := 'Site novo: aguardando a análise da equipe.';
    end if;
  end if;

  return new;
end;
$$;


-- 9) Moderação: aprovar o material e liberar o site de uma vez
--    Os outros links do mesmo site que esperavam só por isso também são publicados.
--    Devolve quantos outros materiais foram publicados junto.
create or replace function public.aprovar_e_liberar_site(p_material_id bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link text;
  outros integer;
begin
  if not public.eh_admin() or not public.sessao_mfa_ok() then
    raise exception 'Somente administradores podem moderar materiais.';
  end if;

  select link into v_link from public.materiais where id = p_material_id;
  if not found then
    raise exception 'Material não encontrado.';
  end if;
  if public.dominio_do_link(v_link) is null or public.dominio_do_link(v_link) = '' then
    raise exception 'Este material não tem link para liberar.';
  end if;

  insert into public.filtro_sites (dominio) values (public.dominio_do_link(v_link))
  on conflict (dominio) do nothing;

  perform public.moderar_material(p_material_id, true, null::text);

  update public.materiais m
  set status = 'aprovado', motivo_moderacao = null
  where m.id <> p_material_id
    and m.status = 'pendente'
    and m.arquivo_path is null
    and m.motivo_moderacao = 'Site novo: aguardando a análise da equipe.'
    and public.site_permitido(m.link);
  get diagnostics outros = row_count;
  return outros;
end;
$$;

revoke execute on function public.aprovar_e_liberar_site(bigint) from public, anon;
grant execute on function public.aprovar_e_liberar_site(bigint) to authenticated;


-- 10) Depois de incluir um termo: os materiais JÁ publicados que agora
--     seriam bloqueados voltam para a análise (não são apagados).
create or replace function public.reanalisar_materiais_publicados()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
begin
  if not public.eh_admin() or not public.sessao_mfa_ok() then
    raise exception 'Somente administradores podem reanalisar materiais.';
  end if;

  update public.materiais m
  set status = 'pendente',
      motivo_moderacao = 'Filtro atualizado: ' || public.motivo_bloqueio_material(m.titulo, m.descricao, m.link, m.arquivo_nome)
  where m.status = 'aprovado'
    and public.motivo_bloqueio_material(m.titulo, m.descricao, m.link, m.arquivo_nome) is not null;
  get diagnostics total = row_count;
  return total;
end;
$$;

revoke execute on function public.reanalisar_materiais_publicados() from public, anon;
grant execute on function public.reanalisar_materiais_publicados() to authenticated;
