-- ============================================================
-- EduGuru — 03: arquivos dos materiais (PDF/DOCX até 5 MB)
-- ============================================================

alter table public.materiais
  alter column link drop not null,
  add column if not exists arquivo_path text,
  add column if not exists arquivo_nome text,
  add column if not exists arquivo_tamanho integer;

-- Bucket privado: os arquivos só abrem por link temporário, para quem está logado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materiais',
  'materiais',
  false,
  5242880, -- 5 MB
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "materiais_arquivos_select" on storage.objects;
create policy "materiais_arquivos_select" on storage.objects
  for select to authenticated using (bucket_id = 'materiais');

drop policy if exists "materiais_arquivos_insert" on storage.objects;
create policy "materiais_arquivos_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'materiais');
