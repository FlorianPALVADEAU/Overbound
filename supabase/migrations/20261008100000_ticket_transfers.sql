-- Paid ticket transfers: the holder pays a fee through Stripe Checkout to unlock
-- the hand-over link of a bib; the claim endpoint only accepts unlocked bibs.
-- NOT applied automatically -- review before running against any environment.
create table if not exists public.ticket_transfers (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  payer_user_id uuid not null,
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur',
  status text not null default 'pending' check (status in ('pending', 'paid', 'claimed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  claimed_at timestamptz,
  claimed_by uuid
);

-- One open (pending or paid, not yet claimed) transfer per bib.
create unique index if not exists ticket_transfers_one_open_per_registration
  on public.ticket_transfers (registration_id)
  where status in ('pending', 'paid');

create index if not exists ticket_transfers_registration_idx on public.ticket_transfers (registration_id);

-- Service role only (API routes and the Stripe webhook): no policy = no client access.
alter table public.ticket_transfers enable row level security;
revoke all on public.ticket_transfers from anon, authenticated;
