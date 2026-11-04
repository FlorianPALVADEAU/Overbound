-- Changement de capitaine d'un groupe, en une seule transaction.
-- Remplace trois écritures séquentielles côté application (rétrogradation, promotion, update groups)
-- dont aucune erreur n'était vérifiée : un échec à mi-parcours laissait deux capitaines, ou aucun.
--
-- Erreurs :
--   GROUP_NOT_FOUND     (P0002) : groupe absent ou hors de l'organisation de l'appelant.
--   CAPTAIN_NOT_MEMBER  (23514) : le futur capitaine n'est pas membre du groupe.
--
-- security invoker : appelée avec service_role ; EXECUTE retiré à public, anon, authenticated.

create or replace function public.admin_set_group_captain(
  p_group_id uuid,
  p_captain_id uuid,
  p_organization_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
#variable_conflict use_column
declare
  v_org uuid;
begin
  select g.organization_id into v_org
  from public.groups g
  where g.id = p_group_id
  for update;

  if not found or v_org is distinct from p_organization_id then
    raise exception 'GROUP_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.profile_id = p_captain_id
  ) then
    raise exception 'CAPTAIN_NOT_MEMBER' using errcode = '23514';
  end if;

  update public.group_members
  set role = 'member'
  where group_id = p_group_id and role = 'captain' and profile_id <> p_captain_id;

  update public.group_members
  set role = 'captain'
  where group_id = p_group_id and profile_id = p_captain_id;

  update public.groups
  set captain_id = p_captain_id, updated_at = now()
  where id = p_group_id;
end;
$$;

revoke all on function public.admin_set_group_captain(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_group_captain(uuid, uuid, uuid) to service_role;
