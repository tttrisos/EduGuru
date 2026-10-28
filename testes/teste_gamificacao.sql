-- ============================================================
-- EduGuru — Testes automáticos do Quiz, Ranking, Guru e Notas
-- (atualizações 10 a 12)
--
-- Como usar: cole tudo no SQL Editor do Supabase e clique em Run,
-- DEPOIS de rodar os supabase_atualizacao_10.sql a _12.sql.
--
-- NADA FICA GRAVADO: igual ao teste_fase_a.sql, o script termina com um
-- ERRO proposital que mostra o relatório e desfaz tudo.
-- Cada linha do relatório deve começar com "[OK]".
-- ============================================================

begin;

create temp table _res (n serial, teste text, resultado text);
create temp table _ctx (chave text primary key, valor text);

-- Ajudante: "entra" como um usuário (simula o site chamando a API).
create function pg_temp.entrar_como(usuario uuid, nivel text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', usuario, 'role', 'authenticated', 'aal', nivel)::text, true);
  execute 'set local role authenticated';
end $$;

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'aluno.a@teste.eduguru',
   '{"nome":"Aluno Alfa Teste","curso":"SI","consentimento_aceito":true,"versao_termos":"1.2"}',
   'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b2', 'aluno.b@teste.eduguru',
   '{"nome":"Aluno Beta","curso":"ADS","consentimento_aceito":true,"versao_termos":"1.2"}',
   'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c3', 'admin.c@teste.eduguru',
   '{"nome":"Admin C","curso":"ES","consentimento_aceito":true,"versao_termos":"1.2"}',
   'authenticated', 'authenticated');

update public.perfis set papel = 'admin' where id = '00000000-0000-0000-0000-0000000000c3';

insert into public.disciplinas (nome, curso, total_aulas) values ('Disciplina de Teste', 'SI', 80);
insert into _ctx values ('disc', (select max(id)::text from public.disciplinas where nome = 'Disciplina de Teste'));


-- ---------- Cadastro de perguntas ----------
do $$
declare r text; d bigint := (select valor::bigint from _ctx where chave = 'disc');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  begin
    perform public.criar_pergunta('Pergunta criada por aluno?', d, 'Fácil', 'a', 'b', 'c', 'd', 'A');
    r := 'FALHOU: aluno cadastrou pergunta';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO cadastra pergunta', r);
end $$;

do $$
declare r text; d bigint := (select valor::bigint from _ctx where chave = 'disc');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000c3', 'aal2');
  begin
    perform public.criar_pergunta('Alternativas repetidas?', d, 'Fácil', 'igual', 'Igual', 'c', 'd', 'A');
    r := 'FALHOU: aceitou alternativas repetidas';
  exception when others then
    r := 'OK (recusado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Pergunta com alternativas repetidas é recusada', r);
end $$;

-- Três perguntas válidas, uma de cada nível, todas com gabarito "B".
do $$
declare r text; d bigint := (select valor::bigint from _ctx where chave = 'disc');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000c3', 'aal2');
  begin
    perform public.criar_pergunta('Pergunta fácil de teste', d, 'Fácil', 'a1', 'b1', 'c1', 'd1', 'B');
    perform public.criar_pergunta('Pergunta média de teste', d, 'Médio', 'a2', 'b2', 'c2', 'd2', 'B');
    perform public.criar_pergunta('Pergunta difícil de teste', d, 'Difícil', 'a3', 'b3', 'c3', 'd3', 'B');
    r := 'OK';
  exception when others then
    r := 'FALHOU: ' || sqlerrm;
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Admin cadastra pergunta com alternativas e gabarito', r);
end $$;

do $$
declare qtd integer;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  select count(*) into qtd from public.gabaritos;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO lê o gabarito',
    case when qtd = 0 then 'OK' else 'FALHOU: leu ' || qtd || ' gabaritos' end);
end $$;


-- ---------- Quiz ----------
do $$
declare r text; d bigint := (select valor::bigint from _ctx where chave = 'disc');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal1');
  begin
    perform public.iniciar_quiz(d);
    r := 'FALHOU: iniciou quiz sem MFA';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Quiz exige sessão com MFA (aal2)', r);
end $$;

do $$
declare qtd integer; tent bigint; d bigint := (select valor::bigint from _ctx where chave = 'disc');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  select count(*), max(tentativa_id) into qtd, tent from public.iniciar_quiz(d);
  execute 'reset role';
  insert into _ctx values ('tent1', tent::text);
  insert into _res (teste, resultado) values ('Iniciar quiz sorteia as perguntas da disciplina',
    case when qtd = 3 then 'OK' else 'FALHOU: veio ' || qtd end);
end $$;

do $$
declare r text;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  begin
    insert into public.tentativas_quiz (aluno_id, pontos)
    values ('00000000-0000-0000-0000-0000000000a1', 9999);
    r := 'FALHOU: aluno gravou a própria pontuação';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO grava pontuação direto na tabela', r);
end $$;

do $$
declare r text; tent bigint := (select valor::bigint from _ctx where chave = 'tent1');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000b2', 'aal2');
  begin
    perform public.finalizar_quiz(tent, '{}'::jsonb);
    r := 'FALHOU: aluno B finalizou a rodada do aluno A';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO finaliza rodada de outro aluno', r);
end $$;

-- Aluno A acerta tudo: 10 + 20 + 30 = 60 pontos.
do $$
declare respostas jsonb; total integer; acertos integer;
        tent bigint := (select valor::bigint from _ctx where chave = 'tent1');
begin
  select jsonb_object_agg(pergunta_id::text, 'B') into respostas
  from public.respostas_quiz where tentativa_id = tent;

  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  select sum(pontos), count(*) filter (where acertou) into total, acertos
  from public.finalizar_quiz(tent, respostas);
  execute 'reset role';
  insert into _res (teste, resultado) values ('Correção e pontos por nível (10/20/30)',
    case when total = 60 and acertos = 3 then 'OK' else 'FALHOU: ' || total || ' pontos, ' || acertos || ' acertos' end);
end $$;

do $$
declare r text; tent bigint := (select valor::bigint from _ctx where chave = 'tent1');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  begin
    perform public.finalizar_quiz(tent, '{}'::jsonb);
    r := 'FALHOU: finalizou a mesma rodada duas vezes';
  exception when others then
    r := 'OK (recusado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Rodada não pode ser finalizada duas vezes', r);
end $$;

-- Segunda rodada, acertando tudo de novo: as perguntas já foram acertadas, 0 pontos.
do $$
declare respostas jsonb; total integer; tent bigint; d bigint := (select valor::bigint from _ctx where chave = 'disc');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  select max(tentativa_id) into tent from public.iniciar_quiz(d);
  execute 'reset role';

  select jsonb_object_agg(pergunta_id::text, 'B') into respostas
  from public.respostas_quiz where tentativa_id = tent;

  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  select sum(pontos) into total from public.finalizar_quiz(tent, respostas);
  execute 'reset role';
  insert into _res (teste, resultado) values ('Pergunta só pontua na primeira vez que é acertada',
    case when total = 0 then 'OK' else 'FALHOU: ganhou ' || total || ' pontos de novo' end);
end $$;

do $$
declare qtd integer;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000b2', 'aal2');
  select count(*) into qtd from public.tentativas_quiz;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO vê rodadas de outro aluno',
    case when qtd = 0 then 'OK' else 'FALHOU: viu ' || qtd end);
end $$;


-- ---------- Ranking ----------
do $$
declare linha record;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  select * into linha from public.ranking() where eh_voce;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Ranking: 1º lugar, nome abreviado e 60 pontos',
    case when linha.posicao = 1 and linha.nome = 'Aluno A.' and linha.pontos = 60
         then 'OK' else 'FALHOU: ' || coalesce(linha::text, 'sem linha') end);
end $$;

update public.perfis set aparecer_no_ranking = false where id = '00000000-0000-0000-0000-0000000000a1';

do $$
declare nome_visto text;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000b2', 'aal2');
  select nome into nome_visto from public.ranking() where posicao = 1;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Quem sai do ranking aparece como "Aluno anônimo"',
    case when nome_visto = 'Aluno anônimo' then 'OK' else 'FALHOU: ' || coalesce(nome_visto, 'nada') end);
end $$;


-- ---------- Guru ----------
-- Aluno B envia um material da disciplina e erra tudo em duas rodadas
-- (0 de 6 = 0%, com pelo menos 5 respostas) -> Guru indica o material.
do $$
declare respostas jsonb; tent bigint; i integer; qtd integer;
        d bigint := (select valor::bigint from _ctx where chave = 'disc');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000b2', 'aal2');
  insert into public.materiais (titulo, link, disciplina_id)
  values ('Material de revisão (teste)', 'https://exemplo.com', d);
  execute 'reset role';

  for i in 1..2 loop
    perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000b2', 'aal2');
    select max(tentativa_id) into tent from public.iniciar_quiz(d);
    execute 'reset role';
    select jsonb_object_agg(pergunta_id::text, 'D') into respostas
    from public.respostas_quiz where tentativa_id = tent;
    perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000b2', 'aal2');
    perform public.finalizar_quiz(tent, respostas);
    execute 'reset role';
  end loop;

  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000b2', 'aal2');
  select count(*) into qtd from public.recomendacoes_guru() where titulo = 'Material de revisão (teste)';
  execute 'reset role';
  insert into _res (teste, resultado) values ('Guru indica material quando aproveitamento < 60%',
    case when qtd = 1 then 'OK' else 'FALHOU: ' || qtd || ' indicações' end);
end $$;

do $$
declare qtd integer;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  select count(*) into qtd from public.recomendacoes_guru();
  execute 'reset role';
  insert into _res (teste, resultado) values ('Guru NÃO indica nada para quem vai bem (100%)',
    case when qtd = 0 then 'OK' else 'FALHOU: ' || qtd || ' indicações' end);
end $$;


-- ---------- Notas e faltas ----------
do $$
declare r text; d bigint := (select valor::bigint from _ctx where chave = 'disc');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  begin
    insert into public.notas (disciplina_id, m1, m2, faltas) values (d, 7.5, 6, 4);
    r := 'OK';
  exception when others then
    r := 'FALHOU: ' || sqlerrm;
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno registra as próprias notas e faltas', r);
end $$;

do $$
declare r text; d bigint := (select valor::bigint from _ctx where chave = 'disc');
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000b2', 'aal2');
  begin
    insert into public.notas (disciplina_id, m1) values (d, 11);
    r := 'FALHOU: aceitou nota 11';
  exception when others then
    r := 'OK (recusado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Nota fora de 0 a 10 é recusada', r);
end $$;

do $$
declare qtd_b integer; qtd_admin integer;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000b2', 'aal2');
  select count(*) into qtd_b from public.notas;
  execute 'reset role';
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000c3', 'aal2');
  select count(*) into qtd_admin from public.notas;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Notas de um aluno não aparecem para outro aluno nem para o admin',
    case when qtd_b = 0 and qtd_admin = 0 then 'OK' else 'FALHOU: B viu ' || qtd_b || ', admin viu ' || qtd_admin end);
end $$;

insert into _res (teste, resultado)
select 'Log das notas NÃO guarda os valores',
  case when count(*) >= 1 and bool_and(detalhes is null) then 'OK' else 'FALHOU' end
from public.logs_auditoria where tabela = 'notas';


-- ---------- Admin ----------
do $$
declare r text;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  begin
    perform public.estatisticas_admin();
    r := 'FALHOU: aluno leu estatísticas do admin';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO acessa estatísticas do admin', r);
end $$;

do $$
declare dados jsonb;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000c3', 'aal2');
  dados := public.estatisticas_admin();
  execute 'reset role';
  insert into _res (teste, resultado) values ('Estatísticas do admin contam os quizzes finalizados',
    case when (dados->>'quizzes')::int >= 4 and jsonb_array_length(dados->'quizzes_por_dia') = 7
         then 'OK' else 'FALHOU: ' || dados::text end);
end $$;

do $$
declare r text;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000a1', 'aal2');
  begin
    perform public.redefinir_mfa_usuario('00000000-0000-0000-0000-0000000000b2');
    r := 'FALHOU: aluno redefiniu o MFA de outro';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO redefine MFA de ninguém', r);
end $$;

do $$
declare r text;
begin
  perform pg_temp.entrar_como('00000000-0000-0000-0000-0000000000c3', 'aal2');
  begin
    perform public.redefinir_mfa_usuario('00000000-0000-0000-0000-0000000000b2');
    r := 'OK';
  exception when others then
    r := 'FALHOU: ' || sqlerrm;
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Admin redefine o MFA de um usuário (com log)',
    case when r = 'OK' and exists (select 1 from public.logs_auditoria where acao = 'mfa_redefinido')
         then 'OK' else coalesce(nullif(r, 'OK'), 'FALHOU: sem log') end);
end $$;


-- ---------- Relatório (e desfaz tudo) ----------
do $$
declare relatorio text;
begin
  select string_agg(lpad(n::text, 2, '0') || '. ' ||
                    case when resultado like 'OK%' then '[OK]     ' else '[FALHOU] ' end ||
                    teste || ' -> ' || resultado, E'\n' order by n)
  into relatorio from _res;
  raise exception E'FIM DOS TESTES — nada foi gravado (este erro desfaz a transação).\n%', relatorio;
end $$;
