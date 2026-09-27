-- Append-only audit trail for administrative ambassador point corrections.
-- The API must never overwrite an annual aggregate without recording why.

create table if not exists public.ambassador_points_adjustments (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors(id) on delete restrict,
  program_year integer not null check (program_year between 2020 and 2100),
  idempotency_key uuid not null unique,
  reason text not null check (char_length(trim(reason)) between 3 and 1000),
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  before_total_points integer not null check (before_total_points >= 0),
  after_total_points integer not null check (after_total_points >= 0),
  before_recruits_open integer not null check (before_recruits_open >= 0),
  after_recruits_open integer not null check (after_recruits_open >= 0),
  before_recruits_ranked integer not null check (before_recruits_ranked >= 0),
  after_recruits_ranked integer not null check (after_recruits_ranked >= 0),
  created_at timestamptz not null default now()
);

create index if not exists ambassador_points_adjustments_lookup_idx
  on public.ambassador_points_adjustments (ambassador_id, program_year, created_at desc);

alter table public.ambassador_points_adjustments enable row level security;
revoke all on table public.ambassador_points_adjustments from public, anon, authenticated;
grant select, insert on table public.ambassador_points_adjustments to service_role;

create or replace function public.admin_adjust_ambassador_points(
  p_ambassador_id uuid,
  p_program_year integer,
  p_total_points integer,
  p_recruits_open integer,
  p_recruits_ranked integer,
  p_reason text,
  p_actor_profile_id uuid,
  p_idempotency_key uuid
) returns public.ambassador_points_years
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.ambassador_points_years;
  v_existing public.ambassador_points_adjustments;
  v_level integer;
begin
  if p_program_year < 2020 or p_program_year > 2100 then raise exception 'invalid program year'; end if;
  if p_total_points < 0 or p_recruits_open < 0 or p_recruits_ranked < 0 then raise exception 'point values cannot be negative'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'a correction reason is required'; end if;

  select * into v_existing from public.ambassador_points_adjustments where idempotency_key = p_idempotency_key;
  if found then
    select * into v_current from public.ambassador_points_years
    where ambassador_id = p_ambassador_id and program_year = p_program_year;
    return v_current;
  end if;

  insert into public.ambassador_points_years (ambassador_id, program_year)
  values (p_ambassador_id, p_program_year)
  on conflict (ambassador_id, program_year) do nothing;

  select * into v_current from public.ambassador_points_years
  where ambassador_id = p_ambassador_id and program_year = p_program_year for update;

  v_level := public.ambassador_reward_level_for_points(p_total_points);
  insert into public.ambassador_points_adjustments (
    ambassador_id, program_year, idempotency_key, reason, actor_profile_id,
    before_total_points, after_total_points, before_recruits_open, after_recruits_open,
    before_recruits_ranked, after_recruits_ranked
  ) values (
    p_ambassador_id, p_program_year, p_idempotency_key, trim(p_reason), p_actor_profile_id,
    v_current.total_points, p_total_points, v_current.recruits_open, p_recruits_open,
    v_current.recruits_ranked, p_recruits_ranked
  );

  update public.ambassador_points_years set
    total_points = p_total_points,
    recruits_open = p_recruits_open,
    recruits_ranked = p_recruits_ranked,
    current_reward_level = v_level,
    updated_at = now()
  where ambassador_id = p_ambassador_id and program_year = p_program_year
  returning * into v_current;

  -- Lifetime compatibility aggregate = immutable events + all audited deltas.
  insert into public.ambassador_points (
    ambassador_id, total_points, recruits_open, recruits_ranked, current_reward_level, updated_at
  )
  select p_ambassador_id,
    coalesce((select sum(points) from public.ambassador_points_events where ambassador_id = p_ambassador_id), 0)
      + coalesce((select sum(after_total_points - before_total_points) from public.ambassador_points_adjustments where ambassador_id = p_ambassador_id), 0),
    coalesce((select count(*) filter (where lower(race_format) = 'open') from public.ambassador_points_events where ambassador_id = p_ambassador_id), 0)
      + coalesce((select sum(after_recruits_open - before_recruits_open) from public.ambassador_points_adjustments where ambassador_id = p_ambassador_id), 0),
    coalesce((select count(*) filter (where lower(race_format) = 'ranked') from public.ambassador_points_events where ambassador_id = p_ambassador_id), 0)
      + coalesce((select sum(after_recruits_ranked - before_recruits_ranked) from public.ambassador_points_adjustments where ambassador_id = p_ambassador_id), 0),
    public.ambassador_reward_level_for_points(
      coalesce((select sum(points) from public.ambassador_points_events where ambassador_id = p_ambassador_id), 0)
      + coalesce((select sum(after_total_points - before_total_points) from public.ambassador_points_adjustments where ambassador_id = p_ambassador_id), 0)
    ), now()
  on conflict (ambassador_id) do update set
    total_points = excluded.total_points, recruits_open = excluded.recruits_open,
    recruits_ranked = excluded.recruits_ranked, current_reward_level = excluded.current_reward_level,
    updated_at = now();

  return v_current;
end;
$$;

revoke all on function public.admin_adjust_ambassador_points(uuid, integer, integer, integer, integer, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_adjust_ambassador_points(uuid, integer, integer, integer, integer, text, uuid, uuid) to service_role;
