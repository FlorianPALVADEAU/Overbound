-- Annual ambassador rewards. A reward remains immutable historical data once
-- expired, cancelled, or fulfilled; it is never deleted for a new program year.

alter table public.ambassador_points_events
  add column if not exists program_year integer;

update public.ambassador_points_events
set program_year = extract(year from created_at at time zone 'Europe/Paris')::integer
where program_year is null;

alter table public.ambassador_points_events
  alter column program_year set not null;

alter table public.ambassador_rewards
  add column if not exists program_year integer,
  add column if not exists expires_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid,
  add column if not exists cancellation_reason text,
  add column if not exists reopened_at timestamptz,
  add column if not exists reopened_by uuid;

update public.ambassador_rewards
set program_year = extract(year from earned_at at time zone 'Europe/Paris')::integer
where program_year is null;

update public.ambassador_rewards
set expires_at = make_timestamptz(program_year, 12, 31, 23, 59, 59, 'Europe/Paris')
where expires_at is null;

alter table public.ambassador_rewards
  alter column program_year set not null,
  alter column expires_at set not null;

-- The pre-annual constraint prevented an ambassador from earning the same level
-- in a later calendar year.
alter table public.ambassador_rewards
  drop constraint if exists ambassador_rewards_ambassador_id_reward_level_key;

alter table public.ambassador_rewards
  add constraint ambassador_rewards_ambassador_year_level_key
  unique (ambassador_id, program_year, reward_level);

create index if not exists ambassador_rewards_ambassador_year_earned_idx
  on public.ambassador_rewards (ambassador_id, program_year, earned_at desc);

create index if not exists ambassador_points_events_ambassador_year_idx
  on public.ambassador_points_events (ambassador_id, program_year, created_at desc);

create table if not exists public.ambassador_points_years (
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  program_year integer not null check (program_year between 2020 and 2100),
  total_points integer not null default 0 check (total_points >= 0),
  recruits_open integer not null default 0 check (recruits_open >= 0),
  recruits_ranked integer not null default 0 check (recruits_ranked >= 0),
  current_reward_level integer not null default 0 check (current_reward_level >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (ambassador_id, program_year)
);

insert into public.ambassador_points_years (
  ambassador_id, program_year, total_points, recruits_open, recruits_ranked, current_reward_level
)
select
  ambassador_id,
  program_year,
  coalesce(sum(points), 0)::integer,
  count(*) filter (where lower(race_format) = 'open')::integer,
  count(*) filter (where lower(race_format) = 'ranked')::integer,
  public.ambassador_reward_level_for_points(coalesce(sum(points), 0)::integer)
from public.ambassador_points_events
group by ambassador_id, program_year
on conflict (ambassador_id, program_year) do update
set total_points = excluded.total_points,
    recruits_open = excluded.recruits_open,
    recruits_ranked = excluded.recruits_ranked,
    current_reward_level = excluded.current_reward_level,
    updated_at = now();

create table if not exists public.ambassador_reward_audit_events (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.ambassador_rewards(id) on delete restrict,
  ambassador_id uuid not null references public.ambassadors(id) on delete restrict,
  action text not null check (action in ('cancelled', 'reopened')),
  from_status text not null,
  to_status text not null,
  reason text not null check (char_length(trim(reason)) between 3 and 1000),
  actor_profile_id uuid not null,
  idempotency_key uuid not null,
  occurred_at timestamptz not null default now(),
  unique (idempotency_key)
);

alter table public.ambassador_points_years enable row level security;
alter table public.ambassador_reward_audit_events enable row level security;
grant select, insert, update, delete on public.ambassador_points_years to service_role;
grant select, insert on public.ambassador_reward_audit_events to service_role;

-- The active compatibility signature now awards against the calendar year in
-- Europe/Paris. The obsolete (uuid, text) overload is intentionally untouched.
create or replace function public.ambassador_ensure_rewards(p_ambassador_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_program_year integer := extract(year from now() at time zone 'Europe/Paris')::integer;
  v_total_points integer := 0;
  v_expires_at timestamptz;
begin
  select coalesce(total_points, 0)
  into v_total_points
  from public.ambassador_points_years
  where ambassador_id = p_ambassador_id and program_year = v_program_year;

  v_expires_at := make_timestamptz(v_program_year, 12, 31, 23, 59, 59, 'Europe/Paris');

  insert into public.ambassador_rewards (
    ambassador_id, program_year, reward_level, reward_name, status, earned_at, expires_at, updated_at
  )
  select p_ambassador_id, v_program_year, level_id, reward_name, 'earned', now(), v_expires_at, now()
  from (values
    (1, 1,  'Badge ambassadeur + accès classement'),
    (2, 2,  'Récompense starter (réduction / avantage course)'),
    (3, 3,  'Réduction 50% sur un dossard (utilisable immédiatement)'),
    (4, 5,  'Dossard Open offert'),
    (5, 8,  'Upgrade VIP (file prioritaire + badge spécial)'),
    (6, 10, 'T-shirt ambassadeur / mise en avant réseau'),
    (7, 15, 'Statut confirmé (avantages exclusifs)'),
    (8, 20, 'Remboursement total'),
    (9, 25, 'Dossard offert édition suivante'),
    (10, 30,'Statut ambassadeur officiel (premium)')
  ) as levels(level_id, points_required, reward_name)
  where v_total_points >= points_required
  on conflict (ambassador_id, program_year, reward_level) do update
    set reward_name = excluded.reward_name;

  insert into public.ambassador_rewards (
    ambassador_id, program_year, reward_level, reward_name, status, earned_at, expires_at, updated_at
  )
  select p_ambassador_id, v_program_year, 10 + sequence_no, 'Dossard offert', 'earned', now(), v_expires_at, now()
  from generate_series(1, greatest(floor((v_total_points - 30) / 3.0)::integer, 0)) as sequence_no
  on conflict (ambassador_id, program_year, reward_level) do nothing;
end;
$$;

revoke all on function public.ambassador_ensure_rewards(uuid) from public, anon, authenticated;
grant execute on function public.ambassador_ensure_rewards(uuid) to service_role;
