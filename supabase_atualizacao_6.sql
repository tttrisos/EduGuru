-- ============================================================
-- EduGuru — Atualização 6: exclusão AUTOMÁTICA de logs (pg_cron)
-- Rodar no SQL Editor do Supabase, DEPOIS da atualização 5.
-- Pode ser rodado mais de uma vez (idempotente).
--
-- ANTES DE RODAR: habilite a extensão "pg_cron" no painel do Supabase
-- (Database → Extensions → pg_cron → Enable). Este script NÃO tem
-- "create extension pg_cron": quando a extensão já está habilitada, esse
-- comando dispara de novo o script interno de permissões do Supabase,
-- que falha com "dependent privileges exist". Se o pg_cron não estiver
-- habilitado, o script para no primeiro uso de "cron." com erro de
-- schema inexistente — aí é só habilitar no painel e rodar de novo.
--
-- Por quê: a Política de Privacidade promete reter logs por 90 dias.
-- Até aqui isso dependia de um admin clicar no botão de limpeza; agora
-- o próprio banco apaga sozinho, todo dia.
-- ============================================================


-- ------------------------------------------------------------
-- 1) Função usada SÓ pelo agendador
-- ------------------------------------------------------------
-- Separada de limpar_logs_antigos() (a do botão do admin) porque o
-- agendador roda sem usuário logado — então aqui não há checagem de
-- admin. Para ninguém conseguir chamar isso pela API do site, o
-- "execute" é retirado de public/anon/authenticated logo abaixo.
-- O prazo é fixo em 90 dias (não recebe parâmetro).
create or replace function public.limpar_logs_automatico()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  qtd_removida integer;
begin
  delete from public.logs_auditoria
  where criado_em < now() - interval '90 days';

  get diagnostics qtd_removida = row_count;

  -- Registra a própria limpeza (sem usuário: quem executou foi o sistema).
  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (null, null, 'limpeza_automatica', 'logs_auditoria', null,
          jsonb_build_object('removidos', qtd_removida, 'prazo_dias', 90));

  return qtd_removida;
end;
$$;

revoke execute on function public.limpar_logs_automatico() from public, anon, authenticated;


-- ------------------------------------------------------------
-- 2) Agendamento diário
-- ------------------------------------------------------------
-- O pg_cron do Supabase usa horário UTC: 06:00 UTC = 03:00 de Brasília.
-- Remove agendamentos anteriores com o mesmo nome (e o mensal que estava
-- só comentado na atualização 2, caso alguém tenha criado) antes de criar.
select cron.unschedule(jobid)
from cron.job
where jobname in ('limpeza-logs-diaria', 'limpeza-logs-mensal');

select cron.schedule(
  'limpeza-logs-diaria',
  '0 6 * * *',
  $$select public.limpar_logs_automatico();$$
);


-- ------------------------------------------------------------
-- Como conferir
-- ------------------------------------------------------------
-- Agendamento criado:
--   select jobid, jobname, schedule, command from cron.job;
-- Últimas execuções:
--   select status, start_time, return_message
--   from cron.job_run_details order by start_time desc limit 5;
-- Rodar uma vez na mão (pelo SQL Editor, que roda como dono do banco):
--   select public.limpar_logs_automatico();
