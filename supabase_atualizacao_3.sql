-- ============================================================
-- EduGuru — Atualização 3: cidade/estado via ViaCEP (opcional)
-- Rodar no SQL Editor do Supabase, DEPOIS dos dois SQLs anteriores
-- ============================================================

-- Novas colunas no perfil. Repare que NÃO criamos uma coluna "cep" —
-- de propósito: o CEP em si não precisa ser guardado, só o resultado
-- da consulta (cidade/estado). Isso é minimização de dados na prática.
alter table public.perfis
  add column if not exists cidade text,
  add column if not exists estado text;

-- Atualiza a função que cria o perfil automaticamente no cadastro,
-- pra também puxar cidade/estado do metadata (que o front-end manda
-- OPCIONALMENTE, só se a pessoa preencheu o CEP e a busca deu certo).
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, papel, curso, cidade, estado)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    'aluno',
    new.raw_user_meta_data->>'curso',
    new.raw_user_meta_data->>'cidade',
    new.raw_user_meta_data->>'estado'
  );
  return new;
end;
$$;
-- Não precisa recriar o trigger "ao_criar_usuario": ele já aponta pro
-- nome desta função, então só de trocar a função (create or replace)
-- o comportamento novo já passa a valer.