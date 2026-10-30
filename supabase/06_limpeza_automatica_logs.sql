-- ============================================================
-- EduGuru — 06: exclusão automática dos logs com mais de 90 dias
-- Antes: habilitar a extensão pg_cron em Database → Extensions.
-- ============================================================


-- 1) Limpeza usada só pelo agendador (não pode ser chamada pelo site)
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

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (null, null, 'limpeza_automatica', 'logs_auditoria', null,
          jsonb_build_object('removidos', qtd_removida, 'prazo_dias', 90));

  return qtd_removida;
end;
$$;

revoke execute on function public.limpar_logs_automatico() from public, anon, authenticated;


-- 2) Agendamento diário às 06:00 UTC (03:00 de Brasília)
select cron.unschedule(jobid)
from cron.job
where jobname = 'limpeza-logs-diaria';

select cron.schedule(
  'limpeza-logs-diaria',
  '0 6 * * *',
  $$select public.limpar_logs_automatico();$$
);
