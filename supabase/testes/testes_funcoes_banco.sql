-- ============================================================
-- EduGuru — testes das funções e regras de acesso do banco
--   Roda no SQL Editor do Supabase (Run). Cria usuários de teste, simula o login de cada um
--   (aluno, outro aluno, administrador) e confere as regras que ficam no banco: RLS, quiz,
--   filtro de materiais, Bússola, log, aceite, exclusão de contas e limpeza de logs.
--   No fim, TUDO é desfeito (nada fica gravado) e aparece a tabela "teste / passou / detalhe".
--   Usa só dados inventados. Pode ser rodado quantas vezes quiser.
-- Evidência: salvar o resultado em docs/evidencias/ (ver docs/evidencias/README.md).
-- ============================================================

drop table if exists pg_temp.resultado_testes;
create temp table resultado_testes (ordem serial, teste text, passou boolean, detalhe text);

do $$
declare
  v_aluno  uuid := gen_random_uuid();
  v_aluno2 uuid := gen_random_uuid();
  v_admin  uuid := gen_random_uuid();
  v_admin2 uuid := gen_random_uuid();
  v_claims_aluno text;
  v_claims_aluno2 text;
  v_claims_admin text;
  r text[] := '{}';          -- cada item: teste§passou§detalhe (sobrevive ao "desfazer" do fim)
  v_disc bigint;
  v_tent bigint;
  v_pergs bigint[] := '{}';
  v_linha record;
  v_int integer;
  v_int2 integer;
  v_txt text;
  v_txt2 text;
  v_json jsonb;
  v_dica text[];
  v_respostas jsonb;
begin
  begin
    -- ---------- Preparação (como postgres) ----------
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, 'teste',
           now(), '{"provider":"email","providers":["email"]}'::jsonb,
           jsonb_build_object('nome', u.nome, 'curso', 'SI', 'consentimento_aceito', true, 'versao_termos', '2.1'),
           now(), now()
    from (values (v_aluno, 'teste.aluno@eduguru.invalid', 'Aluno Teste'),
                 (v_aluno2, 'teste.aluno2@eduguru.invalid', 'Aluna Teste Dois'),
                 (v_admin, 'teste.admin@eduguru.invalid', 'Admin Teste'),
                 (v_admin2, 'teste.admin2@eduguru.invalid', 'Admin Teste Dois')) as u(id, email, nome);
    update public.perfis set papel = 'admin' where id in (v_admin, v_admin2);

    insert into public.filtro_sites (dominio) values ('site-permitido-teste.dev') on conflict do nothing;

    select p.disciplina_id into v_disc
    from public.perguntas p join public.gabaritos g on g.pergunta_id = p.id
    where p.disciplina_id is not null and p.alternativa_a is not null
    group by p.disciplina_id having count(*) >= 2
    limit 1;

    -- Sessão completa de cada um (aluno: senha + código do e-mail; admin: senha + aplicativo).
    v_claims_aluno := json_build_object('sub', v_aluno, 'role', 'authenticated', 'aal', 'aal1',
                                        'amr', json_build_array(json_build_object('method', 'otp')))::text;
    v_claims_aluno2 := json_build_object('sub', v_aluno2, 'role', 'authenticated', 'aal', 'aal1',
                                         'amr', json_build_array(json_build_object('method', 'otp')))::text;
    v_claims_admin := json_build_object('sub', v_admin, 'role', 'authenticated', 'aal', 'aal2')::text;

    -- ---------- Como ALUNO ----------
    perform set_config('request.jwt.claims', v_claims_aluno, true);
    perform set_config('role', 'authenticated', true);

    select count(*) into v_int from public.perfis where id = v_aluno;
    select count(*) into v_int2 from public.perfis where id = v_aluno2;
    r := r || format('01. RLS: aluno lê o próprio perfil e não lê o de outro aluno§%s§próprio=%s, outro=%s',
                     v_int = 1 and v_int2 = 0, v_int, v_int2);

    begin
      update public.perfis set papel = 'admin' where id = v_aluno;
      r := r || '02. Aluno não consegue mudar o próprio papel para administrador§false§o update foi aceito'::text;
    exception when others then
      r := r || format('02. Aluno não consegue mudar o próprio papel para administrador§true§%s', sqlerrm);
    end;

    begin
      select count(*) into v_int from public.gabaritos;
      r := r || format('03. RLS: aluno não lê a tabela de gabaritos§%s§linhas visíveis=%s', v_int = 0, v_int);
    exception when insufficient_privilege then
      r := r || format('03. RLS: aluno não lê a tabela de gabaritos§true§%s', sqlerrm);
    end;

    begin
      select count(*) into v_int from public.logs_auditoria where usuario_id is distinct from v_aluno;
      r := r || format('04. RLS: aluno não lê logs de outras pessoas§%s§linhas visíveis=%s', v_int = 0, v_int);
    exception when insufficient_privilege then
      r := r || format('04. RLS: aluno não lê logs de outras pessoas§true§%s', sqlerrm);
    end;

    begin
    if v_disc is null then
      r := r || '05. Quiz: iniciar_quiz sorteia perguntas sem o gabarito§false§nenhuma disciplina com 2 perguntas'::text;
    else
      for v_linha in select * from public.iniciar_quiz(v_disc) loop
        v_tent := v_linha.tentativa_id;
        v_pergs := v_pergs || v_linha.pergunta_id;
      end loop;
      r := r || format('05. Quiz: iniciar_quiz sorteia perguntas sem o gabarito§%s§%s perguntas na rodada %s',
                       coalesce(array_length(v_pergs, 1), 0) >= 2, coalesce(array_length(v_pergs, 1), 0), v_tent);

      select * into v_linha from public.responder_pergunta(v_tent, v_pergs[1], 'A');
      r := r || format('06. Quiz: responder_pergunta corrige no banco e só então devolve o gabarito§%s§gabarito=%s, acertou=%s, pontos=%s',
                       v_linha.gabarito in ('A', 'B', 'C', 'D') and (v_linha.acertou = (v_linha.pontos > 0)),
                       v_linha.gabarito, v_linha.acertou, v_linha.pontos);

      begin
        perform * from public.responder_pergunta(v_tent, v_pergs[1], 'B');
        r := r || '07. Quiz: a mesma pergunta não pode ser respondida de novo§false§a segunda resposta foi aceita'::text;
      exception when others then
        r := r || format('07. Quiz: a mesma pergunta não pode ser respondida de novo§%s§%s', sqlerrm like '%já foi respondida%', sqlerrm);
      end;

      v_dica := public.pedir_dica(v_tent, v_pergs[2]);
      begin
        perform public.pedir_dica(v_tent, v_pergs[2]);
        r := r || format('08. Quiz: dica 50/50 risca 2 alternativas e só vale uma vez por rodada§false§dica=%s; a segunda foi aceita', v_dica);
      exception when others then
        r := r || format('08. Quiz: dica 50/50 risca 2 alternativas e só vale uma vez por rodada§%s§dica=%s; 2ª: %s',
                         array_length(v_dica, 1) = 2, v_dica, sqlerrm);
      end;

      begin
        update public.tentativas_quiz set pontos = 9999 where id = v_tent;
        get diagnostics v_int = row_count;
        r := r || format('09. Aluno não altera os próprios pontos direto na tabela§%s§linhas alteradas=%s', v_int = 0, v_int);
      exception when others then
        r := r || format('09. Aluno não altera os próprios pontos direto na tabela§true§%s', sqlerrm);
      end;
    end if;
    exception when others then
      r := r || format('05-09. Quiz: erro inesperado§false§%s', sqlerrm);
    end;

    begin
    v_json := public.verificar_material('Meu CPF é 123.456.789-09', null, null, null);
    r := r || format('10. Filtro: material com CPF é recusado (verificar_material)§%s§motivo=%s',
                     v_json->>'motivo' is not null, v_json->>'motivo');

    v_json := public.verificar_material('Resumo de banco de dados', null, 'https://site-desconhecido-teste.dev/aula', null);
    r := r || format('11. Filtro: link de site fora da lista é marcado como site novo§%s§%s',
                     (v_json->>'site_novo')::boolean and v_json->>'motivo' is null, v_json);

    insert into public.materiais (titulo, link, disciplina_id)
    values ('Material de teste com site novo', 'https://site-desconhecido-teste.dev/aula', v_disc)
    returning status into v_txt;
    insert into public.materiais (titulo, link, disciplina_id)
    values ('Material de teste de site permitido', 'https://site-permitido-teste.dev/aula', v_disc)
    returning status into v_txt2;
    r := r || format('12. Materiais: site novo vai para análise e site permitido é publicado§%s§site novo=%s, permitido=%s',
                     v_txt = 'pendente' and v_txt2 = 'aprovado', v_txt, v_txt2);
    exception when others then
      r := r || format('10-12. Filtro de materiais: erro inesperado§false§%s', sqlerrm);
    end;

    begin
      insert into public.materiais (titulo, link, disciplina_id)
      values ('Ligue no telefone (11) 98765-4321', 'https://site-permitido-teste.dev/x', v_disc);
      r := r || '13. Materiais: o gatilho do banco recusa dados pessoais mesmo vindo direto pela API§false§o insert foi aceito'::text;
    exception when others then
      r := r || format('13. Materiais: o gatilho do banco recusa dados pessoais mesmo vindo direto pela API§%s§%s',
                       sqlerrm like '%dados pessoais%', sqlerrm);
    end;

    begin
      insert into public.materiais (titulo, link, disciplina_id, enviado_por)
      values ('Material em nome de outra pessoa', 'https://site-permitido-teste.dev/y', v_disc, v_aluno2);
      r := r || '13b. Materiais: aluno não grava material em nome de outra pessoa§false§o insert foi aceito'::text;
    exception when others then
      r := r || format('13b. Materiais: aluno não grava material em nome de outra pessoa§true§%s', sqlerrm);
    end;

    begin
      perform * from public.salvar_bussola('{}'::jsonb);
      r := r || '14. Bússola: respostas incompletas são recusadas§false§foi aceita'::text;
    exception when others then
      r := r || format('14. Bússola: respostas incompletas são recusadas§%s§%s', sqlerrm like '%Responda todas%', sqlerrm);
    end;

    begin
    select jsonb_object_agg(f.id::text, 3) into v_respostas from public.bussola_afirmacoes f where f.ativa;
    if v_respostas is null then
      r := r || '15. Bússola: o banco calcula a afinidade (tudo 3 = 50%)§false§nenhuma afirmação ativa'::text;
    else
      select count(*) filter (where afinidade = 50), count(*) into v_int, v_int2 from public.salvar_bussola(v_respostas);
      r := r || format('15. Bússola: o banco calcula a afinidade (tudo 3 = 50%%)§%s§%s de %s áreas com 50%%',
                       v_int2 > 0 and v_int = v_int2, v_int, v_int2);
    end if;
    exception when others then
      r := r || format('15. Bússola: o banco calcula a afinidade (tudo 3 = 50%%)§false§%s', sqlerrm);
    end;

    begin
      perform public.registrar_evento_auth('evento_inventado', null);
      r := r || '16. Log: o navegador não consegue gravar um evento inventado§false§foi aceito'::text;
    exception when others then
      r := r || format('16. Log: o navegador não consegue gravar um evento inventado§%s§%s', sqlerrm like '%não permitido%', sqlerrm);
    end;

    begin
    perform public.registrar_evento_auth('dados_exportados', null);
    select count(*) into v_int from public.logs_auditoria where usuario_id = v_aluno and acao = 'dados_exportados';
    r := r || format('17. Log: "Baixar meus dados" fica registrado (script 33)§%s§registros=%s', v_int = 1, v_int);
    exception when others then
      r := r || format('17. Log: "Baixar meus dados" fica registrado (script 33)§false§%s', sqlerrm);
    end;

    begin
      perform public.registrar_aceite('versao-errada');
      r := r || '18. Aceite: versão dos termos fora do formato é recusada§false§foi aceita'::text;
    exception when others then
      r := r || format('18. Aceite: versão dos termos fora do formato é recusada§true§%s', sqlerrm);
    end;

    begin
      perform public.excluir_conta_usuario(v_aluno2);
      r := r || '19. Aluno não exclui a conta de outra pessoa§false§a exclusão foi aceita'::text;
    exception when others then
      r := r || format('19. Aluno não exclui a conta de outra pessoa§%s§%s', sqlerrm like '%administradores%', sqlerrm);
    end;

    begin
      perform public.limpar_logs_antigos();
      r := r || '20. Aluno não limpa os logs§false§foi aceito'::text;
    exception when others then
      r := r || format('20. Aluno não limpa os logs§true§%s', sqlerrm);
    end;

    -- Sessão encerrada em outro aparelho ("Sair dos outros aparelhos"): o banco recusa (script 26).
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_aluno, 'role', 'authenticated', 'aal', 'aal1', 'session_id', gen_random_uuid(),
                        'amr', json_build_array(json_build_object('method', 'otp')))::text, true);
    begin
    select count(*) into v_int from public.perfis where id = v_aluno;
    r := r || format('21. Sessão encerrada em outro aparelho não lê mais nada§%s§linhas do próprio perfil=%s', v_int = 0, v_int);
    exception when others then
      r := r || format('21. Sessão encerrada em outro aparelho não lê mais nada§true§%s', sqlerrm);
    end;

    -- Aparelho novo sem o código do e-mail (só se a proteção estiver ligada).
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_aluno, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    if public.codigo_email_ligado() then
      select count(*) into v_int from public.perfis where id = v_aluno;
      r := r || format('22. Aparelho novo sem o código do e-mail não lê os dados§%s§linhas do próprio perfil=%s', v_int = 0, v_int);
    else
      r := r || '22. Aparelho novo sem o código do e-mail não lê os dados§true§não se aplica: proteção desligada em config_seguranca'::text;
    end if;

    -- ---------- Como ADMINISTRADOR ----------
    execute 'reset role';
    insert into public.logs_auditoria (usuario_id, usuario_email, acao, detalhes, criado_em)
    values (null, 'teste.antigo@eduguru.invalid', 'login', '{"teste":"100 dias"}', now() - interval '100 days'),
           (null, 'teste.recente@eduguru.invalid', 'login', '{"teste":"10 dias"}', now() - interval '10 days');

    perform set_config('request.jwt.claims', v_claims_admin, true);
    perform set_config('role', 'authenticated', true);

    begin
    select count(*) into v_int from public.gabaritos;
    r := r || format('23. Administrador lê os gabaritos (para editar as perguntas)§%s§linhas visíveis=%s', v_int > 0, v_int);
    exception when others then
      r := r || format('23. Administrador lê os gabaritos (para editar as perguntas)§false§%s', sqlerrm);
    end;

    begin
      perform public.excluir_conta_usuario(v_admin2);
      r := r || '24. Conta de administrador é protegida contra exclusão§false§a exclusão foi aceita'::text;
    exception when others then
      r := r || format('24. Conta de administrador é protegida contra exclusão§%s§%s', sqlerrm like '%administrador%', sqlerrm);
    end;

    begin
    perform public.limpar_logs_antigos();
    select count(*) filter (where usuario_email = 'teste.antigo@eduguru.invalid'),
           count(*) filter (where usuario_email = 'teste.recente@eduguru.invalid')
      into v_int, v_int2 from public.logs_auditoria;
    r := r || format('25. Limpeza manual só apaga logs com mais de 90 dias§%s§100 dias=%s, 10 dias=%s', v_int = 0 and v_int2 = 1, v_int, v_int2);
    exception when others then
      r := r || format('25. Limpeza manual só apaga logs com mais de 90 dias§false§%s', sqlerrm);
    end;

    perform public.excluir_conta_usuario(v_aluno2);
    execute 'reset role';
    select count(*) into v_int from public.perfis where id = v_aluno2;
    select count(*) into v_int2 from auth.users where id = v_aluno2;
    r := r || format('26. Administrador exclui a conta de um aluno (perfil e acesso)§%s§perfil=%s, conta=%s', v_int = 0 and v_int2 = 0, v_int, v_int2);

    raise exception 'FIM_DOS_TESTES';
  exception when others then
    if sqlerrm <> 'FIM_DOS_TESTES' then
      r := r || format('ERRO INESPERADO (os testes pararam aqui)§false§%s', sqlerrm);
    end if;
  end;

  -- Tudo o que os testes gravaram foi desfeito acima; só os resultados continuam.
  insert into resultado_testes (teste, passou, detalhe)
  select split_part(x, '§', 1), split_part(x, '§', 2)::boolean, split_part(x, '§', 3) from unnest(r) as x;
end $$;

select teste, case when passou then 'PASSOU' else 'FALHOU' end as resultado, detalhe
from resultado_testes order by ordem;
