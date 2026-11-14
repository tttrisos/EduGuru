-- ============================================================
-- EduGuru — 20: administrador não pode excluir a conta de outro administrador
--
-- Antes: excluir_conta_usuario (script 07) só impedia o admin de excluir a si mesmo.
-- Agora: se a conta alvo for de um administrador, o banco recusa.
-- A tela Usuarios.tsx também esconde o botão para contas de admin, mas a regra
-- que vale é esta (mesmo chamando a API direto, a exclusão é recusada).
-- Rodar depois do 19. Pode ser rodado de novo.
-- ============================================================

create or replace function public.excluir_conta_usuario(alvo uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  qtd_materiais integer;
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem excluir contas de outros usuários.';
  end if;

  if alvo = auth.uid() then
    raise exception 'Para excluir a sua própria conta, use a tela Minha conta.';
  end if;

  if not exists (select 1 from auth.users where id = alvo) then
    raise exception 'Usuário não encontrado.';
  end if;

  -- NOVO: conta de administrador é protegida.
  if exists (select 1 from public.perfis where id = alvo and papel = 'admin') then
    raise exception 'Contas de administrador não podem ser excluídas.';
  end if;

  delete from public.materiais where enviado_por = alvo;
  get diagnostics qtd_materiais = row_count;

  insert into public.logs_auditoria (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    'conta_excluida', 'perfis', alvo::text,
    jsonb_build_object(
      'por', 'admin',
      'alvo_email', (select email from auth.users where id = alvo),
      'materiais_removidos', qtd_materiais
    )
  );

  delete from auth.users where id = alvo;
end;
$$;

revoke execute on function public.excluir_conta_usuario(uuid) from public, anon;
grant execute on function public.excluir_conta_usuario(uuid) to authenticated;
