-- Remplacement des obstacles d'une course, en une seule transaction.
-- Avant : DELETE puis INSERT côté application, erreurs journalisées mais jamais remontées.
-- Un INSERT en échec laissait la course sans obstacle et répondait 200.
--
-- Erreur : RACE_NOT_FOUND (P0002) si la course n'existe pas.
-- Ordre : order_position = rang dans p_obstacle_ids (1 pour le premier), is_mandatory = true.

create or replace function public.admin_set_race_obstacles(
  p_race_id uuid,
  p_obstacle_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
#variable_conflict use_column
begin
  if not exists (select 1 from public.races r where r.id = p_race_id for update) then
    raise exception 'RACE_NOT_FOUND' using errcode = 'P0002';
  end if;

  delete from public.race_obstacles where race_id = p_race_id;

  insert into public.race_obstacles (race_id, obstacle_id, order_position, is_mandatory)
  select p_race_id, selected.obstacle_id, selected.position, true
  from unnest(coalesce(p_obstacle_ids, '{}'::uuid[])) with ordinality as selected(obstacle_id, position);
end;
$$;

revoke all on function public.admin_set_race_obstacles(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_set_race_obstacles(uuid, uuid[]) to service_role;
