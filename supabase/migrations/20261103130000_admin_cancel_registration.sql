-- Admin cancellation of a registration, with an optional Stripe refund.
-- Replaces the hard delete the back-office used to offer: the row is kept (soft cancel), the QR code is
-- invalidated, the SAS seat is released, the wave counter is recounted, the OPEN companion goes with its
-- RANKED bib, and the ambassador triggers on registrations.cancelled_at revoke the points.
--
-- WRITTEN, NOT APPLIED. Review, then apply by hand BEFORE deploying the code that calls
-- admin_cancel_registration and writes ticket_refunds.reason = 'admin'.

-- 1. A refund can now be started by an admin. Keep who did it and why.
alter table public.ticket_refunds
  drop constraint if exists ticket_refunds_reason_check;
alter table public.ticket_refunds
  add constraint ticket_refunds_reason_check check (reason in ('flexible', 'admin'));

alter table public.ticket_refunds
  add column if not exists admin_user_id uuid references auth.users(id) on delete set null,
  add column if not exists note text;

-- 2. Same atomic soft cancel as cancel_registration_for_flexible_refund, with the reason as a parameter.
create or replace function public.admin_cancel_registration(p_registration_id uuid, p_reason text)
returns json
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_registration public.registrations%rowtype;
  v_bib public.registrations%rowtype;
begin
  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'CANCELLATION_REASON_REQUIRED' using errcode = 'invalid_parameter_value';
  end if;

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
        cancellation_reason = left(btrim(p_reason), 200),
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

revoke all on function public.admin_cancel_registration(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_cancel_registration(uuid, text) to service_role;
