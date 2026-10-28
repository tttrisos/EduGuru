-- ============================================================
-- EduGuru — Testes automáticos da Fase A (atualizações 4 a 7)
--
-- Como usar: cole tudo no SQL Editor do Supabase e clique em Run,
-- DEPOIS de rodar os supabase_atualizacao_4.sql a _10.sql.
--
-- NADA FICA GRAVADO: o script cria 3 usuários fictícios, roda os testes
-- simulando cada um (como se fosse o site chamando a API) e, no final,
-- de propósito, termina com um ERRO que mostra o relatório. Esse erro
-- desfaz a transação inteira — usuários, logs e materiais de teste somem.
--
-- Leia a mensagem do erro final: cada linha deve começar com "OK".
-- Qualquer linha "FALHOU" indica regra que não está funcionando.
-- ============================================================

begin;

create temp table _res (n serial, teste text, resultado text);

-- Usuários fictícios (o gatilho de cadastro cria os perfis sozinho).
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'aluno.a@teste.eduguru',
   '{"nome":"Aluno A","curso":"SI","cidade":"Mogi das Cruzes","estado":"SP","consentimento_aceito":true,"versao_termos":"1.1"}',
   'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b2', 'aluno.b@teste.eduguru',
   '{"nome":"Aluno B","curso":"ADS","consentimento_aceito":true,"versao_termos":"1.1"}',
   'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c3', 'admin.c@teste.eduguru',
   '{"nome":"Admin C","curso":"ES","consentimento_aceito":true,"versao_termos":"1.1"}',
   'authenticated', 'authenticated');

update public.perfis set papel = 'admin' where id = '00000000-0000-0000-0000-0000000000c3';


-- ---------- Cadastro ----------
insert into _res (teste, resultado)
select 'Cadastro grava cidade/estado e aceite (data + versão)',
  case when cidade = 'Mogi das Cruzes' and estado = 'SP' and consentimento_aceito
            and consentimento_em is not null and versao_termos = '1.1'
       then 'OK' else 'FALHOU' end
from public.perfis where id = '00000000-0000-0000-0000-0000000000a1';

insert into _res (teste, resultado)
select 'Cadastro gera log de auditoria',
  case when count(*) = 1 then 'OK' else 'FALHOU' end
from public.logs_auditoria
where tabela = 'perfis' and acao = 'criar'
  and registro_id = '00000000-0000-0000-0000-0000000000a1';


-- ---------- Perfis ----------
do $$
declare r text; qtd integer;
begin
  -- Aluno A, sessão COM MFA (aal2), tenta virar admin.
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    update public.perfis set papel = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
    r := 'FALHOU: aluno conseguiu alterar o próprio papel';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO altera o próprio papel', r);
end $$;

do $$
declare r text; qtd integer;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    update public.perfis set cidade = 'Suzano' where id = '00000000-0000-0000-0000-0000000000a1';
    get diagnostics qtd = row_count;
    r := case when qtd = 1 then 'OK' else 'FALHOU: nenhuma linha alterada' end;
  exception when others then
    r := 'FALHOU: ' || sqlerrm;
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno corrige a própria cidade', r);
end $$;

insert into _res (teste, resultado)
select 'Log de edição do perfil guarda só o nome do campo, não o valor',
  case when bool_and(detalhes = '{"campos_alterados": ["cidade"]}'::jsonb) and count(*) = 1
       then 'OK' else 'FALHOU' end
from public.logs_auditoria
where tabela = 'perfis' and acao = 'editar'
  and registro_id = '00000000-0000-0000-0000-0000000000a1';

do $$
declare r text; qtd integer;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  select count(*) into qtd from public.perfis;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno (aal2) lê só o próprio perfil',
    case when qtd = 1 then 'OK' else 'FALHOU: leu ' || qtd || ' perfis' end);
end $$;

do $$
declare r text; qtd integer;
begin
  -- Mesma pessoa, mas só com senha (aal1): não pode ler nada.
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
  execute 'set local role authenticated';
  select count(*) into qtd from public.perfis;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Sessão sem MFA (aal1) não lê perfis',
    case when qtd = 0 then 'OK' else 'FALHOU: leu ' || qtd || ' perfis' end);
end $$;

do $$
declare r text; qtd integer;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
  execute 'set local role authenticated';
  select count(*) into qtd from public.disciplinas;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Sessão sem MFA (aal1) não lê disciplinas',
    case when qtd = 0 then 'OK' else 'FALHOU: leu ' || qtd || ' disciplinas' end);
end $$;


-- ---------- Logs ----------
do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    insert into public.logs_auditoria (usuario_id, acao) values ('00000000-0000-0000-0000-0000000000a1', 'excluir');
    r := 'FALHOU: front conseguiu inserir log direto';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Front NÃO insere log direto na tabela', r);
end $$;

do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    perform public.registrar_evento_auth('excluir', null);
    r := 'FALHOU: aceitou evento fora da lista';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('registrar_evento_auth recusa ação fora da lista', r);
end $$;

do $$
declare r1 text; r2 text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
  execute 'set local role authenticated';
  begin
    perform public.registrar_evento_auth('login', null);
    r1 := 'FALHOU: aceitou login sem MFA';
  exception when others then
    r1 := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  begin
    perform public.registrar_evento_auth('mfa_falhou', '{"etapa":"verificar"}');
    r2 := 'OK';
  exception when others then
    r2 := 'FALHOU: ' || sqlerrm;
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Log "login" exige aal2', r1);
  insert into _res (teste, resultado) values ('Log "mfa_falhou" aceito em aal1', r2);
end $$;

do $$
declare i integer; qtd integer; r text;
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  -- Desde a atualização 10, só e-mails com conta geram log.
  for i in 1..25 loop
    perform public.registrar_login_falhou('aluno.a@teste.eduguru');
  end loop;
  perform public.registrar_login_falhou('nao.existe@teste.eduguru');
  begin
    insert into public.logs_auditoria (acao) values ('login_falhou');
    r := 'FALHOU: anônimo inseriu log direto';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  select count(*) into qtd from public.logs_auditoria
  where usuario_email = 'aluno.a@teste.eduguru' and acao = 'login_falhou';
  insert into _res (teste, resultado) values ('login_falhou limitado a 20 por e-mail/10 min',
    case when qtd = 20 then 'OK' else 'FALHOU: gravou ' || qtd end);
  select count(*) into qtd from public.logs_auditoria where usuario_email = 'nao.existe@teste.eduguru';
  insert into _res (teste, resultado) values ('login_falhou NÃO grava e-mail sem conta',
    case when qtd = 0 then 'OK' else 'FALHOU: gravou ' || qtd end);
  insert into _res (teste, resultado) values ('Anônimo NÃO insere log direto', r);
end $$;

do $$
declare r text; qtd integer;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  select count(*) into qtd from public.logs_auditoria
  where usuario_id is distinct from '00000000-0000-0000-0000-0000000000a1';
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno lê só os próprios logs',
    case when qtd = 0 then 'OK' else 'FALHOU: leu ' || qtd || ' logs de outros' end);
end $$;


-- ---------- Limpeza de logs ----------
do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    perform public.limpar_logs_antigos();
    r := 'FALHOU: aluno limpou logs';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO limpa logs', r);
end $$;

do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    -- Desde a atualização 10 a função não recebe prazo (90 dias fixos).
    execute 'select public.limpar_logs_antigos(30)';
    r := 'FALHOU: aceitou prazo escolhido pelo admin';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Admin NÃO escolhe o prazo da limpeza (fixo em 90 dias)', r);
end $$;

do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated","aal":"aal1"}', true);
  execute 'set local role authenticated';
  begin
    perform public.limpar_logs_antigos();
    r := 'FALHOU: admin sem MFA limpou logs';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Admin sem MFA (aal1) NÃO limpa logs', r);
end $$;

do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    perform public.limpar_logs_automatico();
    r := 'FALHOU: função do agendador chamável pela API';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('limpar_logs_automatico NÃO é chamável pela API', r);
end $$;

insert into _res (teste, resultado)
select 'Agendamento diário do pg_cron existe',
  case when count(*) = 1 then 'OK (' || max(schedule) || ' UTC)' else 'FALHOU: job não encontrado' end
from cron.job where jobname = 'limpeza-logs-diaria';


-- ---------- Materiais ----------
do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    insert into public.materiais (titulo, link) values ('Material de teste do A', 'https://exemplo.com');
    r := 'OK';
  exception when others then
    r := 'FALHOU: ' || sqlerrm;
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno envia material (dono preenchido sozinho)', r);
end $$;

insert into _res (teste, resultado)
select 'Material guarda quem enviou',
  case when count(*) = 1 then 'OK' else 'FALHOU' end
from public.materiais
where titulo = 'Material de teste do A' and enviado_por = '00000000-0000-0000-0000-0000000000a1';

do $$
declare r1 text; r2 text; qtd integer;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  delete from public.materiais where titulo = 'Material de teste do A';
  get diagnostics qtd = row_count;
  r1 := case when qtd = 0 then 'OK' else 'FALHOU: B apagou material do A' end;
  begin
    insert into public.materiais (titulo, link, enviado_por)
    values ('Falso', 'https://x', '00000000-0000-0000-0000-0000000000a1');
    r2 := 'FALHOU: B criou material em nome do A';
  exception when others then
    r2 := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO apaga material de outro', r1);
  insert into _res (teste, resultado) values ('Aluno NÃO cria material em nome de outro', r2);
end $$;


-- ---------- Exclusão de conta ----------
do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    perform public.excluir_conta_usuario('00000000-0000-0000-0000-0000000000a1');
    r := 'FALHOU: aluno excluiu conta de outro';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Aluno NÃO exclui conta de outro', r);
end $$;

do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
  execute 'set local role authenticated';
  begin
    perform public.excluir_minha_conta();
    r := 'FALHOU: excluiu conta sem MFA';
  exception when others then
    r := 'OK (bloqueado: ' || sqlerrm || ')';
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Exclusão da própria conta exige MFA', r);
end $$;

do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    perform public.excluir_minha_conta();
    r := 'OK';
  exception when others then
    r := 'FALHOU: ' || sqlerrm;
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Titular exclui a própria conta', r);
end $$;

insert into _res (teste, resultado)
select 'Exclusão apaga conta, perfil e materiais do titular',
  case when not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000a1')
        and not exists (select 1 from public.perfis where id = '00000000-0000-0000-0000-0000000000a1')
        and not exists (select 1 from public.materiais where titulo = 'Material de teste do A')
       then 'OK' else 'FALHOU' end;

insert into _res (teste, resultado)
select 'Log "conta_excluida" fica (sem usuario_id, com e-mail) até os 90 dias',
  case when count(*) = 1 then 'OK' else 'FALHOU' end
from public.logs_auditoria
where acao = 'conta_excluida' and usuario_id is null and usuario_email = 'aluno.a@teste.eduguru';

do $$
declare r text;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated","aal":"aal2"}', true);
  execute 'set local role authenticated';
  begin
    perform public.excluir_conta_usuario('00000000-0000-0000-0000-0000000000b2');
    r := 'OK';
  exception when others then
    r := 'FALHOU: ' || sqlerrm;
  end;
  execute 'reset role';
  insert into _res (teste, resultado) values ('Admin exclui conta de outro usuário', r);
end $$;

insert into _res (teste, resultado)
select 'Conta excluída pelo admin some de auth.users e perfis',
  case when not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000b2')
        and not exists (select 1 from public.perfis where id = '00000000-0000-0000-0000-0000000000b2')
       then 'OK' else 'FALHOU' end;


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
