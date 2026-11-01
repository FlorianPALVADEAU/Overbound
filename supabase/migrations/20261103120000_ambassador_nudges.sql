-- One "almost there" email per ambassador, season and goal. The primary key is the idempotency
-- guard: an order retried by the webhook, or two orders in a row, can never send the same nudge twice.

create table if not exists public.ambassador_nudges (
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  season integer not null check (season between 2020 and 2100),
  points_required integer not null check (points_required > 0),
  sent_at timestamptz not null default now(),
  primary key (ambassador_id, season, points_required)
);

comment on table public.ambassador_nudges is
  'Nudge emails already sent: ambassador is within a few points of the goal worth points_required in the given season.';

alter table public.ambassador_nudges enable row level security;
revoke all on public.ambassador_nudges from public, anon, authenticated;
grant select, insert, delete on public.ambassador_nudges to service_role;
