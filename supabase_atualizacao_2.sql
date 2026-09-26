-- ============================================================
-- EduGuru — Atualização 2: limpeza de logs + upload de arquivos
-- Rodar no SQL Editor do Supabase, DEPOIS do supabase_setup_auth_logs.sql
-- ============================================================


-- ------------------------------------------------------------
-- 1) LIMPEZA DE LOGS ANTIGOS
-- ------------------------------------------------------------
-- Função que apaga logs de auditoria mais antigos que X dias
-- (90 por padrão). Só admin pode chamar. Devolve quantos logs
-- foram removidos, pra mostrar um retorno claro na tela.
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

  delete from public.logs_auditoria
  where criado_em < now() - (dias || ' days')::interval;

  get diagnostics qtd_removida = row_count;
  return qtd_removida;
end;
$$;

grant execute on function public.limpar_logs_antigos(integer) to authenticated;

-- OPCIONAL: se o seu projeto tiver a extensão "pg_cron" disponível
-- (Database > Extensions, no painel do Supabase), você pode agendar
-- essa limpeza pra rodar sozinha todo mês, sem precisar clicar em nada:
--
-- create extension if not exists pg_cron;
-- select cron.schedule('limpeza-logs-mensal', '0 3 1 * *', $$select public.limpar_logs_antigos(90);$$);
--
-- Isso roda todo dia 1 às 3h da manhã. Se a extensão não aparecer
-- disponível no seu projeto gratuito, sem problema: o botão manual
-- (que a gente coloca no site) resolve igual.


-- ------------------------------------------------------------
-- 2) MATERIAIS: permitir anexar arquivo (PDF/DOCX), além do link
-- ------------------------------------------------------------
alter table public.materiais
  alter column link drop not null,
  add column if not exists arquivo_path text,
  add column if not exists arquivo_nome text,
  add column if not exists arquivo_tamanho integer;

-- Bucket de armazenamento "materiais": limite de 5 MB por arquivo,
-- aceitando só PDF e DOCX (nada de .exe, .zip, etc. sendo enviado).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materiais',
  'materiais',
  true,
  5242880, -- 5 MB em bytes (5 * 1024 * 1024)
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Regras de acesso ao bucket: qualquer logado pode ver e enviar;
-- só quem enviou o arquivo (dono) pode excluir.
drop policy if exists "materiais_arquivos_select" on storage.objects;
create policy "materiais_arquivos_select" on storage.objects
  for select to authenticated using (bucket_id = 'materiais');

drop policy if exists "materiais_arquivos_insert" on storage.objects;
create policy "materiais_arquivos_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'materiais');

drop policy if exists "materiais_arquivos_delete" on storage.objects;
create policy "materiais_arquivos_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'materiais' and owner = auth.uid());