-- ============================================================
-- EduGuru — 15: materiais da comunidade (moderação, denúncias e perfil
-- público do autor) e quiz com dica 50/50 e ilustrações nas perguntas
--   - cada aluno cadastra os próprios materiais; os aprovados aparecem para
--     todos no fim do quiz e no perfil de quem enviou;
--   - filtro automático: só links de sites permitidos, sem termos impróprios
--     e sem dados pessoais (LGPD); arquivos passam pela análise do admin;
--   - 3 denúncias escondem o material até o admin analisar.
-- Rodar depois do 14.
-- ============================================================


-- 1) Materiais: descrição, situação da moderação e data de envio
alter table public.materiais
  add column if not exists descricao text,
  add column if not exists status text not null default 'pendente',
  add column if not exists motivo_moderacao text,
  add column if not exists criado_em timestamptz not null default now();

alter table public.materiais drop constraint if exists materiais_status_valido;
alter table public.materiais
  add constraint materiais_status_valido check (status in ('pendente', 'aprovado', 'recusado'));


-- 2) Filtro de conteúdo (a mesma regra está em src/funcionalidades/materiais/filtroMateriais.ts)
create or replace function public.sem_acento(texto text)
returns text
language sql
immutable
as $$
  select translate(lower(coalesce(texto, '')),
                   'áàâãäéèêëíìîïóòôõöúùûüç',
                   'aaaaaeeeeiiiiooooouuuuc');
$$;

-- Devolve o motivo do bloqueio, ou null se o material pode ser publicado.
create or replace function public.motivo_bloqueio_material(
  p_titulo text,
  p_descricao text,
  p_link text,
  p_arquivo_nome text
)
returns text
language plpgsql
immutable
as $$
declare
  texto text := public.sem_acento(concat_ws(' ', p_titulo, p_descricao, p_arquivo_nome));
  dominio text;
  dominios_permitidos text[] := array[
    'youtube.com', 'youtu.be', 'github.com', 'gitlab.com', 'developer.mozilla.org',
    'w3schools.com', 'wikipedia.org', 'stackoverflow.com', 'freecodecamp.org',
    'khanacademy.org', 'alura.com.br', 'dio.me', 'rocketseat.com.br', 'udemy.com',
    'coursera.org', 'edx.org', 'cursoemvideo.com', 'devmedia.com.br', 'geeksforgeeks.org',
    'microsoft.com', 'react.dev', 'typescriptlang.org', 'python.org', 'postgresql.org',
    'supabase.com', 'git-scm.com', 'umc.br', 'scielo.br', 'scielo.org', 'gov.br'
  ];
  termos_proibidos text :=
    '\m(porn|porno|pornografia|xxx|nude|nudes|putaria|hentai|onlyfans|'
    || 'cocaina|maconha|crack|crackeado|keygen|torrent|warez|pirata|pirataria|'
    || 'cassino|apostas|bet|tigrinho|arma de fogo|explosivos?|pedofilia|nazismo|terrorismo|'
    || 'porra|caralho|merda|puta|buceta|foder|fdp|vtnc)\M';
begin
  -- "_", "." e "-" viram espaço para pegar nomes como "resumo_keygen.pdf".
  if regexp_replace(texto, '[_.-]', ' ', 'g') ~ termos_proibidos
     or regexp_replace(public.sem_acento(p_link), '[_.-]', ' ', 'g') ~ termos_proibidos then
    return 'O material tem termos impróprios ou ligados a crimes (pirataria, drogas, apostas, conteúdo adulto, ofensas).';
  end if;

  if texto ~ '\d{3}\.?\d{3}\.?\d{3}-?\d{2}'
     or texto ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
     or texto ~ '\(?\d{2}\)?\s?9\d{4}-?\d{4}' then
    return 'Não coloque dados pessoais (CPF, e-mail ou telefone) no material. Isso protege você e os colegas (LGPD).';
  end if;

  if coalesce(p_link, '') <> '' then
    if p_link !~* '^https://[^\s]+$' then
      return 'O link precisa começar com https:// e não pode ter espaços.';
    end if;

    dominio := regexp_replace(lower(substring(p_link from '^https://([^/:?#]+)')), '^www\.', '');
    if not exists (
      select 1 from unnest(dominios_permitidos) d
      where dominio = d or dominio like '%.' || d
    ) then
      return 'Este site não está na lista de sites permitidos (YouTube, GitHub, MDN, Alura, Udemy, Coursera, entre outros).';
    end if;
  end if;

  return null;
end;
$$;


-- 3) Toda vez que o conteúdo muda, o banco confere o filtro.
--    Ao cadastrar: link aprovado na hora; arquivo espera o admin (o admin já publica direto).
--    Ao editar um material recusado, ele volta para a análise do admin.
create or replace function public.moderar_material()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  motivo text;
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

  if tg_op = 'INSERT' then
    new.criado_em := now();
    if public.eh_admin() or new.arquivo_path is null then
      new.status := 'aprovado';
      new.motivo_moderacao := null;
    else
      new.status := 'pendente';
      new.motivo_moderacao := 'Arquivo aguardando a análise da equipe.';
    end if;
  elsif old.status = 'recusado' and not public.eh_admin() then
    new.status := 'pendente';
    new.motivo_moderacao := 'Alterado pelo autor; aguardando nova análise.';
  end if;

  return new;
end;
$$;

drop trigger if exists moderar_material on public.materiais;
create trigger moderar_material
  before insert or update of titulo, descricao, link, arquivo_nome on public.materiais
  for each row execute function public.moderar_material();

-- O aluno não escolhe a situação: ela só muda pelo filtro, pelo admin ou pelas denúncias.
revoke insert, update on public.materiais from anon, authenticated;
grant insert (titulo, descricao, link, arquivo_path, arquivo_nome, arquivo_tamanho, disciplina_id)
  on public.materiais to authenticated;
grant update (titulo, descricao, link, disciplina_id) on public.materiais to authenticated;

-- Materiais que já existiam: links que passam no filtro ficam aprovados; o resto vai para análise.
update public.materiais m
set status = case
      when m.arquivo_path is null
           and public.motivo_bloqueio_material(m.titulo, m.descricao, m.link, m.arquivo_nome) is null
      then 'aprovado' else 'pendente' end,
    motivo_moderacao = coalesce(
      public.motivo_bloqueio_material(m.titulo, m.descricao, m.link, m.arquivo_nome),
      case when m.arquivo_path is not null then 'Arquivo aguardando a análise da equipe.' end)
where m.status = 'pendente' and m.motivo_moderacao is null;


-- 4) Quem vê o quê: aprovados para todos; pendentes e recusados só para o autor e o admin
drop policy if exists "materiais_select" on public.materiais;
create policy "materiais_select" on public.materiais
  for select to authenticated
  using (status = 'aprovado' or enviado_por = auth.uid() or public.eh_admin());

drop policy if exists "materiais_arquivos_select" on storage.objects;
create policy "materiais_arquivos_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'materiais'
    and (
      owner = auth.uid()
      or public.eh_admin()
      or exists (
        select 1 from public.materiais m
        where m.arquivo_path = storage.objects.name and m.status = 'aprovado'
      )
    )
  );


-- 5) Denúncias: cada aluno denuncia um material uma vez; com 3, ele some até o admin analisar
create table if not exists public.denuncias_materiais (
  material_id bigint not null references public.materiais(id) on delete cascade,
  usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  motivo text not null check (char_length(motivo) between 3 and 200),
  criada_em timestamptz not null default now(),
  primary key (material_id, usuario_id)
);

alter table public.denuncias_materiais enable row level security;

-- Pela API só o admin lê; denunciar é pela função abaixo.
drop policy if exists "denuncias_admin_le" on public.denuncias_materiais;
create policy "denuncias_admin_le" on public.denuncias_materiais
  for select to authenticated using (public.eh_admin());

drop policy if exists "mfa_obrigatorio" on public.denuncias_materiais;
create policy "mfa_obrigatorio" on public.denuncias_materiais
  as restrictive for all to authenticated
  using (public.sessao_mfa_ok()) with check (public.sessao_mfa_ok());

create or replace function public.denunciar_material(p_material_id bigint, p_motivo text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  material public.materiais%rowtype;
  total integer;
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para denunciar.';
  end if;

  select * into material from public.materiais where id = p_material_id and status = 'aprovado';
  if not found then
    raise exception 'Material não encontrado.';
  end if;
  if material.enviado_por = auth.uid() then
    raise exception 'Você não pode denunciar o próprio material.';
  end if;

  insert into public.denuncias_materiais (material_id, usuario_id, motivo)
  values (p_material_id, auth.uid(), left(trim(p_motivo), 200))
  on conflict (material_id, usuario_id) do nothing;

  select count(*) into total from public.denuncias_materiais where material_id = p_material_id;

  if total >= 3 then
    update public.materiais
    set status = 'pendente', motivo_moderacao = 'Ocultado após denúncias; aguardando a análise da equipe.'
    where id = p_material_id;
    return 'Obrigado! O material foi ocultado até a equipe analisar.';
  end if;

  return 'Obrigado! A equipe vai analisar o material.';
end;
$$;

revoke execute on function public.denunciar_material(bigint, text) from public, anon;
grant execute on function public.denunciar_material(bigint, text) to authenticated;


-- 6) Moderação (admin): lista o que precisa de análise e aprova ou recusa
create or replace function public.materiais_em_moderacao()
returns table (
  id bigint,
  titulo text,
  descricao text,
  link text,
  arquivo_path text,
  arquivo_nome text,
  arquivo_tamanho integer,
  disciplina_id bigint,
  status text,
  motivo_moderacao text,
  autor_nome text,
  denuncias bigint,
  motivos_denuncias text
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.eh_admin() or not public.sessao_mfa_ok() then
    raise exception 'Somente administradores podem moderar materiais.';
  end if;

  return query
    select m.id, m.titulo, m.descricao, m.link, m.arquivo_path, m.arquivo_nome, m.arquivo_tamanho,
           m.disciplina_id, m.status, m.motivo_moderacao, coalesce(p.nome, '—'),
           count(d.usuario_id),
           string_agg(distinct d.motivo, '; ')
    from public.materiais m
    left join public.perfis p on p.id = m.enviado_por
    left join public.denuncias_materiais d on d.material_id = m.id
    group by m.id, p.nome
    having m.status = 'pendente' or (m.status = 'aprovado' and count(d.usuario_id) > 0)
    order by m.status = 'pendente' desc, count(d.usuario_id) desc, m.id;
end;
$$;

revoke execute on function public.materiais_em_moderacao() from public, anon;
grant execute on function public.materiais_em_moderacao() to authenticated;

create or replace function public.moderar_material(p_material_id bigint, p_aprovar boolean, p_motivo text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.eh_admin() or not public.sessao_mfa_ok() then
    raise exception 'Somente administradores podem moderar materiais.';
  end if;

  update public.materiais
  set status = case when p_aprovar then 'aprovado' else 'recusado' end,
      motivo_moderacao = case
        when p_aprovar then null
        else coalesce(nullif(trim(p_motivo), ''), 'Não segue as regras de uso da plataforma.')
      end
  where id = p_material_id;

  if not found then
    raise exception 'Material não encontrado.';
  end if;

  -- Aprovado depois da análise: as denúncias já foram vistas.
  if p_aprovar then
    delete from public.denuncias_materiais where material_id = p_material_id;
  end if;
end;
$$;

revoke execute on function public.moderar_material(bigint, boolean, text) from public, anon;
grant execute on function public.moderar_material(bigint, boolean, text) to authenticated;


-- 7) Materiais da comunidade (fim do quiz e perfil do autor): só aprovados,
--    com o nome abreviado e o curso de quem enviou
create or replace function public.materiais_da_comunidade(
  p_disciplina_id bigint default null,
  p_autor_id uuid default null
)
returns table (
  id bigint,
  titulo text,
  descricao text,
  link text,
  arquivo_path text,
  arquivo_nome text,
  arquivo_tamanho integer,
  disciplina_id bigint,
  disciplina text,
  autor_id uuid,
  autor_nome text,
  autor_curso text,
  criado_em timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para ver os materiais.';
  end if;

  return query
    select m.id, m.titulo, m.descricao, m.link, m.arquivo_path, m.arquivo_nome, m.arquivo_tamanho,
           m.disciplina_id, d.nome, m.enviado_por, public.nome_publico(p.nome), p.curso, m.criado_em
    from public.materiais m
    join public.perfis p on p.id = m.enviado_por
    left join public.disciplinas d on d.id = m.disciplina_id
    where m.status = 'aprovado'
      and (p_disciplina_id is null or m.disciplina_id = p_disciplina_id)
      and (p_autor_id is null or m.enviado_por = p_autor_id)
    order by m.criado_em desc, m.id desc;
end;
$$;

revoke execute on function public.materiais_da_comunidade(bigint, uuid) from public, anon;
grant execute on function public.materiais_da_comunidade(bigint, uuid) to authenticated;

-- Perfil público: só nome abreviado e curso, e só de quem tem material aprovado.
create or replace function public.perfil_publico(p_usuario_id uuid)
returns table (
  nome text,
  curso text,
  equipe boolean,
  materiais bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para ver perfis.';
  end if;

  return query
    select public.nome_publico(p.nome), p.curso, p.papel = 'admin',
           (select count(*) from public.materiais m
            where m.enviado_por = p.id and m.status = 'aprovado')
    from public.perfis p
    where p.id = p_usuario_id
      and (p.id = auth.uid() or exists (
        select 1 from public.materiais m where m.enviado_por = p.id and m.status = 'aprovado'
      ));
end;
$$;

revoke execute on function public.perfil_publico(uuid) from public, anon;
grant execute on function public.perfil_publico(uuid) to authenticated;


-- 8) Quiz: dica 50/50 (tira duas alternativas erradas), uma por rodada
alter table public.tentativas_quiz
  add column if not exists dica_usada boolean not null default false;

create or replace function public.pedir_dica(p_tentativa_id bigint, p_pergunta_id bigint)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  rodada public.tentativas_quiz%rowtype;
  certa char(1);
  eliminadas text[];
begin
  if auth.uid() is null or not public.sessao_mfa_ok() then
    raise exception 'Entre com a verificação em duas etapas para jogar.';
  end if;

  select * into rodada
  from public.tentativas_quiz t
  where t.id = p_tentativa_id and t.aluno_id = auth.uid();

  if not found or rodada.finalizada_em is not null then
    raise exception 'Rodada de quiz não encontrada.';
  end if;
  if rodada.dica_usada then
    raise exception 'Você já usou a dica desta rodada.';
  end if;
  if not exists (
    select 1 from public.respostas_quiz r
    where r.tentativa_id = p_tentativa_id and r.pergunta_id = p_pergunta_id and r.resposta is null
  ) then
    raise exception 'Esta pergunta não está aguardando resposta.';
  end if;

  select g.correta into certa from public.gabaritos g where g.pergunta_id = p_pergunta_id;

  select array_agg(letra order by letra) into eliminadas
  from (
    select letra
    from unnest(array['A', 'B', 'C', 'D']) as letra
    where letra <> certa
    order by random()
    limit 2
  ) sorteio;

  update public.tentativas_quiz set dica_usada = true where id = p_tentativa_id;

  return eliminadas;
end;
$$;

revoke execute on function public.pedir_dica(bigint, bigint) from public, anon;
grant execute on function public.pedir_dica(bigint, bigint) to authenticated;


-- 9) Ilustrações das perguntas (arquivos em public/ilustracoes, que vêm com o sistema).
--    Não troca a imagem que o admin já tenha enviado.
update public.perguntas p
set imagem_path = v.imagem
from (values
  ('Em um fluxograma, qual símbolo representa uma **decisão**?', 'ilustracoes/logica-fluxograma.svg'),
  ('Quantas vezes o laço "para i de 1 até 10 **passo 2**" é executado?', 'ilustracoes/logica-laco-passo.svg'),
  ('Depois de executar x ← 5; y ← x; x ← x + 3, qual é o **valor de y**?', 'ilustracoes/logica-variaveis.svg'),
  ('Em um vetor de 10 posições indexado **a partir de 0**, qual é o índice do último elemento?', 'ilustracoes/logica-vetor.svg'),
  ('Qual é o resultado de **fatorial(4)**, calculado por recursão?', 'ilustracoes/logica-fatorial.svg'),
  ('O percurso **em ordem (in-order)** de uma árvore binária de busca visita os nós em que ordem?', 'ilustracoes/estruturas-arvore.svg'),
  ('Qual estrutura controla as **chamadas de funções** (inclusive recursivas) durante a execução de um programa?', 'ilustracoes/estruturas-chamadas.svg'),
  ('Em uma tabela hash, o que é uma **colisão**?', 'ilustracoes/estruturas-hash.svg'),
  ('Qual estrutura é a mais indicada para representar **ruas e cruzamentos** em um aplicativo de rotas?', 'ilustracoes/estruturas-mapa.svg'),
  ('Em um banco relacional, como se chama o campo que **identifica unicamente** cada linha de uma tabela?', 'ilustracoes/bd-tabela.svg'),
  ('Qual cláusula **filtra as linhas** retornadas por um SELECT?', 'ilustracoes/bd-where.svg'),
  ('Um aluno pode cursar várias disciplinas e cada disciplina tem vários alunos. Qual é a **cardinalidade** desse relacionamento?', 'ilustracoes/bd-cardinalidade.svg'),
  ('Qual JOIN retorna **todas as linhas da tabela da esquerda**, mesmo as que não têm correspondência na tabela da direita?', 'ilustracoes/bd-join.svg'),
  ('O **Git** é uma ferramenta de quê?', 'ilustracoes/es-git.svg'),
  ('Qual diagrama da UML representa os **atores** e as funcionalidades que eles usam no sistema?', 'ilustracoes/es-casos-de-uso.svg'),
  ('No Kanban, para que serve o **limite de WIP** (Work In Progress)?', 'ilustracoes/es-kanban.svg'),
  ('Em um diagrama de classes, o que indica a **composição (losango preenchido)**?', 'ilustracoes/es-composicao.svg'),
  ('Qual tag HTML cria um **link para outra página**?', 'ilustracoes/pi-link.svg'),
  ('Qual método HTTP é normalmente usado para **enviar ao servidor** os dados de um formulário de cadastro?', 'ilustracoes/pi-formulario.svg'),
  ('No CSS Flexbox, qual propriedade alinha os itens ao longo do **eixo principal**?', 'ilustracoes/pi-flexbox.svg'),
  ('O que é o **DOM**?', 'ilustracoes/pi-dom.svg'),
  ('Qual a diferença entre **== e ===** em JavaScript?', 'ilustracoes/pi-igualdade.svg'),
  ('No React, qual hook guarda um valor que, quando muda, faz o componente ser **desenhado de novo**?', 'ilustracoes/aw-estado.svg'),
  ('No React, como os dados são passados de um **componente pai para um componente filho**?', 'ilustracoes/aw-props.svg'),
  ('O que é uma **API REST**?', 'ilustracoes/aw-api.svg'),
  ('No React, o que acontece ao **alterar o estado diretamente** (ex.: lista.push(item)) em vez de usar a função set do useState?', 'ilustracoes/aw-push.svg'),
  ('Qual equipamento **interliga redes diferentes** e encaminha pacotes entre elas, como a rede de casa e a internet?', 'ilustracoes/redes-roteador.svg'),
  ('Em qual camada do modelo OSI atua o **roteador**?', 'ilustracoes/redes-osi.svg'),
  ('O que faz o **NAT** em um roteador doméstico?', 'ilustracoes/redes-nat.svg'),
  ('Qual é o **endereço de broadcast** da rede 192.168.10.0/24?', 'ilustracoes/redes-broadcast.svg'),
  ('Quais são, em ordem, as três etapas do estabelecimento de conexão TCP (**three-way handshake**)?', 'ilustracoes/redes-handshake.svg'),
  ('Quais são os três pilares da segurança da informação (**tríade CID**)?', 'ilustracoes/seg-cid.svg'),
  ('O que é **phishing**?', 'ilustracoes/seg-phishing.svg'),
  ('O que é **SQL Injection**?', 'ilustracoes/seg-sql-injection.svg'),
  ('O que é **XSS (Cross-Site Scripting)**?', 'ilustracoes/seg-xss.svg'),
  ('Qual a diferença entre criptografia **simétrica e assimétrica**?', 'ilustracoes/seg-criptografia.svg')
) as v(enunciado, imagem)
where p.enunciado = v.enunciado
  and (p.imagem_path is null or p.imagem_path like 'ilustracoes/%');


-- Conferência
select status, count(*) as materiais from public.materiais group by status order by status;
select count(*) as perguntas_com_imagem from public.perguntas where imagem_path is not null;
