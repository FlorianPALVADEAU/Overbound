-- Ambassador program: one continuous season instead of calendar years, and a reset.
--
-- Decisions (2026-11-02):
--   * The calendar-year program (rewards expiring every Dec 31) is cancelled. A season is a fixed
--     key stored in ambassador_program_season; it changes only when the team resets the program on
--     purpose. program_year columns stay and hold the season key, so no data is rewritten.
--   * Rewards expire when the season ends, not on Dec 31 of each year: ambassador_program_season.ends_at
--     (2027-12-31 23:59:59 Paris for the first season) is copied to expires_at when a reward is earned.
--     A null ends_at means no expiry until the team sets one.
--   * Reset now: edition 2026 (Overbound Ultra Arena V1) is archived, points restart from zero.
--       - total points per ambassador are copied to ambassador_season_archive (kept);
--       - claimed and fulfilled rewards stay as they are (history, read only);
--       - earned but unclaimed rewards are archived with no claim possible (status cancelled);
--       - the points ledger, the audited adjustments and the yearly aggregates are deleted.
--   * Not retroactive: an order created before the season started never earns points, so deleting
--     the ledger cannot make an old order credit again.
--   * New ladder (season 2027 rows) and one bonus bib per 5 points above 30, with no cap.
--
-- BACK UP THE DATABASE BEFORE APPLYING: the deletes in section 3 cannot be undone.
-- Apply BEFORE deploying the matching application code.
-- Rollback: restore from the backup. Functions can be restored from 20261101120000.

-- ---------------------------------------------------------------------------------------------
-- 1. Season
-- ---------------------------------------------------------------------------------------------

create table if not exists public.ambassador_program_season (
  singleton boolean primary key default true check (singleton),
  current_season integer not null check (current_season between 2020 and 2100),
  started_at timestamptz not null,
  ends_at timestamptz check (ends_at is null or ends_at > started_at)
);

comment on table public.ambassador_program_season is
  'The running season. current_season is the program_year key of every new point and reward; started_at is the earliest order date that can earn points; ends_at is when the rewards earned in the season expire (null: no expiry). Change it only through a deliberate reset.';

insert into public.ambassador_program_season (singleton, current_season, started_at, ends_at)
values (true, 2027, now(), make_timestamptz(2027, 12, 31, 23, 59, 59, 'Europe/Paris'))
on conflict (singleton) do nothing;

alter table public.ambassador_program_season enable row level security;
revoke all on public.ambassador_program_season from public, anon, authenticated;
grant select on public.ambassador_program_season to service_role;

create or replace function public.ambassador_current_season()
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select current_season from public.ambassador_program_season where singleton;
$$;

create or replace function public.ambassador_season_started_at()
returns timestamptz
language sql
stable
security invoker
set search_path = public
as $$
  select started_at from public.ambassador_program_season where singleton;
$$;

revoke all on function public.ambassador_current_season() from public, anon, authenticated;
revoke all on function public.ambassador_season_started_at() from public, anon, authenticated;
grant execute on function public.ambassador_current_season() to service_role;
grant execute on function public.ambassador_season_started_at() to service_role;

-- ---------------------------------------------------------------------------------------------
-- 2. Archive of the previous edition (totals only, not the detail)
-- ---------------------------------------------------------------------------------------------

create table if not exists public.ambassador_season_archive (
  season integer not null,
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  total_points integer not null,
  recruits_open integer not null,
  recruits_ranked integer not null,
  archived_at timestamptz not null default now(),
  primary key (season, ambassador_id)
);

comment on table public.ambassador_season_archive is
  'Final totals of a closed season, copied before its ledger was deleted. Read only.';

alter table public.ambassador_season_archive enable row level security;
revoke all on public.ambassador_season_archive from public, anon, authenticated;
grant select on public.ambassador_season_archive to service_role;

insert into public.ambassador_season_archive (season, ambassador_id, total_points, recruits_open, recruits_ranked)
select program_year, ambassador_id, total_points, recruits_open, recruits_ranked
from public.ambassador_points_years
where program_year < 2027 and total_points > 0
on conflict (season, ambassador_id) do nothing;

-- ---------------------------------------------------------------------------------------------
-- 3. Reset
-- ---------------------------------------------------------------------------------------------

-- Legacy rows keep their date; rewards of the new season take the season end (null when it is not set).
alter table public.ambassador_rewards alter column expires_at drop not null;

-- Earned but unclaimed rewards of the closed edition: archived, no claim possible.
with archived as (
  update public.ambassador_rewards
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = null,
      cancellation_reason = 'Édition 2026 clôturée : récompense non réclamée archivée',
      updated_at = now()
  where program_year < 2027 and status = 'earned'
  returning id, ambassador_id
)
insert into public.ambassador_reward_audit_events
  (reward_id, ambassador_id, action, from_status, to_status, reason, actor_profile_id, idempotency_key)
select id, ambassador_id, 'cancelled', 'earned', 'cancelled',
       'Édition 2026 clôturée : récompense non réclamée archivée', null, gen_random_uuid()
from archived;

-- The points history of the closed edition. The totals are in ambassador_season_archive.
delete from public.ambassador_points_events;
delete from public.ambassador_points_adjustments;
delete from public.ambassador_points_years;

-- ---------------------------------------------------------------------------------------------
-- 4. New ladder
-- ---------------------------------------------------------------------------------------------

insert into public.ambassador_reward_levels
  (effective_year, reward_level, points_required, reward_name, description, badge_label, kind)
values
  (2027, 1, 1,  'Badge Ambassadeur',                'Ton badge ambassadeur et ta place au classement.',                                   'Ambassadeur',    'recognition'),
  (2027, 2, 3,  '-50 % sur ton dossard',            'Un code de -50 % sur ton propre dossard.',                                           '-50 %',          'discount'),
  (2027, 3, 5,  'T-shirt Overbound',                'Un T-shirt Overbound, envoyé chez toi.',                                             'T-shirt',        'merch'),
  (2027, 4, 8,  'Dossard Open offert',              'Un dossard Open offert, pour toi ou pour un ami.',                                   'Dossard Open',   'bib'),
  (2027, 5, 12, 'Mise en avant sur nos réseaux',    'Tu es mis en avant sur les réseaux sociaux d''Overbound.',                           'Mise en avant',  'recognition'),
  (2027, 6, 20, 'Dossard Ranked offert',            'Un dossard Ranked offert, pour toi ou pour un ami.',                                 'Dossard Ranked', 'bib'),
  (2027, 7, 25, 'Pack média offert',                'Les photos et vidéos de l''événement, offertes.',                                    'Pack média',     'perk'),
  (2027, 8, 30, 'Ambassadeur Or',                   'Le statut Ambassadeur Or, puis un dossard offert tous les 5 points.',                'Ambassadeur Or', 'recognition')
on conflict (effective_year, reward_level) do nothing;

-- ---------------------------------------------------------------------------------------------
-- 5. Functions follow the season, rewards never expire, old orders never earn
-- ---------------------------------------------------------------------------------------------

create or replace function public.ambassador_reward_level_for_points(p_total_points integer)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select public.ambassador_level_at(p_total_points, public.ambassador_current_season());
$$;

create or replace function public.ambassador_reconcile_rewards(p_ambassador_id uuid, p_program_year integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_levels_year integer;
  v_last_level integer;
  v_rules public.ambassador_program_rules;
  v_expires_at timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended('ambassador-rewards:' || p_ambassador_id::text || ':' || p_program_year::text, 0));

  select total_points into v_total
  from public.ambassador_points_years
  where ambassador_id = p_ambassador_id and program_year = p_program_year;
  v_total := coalesce(v_total, 0);

  -- Only the running season has an end date; a closed season is never reconciled with a new expiry.
  select ends_at into v_expires_at from public.ambassador_program_season where singleton and current_season = p_program_year;

  select max(effective_year) into v_levels_year
  from public.ambassador_reward_levels where effective_year <= p_program_year;

  if v_levels_year is not null then
    insert into public.ambassador_rewards
      (ambassador_id, program_year, reward_level, reward_name, points_required, status, earned_at, expires_at, updated_at)
    select p_ambassador_id, p_program_year, level.reward_level, level.reward_name, level.points_required,
           'earned', now(), v_expires_at, now()
    from public.ambassador_reward_levels level
    where level.effective_year = v_levels_year and level.points_required <= v_total
    on conflict (ambassador_id, program_year, reward_level) do nothing;

    select max(reward_level) into v_last_level
    from public.ambassador_reward_levels where effective_year = v_levels_year;
  end if;

  select * into v_rules
  from public.ambassador_program_rules
  where effective_year = (select max(effective_year) from public.ambassador_program_rules where effective_year <= p_program_year);

  if found and v_last_level is not null and v_total >= v_rules.bonus_base_points + v_rules.bonus_interval_points then
    insert into public.ambassador_rewards
      (ambassador_id, program_year, reward_level, reward_name, points_required, status, earned_at, expires_at, updated_at)
    select p_ambassador_id, p_program_year, v_last_level + n, v_rules.bonus_reward_name,
           v_rules.bonus_base_points + n * v_rules.bonus_interval_points,
           'earned', now(), v_expires_at, now()
    from generate_series(1, (v_total - v_rules.bonus_base_points) / v_rules.bonus_interval_points) as n
    on conflict (ambassador_id, program_year, reward_level) do nothing;
  end if;

  with reopened as (
    update public.ambassador_rewards
    set status = 'earned', reopened_at = now(), reopened_by = null, updated_at = now()
    where ambassador_id = p_ambassador_id
      and program_year = p_program_year
      and status = 'cancelled'
      and cancelled_by is null
      and points_required <= v_total
    returning id, ambassador_id
  )
  insert into public.ambassador_reward_audit_events
    (reward_id, ambassador_id, action, from_status, to_status, reason, actor_profile_id, idempotency_key)
  select id, ambassador_id, 'reopened', 'cancelled', 'earned', 'Points rétablis', null, gen_random_uuid()
  from reopened;

  with cancelled as (
    update public.ambassador_rewards
    set status = 'cancelled', cancelled_at = now(), cancelled_by = null,
        cancellation_reason = 'Points insuffisants après révocation ou correction',
        updated_at = now()
    where ambassador_id = p_ambassador_id
      and program_year = p_program_year
      and status = 'earned'
      and points_required > v_total
    returning id, ambassador_id
  )
  insert into public.ambassador_reward_audit_events
    (reward_id, ambassador_id, action, from_status, to_status, reason, actor_profile_id, idempotency_key)
  select id, ambassador_id, 'cancelled', 'earned', 'cancelled', 'Points insuffisants après révocation ou correction', null, gen_random_uuid()
  from cancelled;
end;
$$;

create or replace function public.ambassador_ensure_rewards(p_ambassador_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season integer := public.ambassador_current_season();
begin
  perform public.ambassador_sync_points(p_ambassador_id, v_season);
  perform public.ambassador_reconcile_rewards(p_ambassador_id, v_season);
end;
$$;

create or replace function public.award_ambassador_points_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season integer := public.ambassador_current_season();
  v_started_at timestamptz := public.ambassador_season_started_at();
  v_affected record;
begin
  if p_order_id is null then
    raise exception 'order id is required';
  end if;

  -- Not retroactive: an order created before the season started never earns points.
  -- Self-referral = the participant's email is the ambassador's own account email.
  insert into public.ambassador_points_events
    (ambassador_id, order_id, registration_id, race_format, points, program_year)
  select
    apc.ambassador_id,
    o.id,
    r.id,
    coalesce(t.race_format, 'open'),
    case when coalesce(t.race_format, 'open') = 'ranked' then 2 else 1 end,
    v_season
  from public.registrations r
  join public.orders o on o.id = r.order_id
  join public.ambassador_promotional_codes apc on apc.promotional_code_id = r.promotional_code_id
  join public.ambassadors a on a.id = apc.ambassador_id and a.is_active = true
  join auth.users account on account.id = a.profile_id
  left join public.tickets t on t.id = r.ticket_id
  where r.order_id = p_order_id
    and o.created_at >= v_started_at
    and lower(coalesce(o.status, '')) = 'paid'
    and coalesce(o.amount_total, 0) > 0
    and r.cancelled_at is null
    and lower(coalesce(r.email, '')) is distinct from lower(coalesce(account.email, ''))
  on conflict (ambassador_id, registration_id) do nothing;

  for v_affected in
    select distinct ambassador_id, program_year
    from public.ambassador_points_events
    where order_id = p_order_id
  loop
    perform public.ambassador_sync_points(v_affected.ambassador_id, v_affected.program_year);
    perform public.ambassador_reconcile_rewards(v_affected.ambassador_id, v_affected.program_year);
  end loop;
end;
$$;

create or replace function public.admin_credit_manual_referral(
  p_ambassador_id uuid,
  p_registration_id uuid,
  p_points integer,
  p_race_format text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season integer := public.ambassador_current_season();
  v_order_id uuid;
  v_ticket_format text;
  v_inserted integer;
begin
  if p_points < 1 or p_points > 10 then raise exception 'points out of range'; end if;
  if p_race_format is not null and p_race_format not in ('open', 'ranked') then raise exception 'invalid race format'; end if;

  select r.order_id, t.race_format into v_order_id, v_ticket_format
  from public.registrations r
  left join public.tickets t on t.id = r.ticket_id
  where r.id = p_registration_id;
  if not found then raise exception 'registration not found'; end if;

  insert into public.ambassador_manual_referrals (ambassador_id, registration_id)
  values (p_ambassador_id, p_registration_id)
  on conflict (ambassador_id, registration_id) do nothing;

  insert into public.ambassador_points_events
    (ambassador_id, order_id, registration_id, race_format, points, program_year)
  values (p_ambassador_id, v_order_id, p_registration_id, coalesce(p_race_format, v_ticket_format, 'open'), p_points, v_season)
  on conflict (ambassador_id, registration_id) do nothing;
  get diagnostics v_inserted = row_count;

  perform public.ambassador_sync_points(p_ambassador_id, v_season);
  perform public.ambassador_reconcile_rewards(p_ambassador_id, v_season);
  return v_inserted > 0;
end;
$$;
