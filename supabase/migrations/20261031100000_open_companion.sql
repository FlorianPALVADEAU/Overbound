-- "Option OPEN": a RANKED participant can add a second bib on the OPEN ticket.
-- The companion is a real registration (own bib, QR and SAS) linked to the RANKED one.
-- Cancelling or transferring the RANKED bib carries the companion with it.
--
-- Apply BEFORE deploying code that writes companion_of.
-- The ticket contract is data, set per RANKED ticket (no migration needed):
--   update public.tickets set operations_config = operations_config || jsonb_build_object(
--     'open_companion', jsonb_build_object(
--       'ticket_id', '<open ticket uuid>',
--       'price_cents', 2900,
--       'ranked_max_duration_minutes', 230,
--       'min_gap_minutes', 20))
--   where id = '<ranked ticket uuid>';

alter table public.registrations
  add column if not exists companion_of uuid references public.registrations(id) on delete restrict;

alter table public.registrations
  drop constraint if exists registrations_companion_not_self;
alter table public.registrations
  add constraint registrations_companion_not_self check (companion_of is null or companion_of <> id);

-- A RANKED bib has at most one companion.
create unique index if not exists registrations_one_companion_per_bib
  on public.registrations (companion_of)
  where companion_of is not null;

-- Cancelling a flexible RANKED bib cancels its companion bib in the same transaction:
-- QR invalidated, SAS seat released, wave counter recounted. A companion that was already
-- checked in blocks the cancellation, like the RANKED bib itself would.
create or replace function public.cancel_registration_for_flexible_refund(p_registration_id uuid)
returns json
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_registration public.registrations%rowtype;
  v_bib public.registrations%rowtype;
begin
  select * into v_registration
  from public.registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'REGISTRATION_NOT_FOUND' using errcode = 'no_data_found';
  end if;
  if v_registration.cancelled_at is not null then
    return json_build_object('already_cancelled', true);
  end if;
  if v_registration.checked_in then
    raise exception 'REGISTRATION_CHECKED_IN' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from public.registrations
    where companion_of = p_registration_id and cancelled_at is null and checked_in
  ) then
    raise exception 'REGISTRATION_CHECKED_IN' using errcode = 'check_violation';
  end if;

  for v_bib in
    select * from public.registrations
    where id = p_registration_id
       or (companion_of = p_registration_id and cancelled_at is null)
    order by id
    for update
  loop
    update public.registrations
    set cancelled_at = now(),
        cancellation_reason = 'flexible_refund',
        qr_code_token = null,
        transfer_token = null,
        wave_index = null,
        wave_position = null,
        wave_capacity = null,
        start_time = null
    where id = v_bib.id;

    if v_bib.wave_index is not null then
      update public.event_waves wave
      set assigned_count = (
            select count(*)::integer
            from public.registrations registration
            where registration.ticket_id = wave.ticket_id
              and registration.wave_index = wave.wave_index
          ),
          updated_at = now()
      where wave.ticket_id = v_bib.ticket_id
        and wave.wave_index = v_bib.wave_index;
    end if;
  end loop;

  return json_build_object('already_cancelled', false);
end;
$$;

revoke all on function public.cancel_registration_for_flexible_refund(uuid) from public, anon, authenticated;
grant execute on function public.cancel_registration_for_flexible_refund(uuid) to service_role;
