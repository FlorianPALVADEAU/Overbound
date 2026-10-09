-- "Billet flexible" option: a per-bib fee that lets the original buyer cancel the
-- bib and get its ticket price back until 7 days before the event.
-- Cancelled bibs are kept (soft cancel) because other rows reference them
-- (signatures, upsells of the whole order, ambassador points, admin commands).

alter table public.registrations
  add column if not exists flexible_refund boolean not null default false,
  add column if not exists paid_ticket_cents integer check (paid_ticket_cents is null or paid_ticket_cents >= 0),
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

create index if not exists registrations_event_active_idx
  on public.registrations (event_id)
  where cancelled_at is null;

create table if not exists public.ticket_refunds (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  stripe_payment_intent_id text not null,
  stripe_refund_id text unique,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur',
  reason text not null check (reason in ('flexible')),
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one live refund per bib; a failed attempt can be retried.
create unique index if not exists ticket_refunds_one_live_per_registration
  on public.ticket_refunds (registration_id)
  where status <> 'failed';

alter table public.ticket_refunds enable row level security;
-- This project grants nothing by default on new tables: the server (service_role) needs explicit rights.
grant select, insert, update on public.ticket_refunds to service_role;

-- Atomic soft cancel: frees the SAS seat and invalidates the QR code.
create or replace function public.cancel_registration_for_flexible_refund(p_registration_id uuid)
returns json
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_registration public.registrations%rowtype;
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

  update public.registrations
  set cancelled_at = now(),
      cancellation_reason = 'flexible_refund',
      qr_code_token = null,
      transfer_token = null,
      wave_index = null,
      wave_position = null,
      wave_capacity = null,
      start_time = null
  where id = p_registration_id;

  if v_registration.wave_index is not null then
    update public.event_waves wave
    set assigned_count = (
          select count(*)::integer
          from public.registrations registration
          where registration.ticket_id = wave.ticket_id
            and registration.wave_index = wave.wave_index
        ),
        updated_at = now()
    where wave.ticket_id = v_registration.ticket_id
      and wave.wave_index = v_registration.wave_index;
  end if;

  return json_build_object('already_cancelled', false);
end;
$$;

revoke all on function public.cancel_registration_for_flexible_refund(uuid) from public, anon, authenticated;
grant execute on function public.cancel_registration_for_flexible_refund(uuid) to service_role;
