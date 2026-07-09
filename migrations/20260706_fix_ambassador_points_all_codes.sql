-- Migration: award ambassador points for ANY assigned promo code, not just the current one
--
-- Bug: award_ambassador_points_for_order() joined registrations.promotional_code_id
-- against ambassadors.promotional_code_id (a single scalar column that only ever
-- holds the "current" code). Every time an admin activated a new code for an
-- ambassador, the previously active code became permanently invisible to points
-- awarding — even though it stayed valid at checkout (promo validation never
-- checks is_current). Result: registrations paid with a non-current ambassador
-- code silently earned zero points.
--
-- Fix: join through ambassador_promotional_codes (any row for the ambassador,
-- regardless of is_current) instead of the ambassadors.promotional_code_id scalar.
--
-- Run this in Supabase SQL editor (Dashboard -> SQL Editor).

CREATE OR REPLACE FUNCTION "public"."award_ambassador_points_for_order"("p_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  with registration_candidates as (
    select
      apc.ambassador_id as ambassador_id,
      r.id as registration_id,
      p_order_id as order_id,
      case
        when lower(coalesce(t.race_format, '')) = 'ranked'
          or lower(coalesce(t.name, '')) like '%ranked%'
          or lower(coalesce(rc.name, '')) like '%ranked%'
        then 'ranked'
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
    left join public.races rc on rc.id = t.race_id
    where r.order_id = p_order_id
      and lower(coalesce(o.status, '')) = 'paid'
      and r.promotional_code_id is not null
  ),
  inserted_events as (
    insert into public.ambassador_points_events (
      ambassador_id,
      order_id,
      registration_id,
      points,
      race_format
    )
    select
      rc.ambassador_id,
      rc.order_id,
      rc.registration_id,
      case when rc.race_format = 'ranked' then 2 else 1 end as points,
      rc.race_format
    from registration_candidates rc
    on conflict (ambassador_id, registration_id) do nothing
    returning ambassador_id, points, race_format
  ),
  grouped as (
    select
      ie.ambassador_id,
      sum(ie.points)::int as delta_points,
      count(*) filter (where ie.race_format = 'open')::int as delta_open,
      count(*) filter (where ie.race_format = 'ranked')::int as delta_ranked
    from inserted_events ie
    group by ie.ambassador_id
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
    g.ambassador_id,
    g.delta_points,
    g.delta_open,
    g.delta_ranked,
    public.ambassador_reward_level_for_points(g.delta_points),
    now()
  from grouped g
  on conflict (ambassador_id) do update
  set
    total_points = public.ambassador_points.total_points + excluded.total_points,
    recruits_open = public.ambassador_points.recruits_open + excluded.recruits_open,
    recruits_ranked = public.ambassador_points.recruits_ranked + excluded.recruits_ranked,
    current_reward_level = public.ambassador_reward_level_for_points(
      public.ambassador_points.total_points + excluded.total_points
    ),
    updated_at = now();
end;
$$;

-- Backfill: re-run the fixed function for every paid order whose registrations
-- used an ambassador code (current or not) but never got an ambassador_points_events
-- row. The function's own ON CONFLICT (ambassador_id, registration_id) DO NOTHING
-- makes this safe to run repeatedly and safe against double-crediting orders that
-- already earned points via a code that was current at the time.
do $$
declare
  v_order_id uuid;
begin
  for v_order_id in
    select distinct r.order_id
    from public.registrations r
    join public.orders o on o.id = r.order_id
    join public.ambassador_promotional_codes apc
      on apc.promotional_code_id = r.promotional_code_id
    join public.ambassadors a
      on a.id = apc.ambassador_id
     and a.is_active = true
    left join public.ambassador_points_events ape
      on ape.ambassador_id = apc.ambassador_id
     and ape.registration_id = r.id
    where lower(coalesce(o.status, '')) = 'paid'
      and r.promotional_code_id is not null
      and ape.id is null
  loop
    perform public.award_ambassador_points_for_order(v_order_id);
  end loop;
end;
$$;
