-- Ambassador program: one source for rules, one writer for aggregates, revocable points.
--
-- Before: the reward ladder lived in four places (a SQL VALUES list, a SQL CASE, a TS constant,
-- a TS presentation map) with diverging names; aggregates were written by five code paths
-- (award RPC, admin adjust RPC, a read-modify-write admin route, two legacy tables); points were
-- never revoked; self-referrals and free orders earned points.
--
-- After:
--   * ambassador_reward_levels / ambassador_program_rules: the ladder and the bonus rule, versioned
--     by effective_year. A year uses the latest row whose effective_year <= that year, so a rule
--     change only ever applies to a new program year and never rewrites a past one.
--   * ambassador_sync_points(): the only writer of ambassador_points_years. It recomputes from the
--     ledger (valid events) plus audited admin deltas, so it is idempotent and order-independent.
--   * ambassador_reconcile_rewards(): creates, reopens (system-cancelled only) and cancels (unclaimed
--     only) rewards from the current total. Claimed or fulfilled rewards are never touched.
--   * ambassador_rewards.points_required: threshold snapshot taken when a reward is earned, so a later
--     rule change cannot make an already earned reward look unjustified.
--   * revoke_ambassador_points() + triggers: a refunded or cancelled order and a cancelled registration
--     take their points back. Events are never deleted, only marked revoked.
--   * award_ambassador_points_for_order(): no points for the ambassador's own registration (same email
--     as their account), for free orders, or for cancelled registrations.
--   * The two award triggers that only existed in production are versioned here.
--
-- Not retroactive: existing events, points and rewards are untouched. The 2026 bonus rule stays one
-- bib per 3 points; 2027 uses 5. Changing the interval for a year that already has bonus rewards would
-- freeze new bonuses until the new interval catches up: add a new effective_year instead.
--
-- Apply BEFORE deploying the matching application code. Rollback: restore the function bodies from
-- 20260927134440 / 20260927150000 / 20261025120000 and drop the revoke triggers; columns and tables
-- added here are additive and can stay.

-- ---------------------------------------------------------------------------------------------
-- 1. Rules
-- ---------------------------------------------------------------------------------------------

create table if not exists public.ambassador_reward_levels (
  effective_year integer not null check (effective_year between 2020 and 2100),
  reward_level integer not null check (reward_level between 1 and 10),
  points_required integer not null check (points_required > 0),
  reward_name text not null check (char_length(trim(reward_name)) > 0),
  description text not null,
  badge_label text not null,
  kind text not null check (kind in ('recognition', 'discount', 'bib', 'perk', 'merch', 'refund')),
  primary key (effective_year, reward_level),
  unique (effective_year, points_required)
);

create table if not exists public.ambassador_program_rules (
  effective_year integer primary key check (effective_year between 2020 and 2100),
  bonus_base_points integer not null check (bonus_base_points > 0),
  bonus_interval_points integer not null check (bonus_interval_points > 0),
  bonus_reward_name text not null default 'Dossard offert'
);

comment on table public.ambassador_reward_levels is
  'Reward ladder. A program year uses the rows of the latest effective_year <= that year.';
comment on table public.ambassador_program_rules is
  'Bonus rule beyond the last level: one reward per bonus_interval_points above bonus_base_points. Same effective_year resolution as ambassador_reward_levels.';

insert into public.ambassador_reward_levels
  (effective_year, reward_level, points_required, reward_name, description, badge_label, kind)
values
  (2026, 1, 1,  'Badge ambassadeur + accès classement', 'Badge ambassadeur et accès au classement.', 'Badge Starter', 'recognition'),
  (2026, 2, 2,  'Récompense starter (réduction / avantage course)', 'Récompense starter pour maintenir la motivation.', 'Badge Relayeur', 'perk'),
  (2026, 3, 3,  'Réduction 50% sur un dossard (utilisable immédiatement)', 'Palier clé: -50% sur un dossard, utilisable immédiatement.', 'Badge Booster', 'discount'),
  (2026, 4, 5,  'Dossard Open offert', 'Premier vrai dossard offert: format Open.', 'Badge Open Hero', 'bib'),
  (2026, 5, 8,  'Upgrade VIP (file prioritaire + badge spécial)', 'Upgrade VIP avec avantages exclusifs le jour J.', 'Badge VIP', 'perk'),
  (2026, 6, 10, 'T-shirt ambassadeur / mise en avant réseau', 'T-shirt ambassadeur ou mise en avant réseau.', 'Badge Communauté', 'merch'),
  (2026, 7, 15, 'Statut confirmé (avantages exclusifs)', 'Statut confirmé avec perks dédiés.', 'Badge Confirmé', 'perk'),
  (2026, 8, 20, 'Remboursement total', 'Niveau élite: remboursement total.', 'Badge Elite', 'refund'),
  (2026, 9, 25, 'Dossard offert édition suivante', 'Dossard offert pour l’édition suivante.', 'Badge Légende', 'bib'),
  (2026, 10, 30, 'Statut ambassadeur officiel (premium)', 'Statut ambassadeur officiel premium.', 'Badge Officiel', 'recognition')
on conflict (effective_year, reward_level) do nothing;

insert into public.ambassador_program_rules (effective_year, bonus_base_points, bonus_interval_points)
values (2026, 30, 3), (2027, 30, 5)
on conflict (effective_year) do nothing;

alter table public.ambassador_reward_levels enable row level security;
alter table public.ambassador_program_rules enable row level security;
revoke all on public.ambassador_reward_levels, public.ambassador_program_rules from public, anon, authenticated;
grant select on public.ambassador_reward_levels, public.ambassador_program_rules to service_role;

-- ---------------------------------------------------------------------------------------------
-- 2. Columns
-- ---------------------------------------------------------------------------------------------

alter table public.ambassador_rewards add column if not exists points_required integer;

update public.ambassador_rewards reward
set points_required = level.points_required
from public.ambassador_reward_levels level
where level.effective_year = 2026
  and level.reward_level = reward.reward_level
  and reward.points_required is null;

-- Bonus rewards (level 11 and up) were granted one per 3 points above 30.
update public.ambassador_rewards
set points_required = 30 + 3 * (reward_level - 10)
where reward_level > 10 and points_required is null;

alter table public.ambassador_rewards alter column points_required set not null;

alter table public.ambassador_points_events
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_reason text;

create index if not exists ambassador_points_events_order_idx
  on public.ambassador_points_events (order_id) where revoked_at is null;

-- System actions (revocation, reconciliation) have no human actor.
alter table public.ambassador_reward_audit_events alter column actor_profile_id drop not null;

comment on table public.ambassador_points is
  'DEPRECATED lifetime aggregate. No longer written; read ambassador_points_years instead.';

-- ---------------------------------------------------------------------------------------------
-- 3. Level lookup (was only in production, never versioned)
-- ---------------------------------------------------------------------------------------------

create or replace function public.ambassador_level_at(p_total_points integer, p_program_year integer)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(max(reward_level), 0)
  from public.ambassador_reward_levels
  where effective_year = (
      select max(effective_year) from public.ambassador_reward_levels where effective_year <= p_program_year
    )
    and points_required <= coalesce(p_total_points, 0);
$$;

create or replace function public.ambassador_reward_level_for_points(p_total_points integer)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select public.ambassador_level_at(
    p_total_points,
    extract(year from now() at time zone 'Europe/Paris')::integer
  );
$$;

revoke all on function public.ambassador_level_at(integer, integer) from public, anon, authenticated;
grant execute on function public.ambassador_level_at(integer, integer) to service_role;
grant execute on function public.ambassador_reward_level_for_points(integer) to service_role;

-- ---------------------------------------------------------------------------------------------
-- 4. Single writer of the annual aggregate
-- ---------------------------------------------------------------------------------------------

create or replace function public.ambassador_sync_points(p_ambassador_id uuid, p_program_year integer)
returns public.ambassador_points_years
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.ambassador_points_years;
  v_points integer;
  v_open integer;
  v_ranked integer;
begin
  -- Serialise per ambassador and year so a recompute never writes a stale snapshot.
  perform pg_advisory_xact_lock(hashtextextended('ambassador-points:' || p_ambassador_id::text || ':' || p_program_year::text, 0));

  select
    coalesce(sum(points), 0)::integer,
    (count(*) filter (where lower(race_format) = 'open'))::integer,
    (count(*) filter (where lower(race_format) = 'ranked'))::integer
  into v_points, v_open, v_ranked
  from public.ambassador_points_events
  where ambassador_id = p_ambassador_id
    and program_year = p_program_year
    and revoked_at is null;

  select
    v_points + coalesce(sum(after_total_points - before_total_points), 0)::integer,
    v_open + coalesce(sum(after_recruits_open - before_recruits_open), 0)::integer,
    v_ranked + coalesce(sum(after_recruits_ranked - before_recruits_ranked), 0)::integer
  into v_points, v_open, v_ranked
  from public.ambassador_points_adjustments
  where ambassador_id = p_ambassador_id
    and program_year = p_program_year;

  v_points := greatest(v_points, 0);

  insert into public.ambassador_points_years as years
    (ambassador_id, program_year, total_points, recruits_open, recruits_ranked, current_reward_level, updated_at)
  values (
    p_ambassador_id, p_program_year, v_points, greatest(v_open, 0), greatest(v_ranked, 0),
    public.ambassador_level_at(v_points, p_program_year), now()
  )
  on conflict (ambassador_id, program_year) do update
  set total_points = excluded.total_points,
      recruits_open = excluded.recruits_open,
      recruits_ranked = excluded.recruits_ranked,
      current_reward_level = excluded.current_reward_level,
      updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 5. Rewards follow the total, in both directions
-- ---------------------------------------------------------------------------------------------

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
  v_expires_at timestamptz := make_timestamptz(p_program_year, 12, 31, 23, 59, 59, 'Europe/Paris');
begin
  perform pg_advisory_xact_lock(hashtextextended('ambassador-rewards:' || p_ambassador_id::text || ':' || p_program_year::text, 0));

  select total_points into v_total
  from public.ambassador_points_years
  where ambassador_id = p_ambassador_id and program_year = p_program_year;
  v_total := coalesce(v_total, 0);

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

  -- Points came back (a replacement referral, an admin correction): reopen what the system cancelled.
  -- Rewards cancelled by an admin (cancelled_by set) stay cancelled.
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

  -- Points were taken away: cancel what is no longer justified, but only if not yet claimed.
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

-- Kept for callers of the previous release; drop once no application code calls it.
create or replace function public.ambassador_ensure_rewards(p_ambassador_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := extract(year from now() at time zone 'Europe/Paris')::integer;
begin
  perform public.ambassador_sync_points(p_ambassador_id, v_year);
  perform public.ambassador_reconcile_rewards(p_ambassador_id, v_year);
end;
$$;

-- Claimed or fulfilled rewards the total no longer justifies: only a human can resolve these.
create or replace view public.ambassador_rewards_over_granted
with (security_invoker = true) as
select reward.id as reward_id, reward.ambassador_id, reward.program_year, reward.reward_level,
       reward.reward_name, reward.status, reward.points_required, years.total_points
from public.ambassador_rewards reward
join public.ambassador_points_years years
  on years.ambassador_id = reward.ambassador_id and years.program_year = reward.program_year
where reward.status in ('claimed', 'fulfilled')
  and reward.points_required > years.total_points;

-- ---------------------------------------------------------------------------------------------
-- 6. Attribution: no self-referral, no free order, no cancelled registration
-- ---------------------------------------------------------------------------------------------

create or replace function public.award_ambassador_points_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := extract(year from now() at time zone 'Europe/Paris')::integer;
  v_affected record;
begin
  if p_order_id is null then
    raise exception 'order id is required';
  end if;

  -- The unique (ambassador_id, registration_id) key makes retries and concurrent deliveries no-ops.
  -- Self-referral = the participant's email is the ambassador's own account email. An ambassador who
  -- buys places for other people with their code is a normal referral.
  insert into public.ambassador_points_events
    (ambassador_id, order_id, registration_id, race_format, points, program_year)
  select
    apc.ambassador_id,
    o.id,
    r.id,
    coalesce(t.race_format, 'open'),
    case when coalesce(t.race_format, 'open') = 'ranked' then 2 else 1 end,
    v_year
  from public.registrations r
  join public.orders o on o.id = r.order_id
  join public.ambassador_promotional_codes apc on apc.promotional_code_id = r.promotional_code_id
  join public.ambassadors a on a.id = apc.ambassador_id and a.is_active = true
  join auth.users account on account.id = a.profile_id
  left join public.tickets t on t.id = r.ticket_id
  where r.order_id = p_order_id
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

comment on function public.award_ambassador_points_for_order(uuid) is
  'Idempotently credits ambassador points for a paid, non-free order. Skips the ambassador''s own registration and cancelled registrations. Aggregates are recomputed by ambassador_sync_points.';

-- ---------------------------------------------------------------------------------------------
-- 7. Revocation
-- ---------------------------------------------------------------------------------------------

create or replace function public.revoke_ambassador_points(p_order_id uuid, p_registration_id uuid, p_reason text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affected record;
  v_revoked integer := 0;
begin
  for v_affected in
    with revoked as (
      update public.ambassador_points_events
      set revoked_at = now(), revoked_reason = p_reason
      where order_id = p_order_id
        and revoked_at is null
        and (p_registration_id is null or registration_id = p_registration_id)
      returning ambassador_id, program_year
    )
    select ambassador_id, program_year, count(*)::integer as revoked_count
    from revoked
    group by ambassador_id, program_year
  loop
    v_revoked := v_revoked + v_affected.revoked_count;
    perform public.ambassador_sync_points(v_affected.ambassador_id, v_affected.program_year);
    perform public.ambassador_reconcile_rewards(v_affected.ambassador_id, v_affected.program_year);
  end loop;

  return v_revoked;
end;
$$;

create or replace function public.trg_registrations_revoke_ambassador_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.cancelled_at is null and new.cancelled_at is not null and new.order_id is not null then
    perform public.revoke_ambassador_points(new.order_id, new.id, 'Inscription annulée');
  end if;
  return new;
end;
$$;

create or replace function public.trg_orders_revoke_ambassador_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.status, '')) in ('refunded', 'cancelled')
     and old.status is distinct from new.status then
    perform public.revoke_ambassador_points(new.id, null, 'Commande ' || lower(new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists registrations_revoke_ambassador_points_trigger on public.registrations;
create trigger registrations_revoke_ambassador_points_trigger
  after update of cancelled_at on public.registrations
  for each row execute function public.trg_registrations_revoke_ambassador_points();

drop trigger if exists orders_revoke_ambassador_points_trigger on public.orders;
create trigger orders_revoke_ambassador_points_trigger
  after update of status on public.orders
  for each row execute function public.trg_orders_revoke_ambassador_points();

-- The award triggers existed only in production. Same definitions, now versioned.
create or replace function public.trg_orders_award_ambassador_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    perform public.award_ambassador_points_for_order(new.id);
  end if;
  return new;
end;
$$;

create or replace function public.trg_registrations_award_ambassador_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if new.order_id is null then
    return new;
  end if;

  select status into v_status from public.orders where id = new.order_id;
  if v_status = 'paid' then
    perform public.award_ambassador_points_for_order(new.order_id);
  end if;

  return new;
end;
$$;

drop trigger if exists orders_award_ambassador_points_trigger on public.orders;
create trigger orders_award_ambassador_points_trigger
  after insert or update of status on public.orders
  for each row execute function public.trg_orders_award_ambassador_points();

drop trigger if exists registrations_award_ambassador_points_trigger on public.registrations;
create trigger registrations_award_ambassador_points_trigger
  after insert or update of promotional_code_id on public.registrations
  for each row execute function public.trg_registrations_award_ambassador_points();

-- ---------------------------------------------------------------------------------------------
-- 8. Admin commands go through the same writer
-- ---------------------------------------------------------------------------------------------

-- Same signature as before. The correction is an audited delta on top of the ledger, so later
-- referrals and revocations keep composing with it.
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
begin
  if p_program_year < 2020 or p_program_year > 2100 then raise exception 'invalid program year'; end if;
  if p_total_points < 0 or p_recruits_open < 0 or p_recruits_ranked < 0 then raise exception 'point values cannot be negative'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'a correction reason is required'; end if;

  if exists (select 1 from public.ambassador_points_adjustments where idempotency_key = p_idempotency_key) then
    return public.ambassador_sync_points(p_ambassador_id, p_program_year);
  end if;

  v_current := public.ambassador_sync_points(p_ambassador_id, p_program_year);

  insert into public.ambassador_points_adjustments (
    ambassador_id, program_year, idempotency_key, reason, actor_profile_id,
    before_total_points, after_total_points, before_recruits_open, after_recruits_open,
    before_recruits_ranked, after_recruits_ranked
  ) values (
    p_ambassador_id, p_program_year, p_idempotency_key, trim(p_reason), p_actor_profile_id,
    v_current.total_points, p_total_points, v_current.recruits_open, p_recruits_open,
    v_current.recruits_ranked, p_recruits_ranked
  );

  v_current := public.ambassador_sync_points(p_ambassador_id, p_program_year);
  perform public.ambassador_reconcile_rewards(p_ambassador_id, p_program_year);
  return v_current;
end;
$$;

-- Credits a referral by hand (the buyer did not use the code). Idempotent per registration.
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
  v_year integer := extract(year from now() at time zone 'Europe/Paris')::integer;
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
  values (p_ambassador_id, v_order_id, p_registration_id, coalesce(p_race_format, v_ticket_format, 'open'), p_points, v_year)
  on conflict (ambassador_id, registration_id) do nothing;
  get diagnostics v_inserted = row_count;

  perform public.ambassador_sync_points(p_ambassador_id, v_year);
  perform public.ambassador_reconcile_rewards(p_ambassador_id, v_year);
  return v_inserted > 0;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 9. Grants: service role only
-- ---------------------------------------------------------------------------------------------

revoke all on function public.ambassador_sync_points(uuid, integer) from public, anon, authenticated;
revoke all on function public.ambassador_reconcile_rewards(uuid, integer) from public, anon, authenticated;
revoke all on function public.ambassador_ensure_rewards(uuid) from public, anon, authenticated;
revoke all on function public.award_ambassador_points_for_order(uuid) from public, anon, authenticated;
revoke all on function public.revoke_ambassador_points(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_adjust_ambassador_points(uuid, integer, integer, integer, integer, text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_credit_manual_referral(uuid, uuid, integer, text) from public, anon, authenticated;
revoke all on function public.trg_registrations_revoke_ambassador_points() from public, anon, authenticated;
revoke all on function public.trg_orders_revoke_ambassador_points() from public, anon, authenticated;
revoke all on function public.trg_orders_award_ambassador_points() from public, anon, authenticated;
revoke all on function public.trg_registrations_award_ambassador_points() from public, anon, authenticated;
revoke all on public.ambassador_rewards_over_granted from public, anon, authenticated;

grant execute on function public.ambassador_sync_points(uuid, integer) to service_role;
grant execute on function public.ambassador_reconcile_rewards(uuid, integer) to service_role;
grant execute on function public.ambassador_ensure_rewards(uuid) to service_role;
grant execute on function public.award_ambassador_points_for_order(uuid) to service_role;
grant execute on function public.revoke_ambassador_points(uuid, uuid, text) to service_role;
grant execute on function public.admin_adjust_ambassador_points(uuid, integer, integer, integer, integer, text, uuid, uuid) to service_role;
grant execute on function public.admin_credit_manual_referral(uuid, uuid, integer, text) to service_role;
grant select on public.ambassador_rewards_over_granted to service_role;
