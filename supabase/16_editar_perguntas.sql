-- ============================================================
-- EduGuru — 16: editar perguntas (completa o CRUD do banco de questões)
--   - grava pergunta, gabarito e explicação juntos, com as mesmas regras
--     do cadastro (criar_pergunta, script 11);
--   - disciplinas e materiais já podem ser editados pelas regras de acesso
--     dos scripts 02, 04 e 15.
-- Rodar depois do 15.
-- ============================================================


create or replace function public.editar_pergunta(
  p_id bigint,
  p_enunciado text,
  p_disciplina_id bigint,
  p_nivel text,
  p_alternativa_a text,
  p_alternativa_b text,
  p_alternativa_c text,
  p_alternativa_d text,
  p_correta text,
  p_explicacao text default null,
  p_imagem_path text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  alternativas text[] := array[
    trim(coalesce(p_alternativa_a, '')), trim(coalesce(p_alternativa_b, '')),
    trim(coalesce(p_alternativa_c, '')), trim(coalesce(p_alternativa_d, ''))
  ];
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem editar perguntas.';
  end if;

  if not exists (select 1 from public.perguntas where id = p_id) then
    raise exception 'Pergunta não encontrada.';
  end if;

  if length(trim(coalesce(p_enunciado, ''))) < 10 then
    raise exception 'O enunciado precisa ter pelo menos 10 caracteres.';
  end if;

  if length(p_enunciado) > 500 then
    raise exception 'O enunciado pode ter no máximo 500 caracteres.';
  end if;

  if not exists (select 1 from public.disciplinas where id = p_disciplina_id) then
    raise exception 'Escolha uma disciplina válida.';
  end if;

  if p_nivel not in ('Fácil', 'Médio', 'Difícil') then
    raise exception 'Nível inválido.';
  end if;

  if '' = any(alternativas) then
    raise exception 'Preencha as quatro alternativas.';
  end if;

  if (select count(distinct lower(a)) from unnest(alternativas) as a) < 4 then
    raise exception 'As quatro alternativas precisam ser diferentes.';
  end if;

  if upper(coalesce(p_correta, '')) not in ('A', 'B', 'C', 'D') then
    raise exception 'Escolha qual alternativa é a correta.';
  end if;

  if length(coalesce(p_explicacao, '')) > 600 then
    raise exception 'A explicação pode ter no máximo 600 caracteres.';
  end if;

  update public.perguntas
     set enunciado = trim(p_enunciado),
         disciplina_id = p_disciplina_id,
         nivel = p_nivel,
         alternativa_a = alternativas[1],
         alternativa_b = alternativas[2],
         alternativa_c = alternativas[3],
         alternativa_d = alternativas[4],
         imagem_path = nullif(p_imagem_path, '')
   where id = p_id;

  insert into public.gabaritos (pergunta_id, correta, explicacao)
  values (p_id, upper(p_correta), nullif(trim(coalesce(p_explicacao, '')), ''))
  on conflict (pergunta_id) do update
    set correta = excluded.correta,
        explicacao = excluded.explicacao;
end;
$$;

revoke execute on function public.editar_pergunta(bigint, text, bigint, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.editar_pergunta(bigint, text, bigint, text, text, text, text, text, text, text, text) to authenticated;
