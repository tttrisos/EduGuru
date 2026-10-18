-- ============================================================
-- EduGuru — Testes da atualização 9 (logs de "esqueci minha senha")
-- Rodar no SQL Editor DEPOIS do supabase_atualizacao_9.sql.
-- Mesmo esquema do teste_fase_a.sql: nada fica gravado; o resultado
-- aparece como um ERRO proposital no final ("Run without RLS" no aviso).
-- ============================================================

begin;

create temp table _res (n serial, teste text, resultado text);

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000d4', 'aluno.d@teste.eduguru',
   '{"nome":"Aluno D","curso":"SI","consentimento_aceito":true,"versao_termos":"1.1"}',
   'authenticated', 'authenticated');

-- Pedido de redefinição sem login: limite de 5 por e-mail a cada 10 min.
do $$
declare i integer; qtd integer;
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  for i in 1..8 loop
    perform public.registrar_pedido_redefinicao('Aluno.D@teste.eduguru ');
  end loop;
  execute 'reset role';
  select count(*) into qtd from public.logs_auditoria
  where acao = 'redefinicao_senha_solicitada' and usuario_email = 'aluno.d@teste.eduguru';
  insert into _res (teste, resultado) values ('Pedido de redefinição limitado a 5/10 min (e-mail normalizado)',
    case when qtd = 5 then 'OK' else 'FALHOU: gravou ' || qtd end);
end $$;

-- 'senha_redefinida' aceito com a sessão do link (aal1, conta sem MFA).
do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated","aal":"aal1"}', true);
  execute 'set local role authenticated';
  begin
    perform public.registrar_evento_auth('senha_redefinida', null);
    r := 'OK';
  exception when others then
    r := 'FALHOU: ' || sqlerrm;
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Log "senha_redefinida" aceito', r);
end $$;

-- A lista fechada continua valendo e 'login' continua exigindo aal2.
do $$
declare r1 text; r2 text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated","aal":"aal1"}', true);
  execute 'set local role authenticated';
  begin
    perform public.registrar_evento_auth('redefinicao_senha_solicitada', null);
    r1 := 'FALHOU: aceitou evento fora da lista';
  exception when others then
    r1 := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  begin
    perform public.registrar_evento_auth('login', null);
    r2 := 'FALHOU: aceitou login sem MFA';
  exception when others then
    r2 := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Lista fechada mantida', r1);
  insert into _res (teste, resultado) values ('"login" continua exigindo aal2', r2);
end $$;

do $$
declare relatorio text;
begin
  select string_agg(lpad(n::text, 2, '0') || '. ' ||
                    case when resultado like 'OK%' then '[OK]     ' else '[FALHOU] ' end ||
                    teste || ' -> ' || resultado, E'\n' order by n)
  into relatorio from _res;
  raise exception E'FIM DOS TESTES — nada foi gravado (este erro desfaz a transação).\n%', relatorio;
end $$;
