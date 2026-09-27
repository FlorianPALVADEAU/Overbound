-- Annual, idempotent ambassador point attribution.
--
-- The annual rewards migration made ambassador_points_events.program_year NOT
-- NULL. The previous award RPC did not populate that column and only updated
-- the lifetime aggregate, so paid orders could no longer be awarded safely.
-- This replacement keeps the existing public signature and legacy aggregate,
-- while making ambassador_points_years the source of annual totals.
--
-- Rollback (manual, only if this migration must be reverted): restore the
-- previous body from 20260706_fix_ambassador_points_all_codes.sql. Do not drop
-- program_year: the annual schema depends on it.

create or replace function public.award_ambassador_points_for_order(p_order_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_program_year integer := extract(year from now() at time zone 'Europe/Paris')::integer;
  v_ambassador_id uuid;
begin
  if p_order_id is null then
    raise exception 'order id is required';
  end if;

  -- The unique (ambassador_id, registration_id) constraint makes retries and
  -- concurrent webhook deliveries no-ops. Only rows inserted by this call are
  -- aggregated below, so a retry cannot increment either aggregate twice.
  with registration_candidates as (
    select
      apc.ambassador_id,
      r.id as registration_id,
      p_order_id as order_id,
      case
        when t.operations_config ->> 'departure_mode' = 'fixed' then 'ranked'
        else 'open'
      end as race_format
    from public.registrations r
    join public.orders o on o.id = r.order_id
    join public.ambassador_promotional_codes apc
      on apc.promotional_code_id = r.promotional_code_id
    join public.ambassadors a
      on a.id = apc.ambassador_id
     and a.is_active = true
    left join public.tickets t on t.id = r.ticket_id
    where r.order_id = p_order_id
      and lower(coalesce(o.status, '')) = 'paid'
      and r.promotional_code_id is not null
  ), inserted_events as (
    insert into public.ambassador_points_events (
      ambassador_id,
      order_id,
      registration_id,
      race_format,
      points,
      program_year
    )
    select
      candidate.ambassador_id,
      candidate.order_id,
      candidate.registration_id,
      candidate.race_format,
      case when candidate.race_format = 'ranked' then 2 else 1 end,
      v_program_year
    from registration_candidates candidate
    on conflict (ambassador_id, registration_id) do nothing
    returning ambassador_id, points, race_format, program_year
  ), grouped as (
    select
      ambassador_id,
      program_year,
      sum(points)::integer as delta_points,
      count(*) filter (where lower(race_format) = 'open')::integer as delta_open,
      count(*) filter (where lower(race_format) = 'ranked')::integer as delta_ranked
    from inserted_events
    group by ambassador_id, program_year
  )
  insert into public.ambassador_points_years (
    ambassador_id,
    program_year,
    total_points,
    recruits_open,
    recruits_ranked,
    current_reward_level,
    updated_at
  )
  select
    grouped.ambassador_id,
    grouped.program_year,
    grouped.delta_points,
    grouped.delta_open,
    grouped.delta_ranked,
    public.ambassador_reward_level_for_points(grouped.delta_points),
    now()
  from grouped
  on conflict (ambassador_id, program_year) do update
  set total_points = public.ambassador_points_years.total_points + excluded.total_points,
      recruits_open = public.ambassador_points_years.recruits_open + excluded.recruits_open,
      recruits_ranked = public.ambassador_points_years.recruits_ranked + excluded.recruits_ranked,
      current_reward_level = public.ambassador_reward_level_for_points(
        public.ambassador_points_years.total_points + excluded.total_points
      ),
      updated_at = now();

  -- Keep the pre-annual aggregate in sync for existing consumers. Recompute
  -- lifetime totals from the event ledger for ambassadors on this order,
  -- rather than adding a guessed delta: this remains correct on retries and
  -- concurrent webhook deliveries.
  with affected_ambassadors as (
    select distinct ambassador_id
    from public.ambassador_points_events
    where order_id = p_order_id
  ), grouped as (
    select
      events.ambassador_id,
      sum(points)::integer as delta_points,
      count(*) filter (where lower(race_format) = 'open')::integer as delta_open,
      count(*) filter (where lower(race_format) = 'ranked')::integer as delta_ranked
    from public.ambassador_points_events events
    join affected_ambassadors affected
      on affected.ambassador_id = events.ambassador_id
    group by events.ambassador_id
  )
  insert into public.ambassador_points (
    ambassador_id,
    total_points,
    recruits_open,
    recruits_ranked,
    current_reward_level,
    updated_at
  )
  select
    grouped.ambassador_id,
    grouped.delta_points,
    grouped.delta_open,
    grouped.delta_ranked,
    public.ambassador_reward_level_for_points(grouped.delta_points),
    now()
  from grouped
  on conflict (ambassador_id) do update
  set total_points = excluded.total_points,
      recruits_open = excluded.recruits_open,
      recruits_ranked = excluded.recruits_ranked,
      current_reward_level = public.ambassador_reward_level_for_points(
        excluded.total_points
      ),
      updated_at = now();

  -- Materialise any newly reached reward levels in the same transaction so
  -- the notification worker can observe them immediately after attribution.
  for v_ambassador_id in
    select distinct ambassador_id
    from public.ambassador_points_events
    where order_id = p_order_id
  loop
    perform public.ambassador_ensure_rewards(v_ambassador_id);
  end loop;
end;
$$;

comment on function public.award_ambassador_points_for_order(uuid) is
  'Idempotently attributes paid-order ambassador points to the Europe/Paris calendar year and keeps annual and lifetime aggregates in sync.';
