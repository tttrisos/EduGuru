-- ============================================================
-- EduGuru — 33: "Baixar meus dados" fica registrado no log
--   O guia de LGPD da disciplina pede que as exportações de dados e o atendimento
--   dos direitos do titular fiquem registrados. Até aqui, o arquivo de Minha conta
--   era gerado no navegador sem deixar rastro. Agora o site grava 'dados_exportados'
--   (só quem e quando; o conteúdo do arquivo nunca vai para o log).
--   Mesma função dos scripts 10, 21, 23 e 24, só com o evento novo na lista.
-- Rodar depois do 32. Pode ser rodado de novo.
-- ============================================================


create or replace function public.registrar_evento_auth(acao text, detalhes jsonb default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sessão não encontrada.';
  end if;

  -- Lista fechada: o navegador só consegue gravar estes eventos (não inventa outros).
  if acao not in ('login', 'logout', 'mfa_ativado', 'mfa_desativado', 'mfa_falhou', 'mfa_bloqueado',
                  'senha_redefinida', 'senha_alterada', 'sessoes_encerradas', 'dados_exportados') then
    raise exception 'Evento de log não permitido: %', acao;
  end if;

  -- Eventos que só fazem sentido com o login completo (senha + código, quando a conta exige).
  if acao in ('login', 'mfa_ativado', 'mfa_desativado', 'senha_alterada', 'sessoes_encerradas', 'dados_exportados')
     and not public.sessao_mfa_ok() then
    raise exception 'Evento % exige a verificação em duas etapas concluída.', acao;
  end if;

  -- Detalhes vêm do navegador: só aceita um objeto pequeno (ex.: {"mfa":"nao","aparelho":"Chrome no Windows"}).
  if detalhes is not null and (jsonb_typeof(detalhes) <> 'object' or length(detalhes::text) > 300) then
    raise exception 'Detalhes do log inválidos.';
  end if;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    acao, null, null, detalhes
  );
end;
$$;

revoke execute on function public.registrar_evento_auth(text, jsonb) from public, anon;
grant execute on function public.registrar_evento_auth(text, jsonb) to authenticated;


-- Conferência: deve voltar true (a função aceita o evento novo)
select pg_get_functiondef('public.registrar_evento_auth(text, jsonb)'::regprocedure) like '%dados_exportados%'
  as aceita_dados_exportados;
