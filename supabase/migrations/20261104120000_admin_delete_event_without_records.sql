-- Admin deletion of an event, only when nothing was sold or applied for on it.
--
-- Replaces the `force=true` branch of DELETE /api/admin/events/[id], which deleted registrations, then
-- tickets, then the event. registrations.event_id is ON DELETE SET NULL, so that branch left paid
-- registrations without event: sales records that no screen could reach. Here the check and the delete
-- run in one transaction, on a locked event row, so a registration inserted in parallel waits and then
-- fails its foreign key instead of being orphaned.
--
-- Cascades (tickets, event_price_tiers, upsells, event_races, event_waves, promotional_code_events) remain
-- the schema's own rules. An event with records is cancelled (status = 'cancelled'), never deleted.
--
-- WRITTEN, NOT APPLIED. Review, then apply by hand BEFORE deploying the code that calls the function.

create or replace function public.admin_delete_event_without_records(p_event_id uuid, p_organization_id uuid)
returns json
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_registrations bigint;
  v_volunteers bigint;
  v_lucky_entries bigint;
begin
  perform 1
  from public.events
  where id = p_event_id and organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  select count(*) into v_registrations from public.registrations where event_id = p_event_id;
  select count(*) into v_volunteers from public.volunteer_applications where event_id = p_event_id;
  select count(*) into v_lucky_entries from public.lucky_wheel_entries where event_id = p_event_id;

  if v_registrations + v_volunteers + v_lucky_entries > 0 then
    raise exception 'EVENT_HAS_RECORDS' using
      errcode = 'check_violation',
      detail = json_build_object(
        'registrationsCount', v_registrations,
        'volunteersCount', v_volunteers,
        'luckyWheelEntriesCount', v_lucky_entries
      )::text;
  end if;

  delete from public.events where id = p_event_id and organization_id = p_organization_id;
  return json_build_object('deleted', true, 'event_id', p_event_id);
end;
$$;

revoke all on function public.admin_delete_event_without_records(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_event_without_records(uuid, uuid) to service_role;
