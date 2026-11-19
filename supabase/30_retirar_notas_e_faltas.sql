-- ============================================================
-- EduGuru — 30: retira NOTAS E FALTAS do sistema (antigo RF20)
--   A tela Notas e faltas saiu do site. Para não guardar dado pessoal sem uso
--   (LGPD, art. 6º, III — necessidade; art. 16 — eliminação ao fim do
--   tratamento), este script APAGA a tabela public.notas com todos os registros,
--   os gatilhos dela e as duas funções que só ela usava.
--   Os registros de auditoria antigos da tabela "notas" (que nunca guardaram os
--   valores) continuam até completar 90 dias e saem pela limpeza diária (script 06).
--   Termo e Política foram para a versão 1.8 (o site pede novo aceite).
-- ATENÇÃO: apaga os dados de vez. Rodar depois do 29. Pode ser rodado de novo.
-- ============================================================


-- 1) A tabela, com as políticas de RLS e os gatilhos (log_notas e notas_atualizado_em)
drop table if exists public.notas cascade;


-- 2) Funções que só os gatilhos da tabela notas usavam (script 12)
drop function if exists public.registrar_log_sem_valores();
drop function if exists public.tocar_atualizado_em();


-- Conferência: deve voltar "notas apagada"
select case
  when to_regclass('public.notas') is null then 'notas apagada'
  else 'notas ainda existe'
end as situacao;
