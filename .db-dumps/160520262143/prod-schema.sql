


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."admin_overview_safe"() RETURNS TABLE("events_count" bigint, "registrations_count" bigint, "revenue_cents_paid" bigint, "last_registration_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  is_admin boolean;
begin
  -- Garde-fou : seul un admin (selon table profiles) ou un token service_role peut appeler
  is_admin := exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) or (coalesce(auth.jwt() ->> 'role','') = 'service_role');

  if not is_admin then
    raise exception 'forbidden';
  end if;

  return query
  select
    (select count(*)::bigint from public.events) as events_count,
    (select count(*)::bigint from public.registrations) as registrations_count,
    (select coalesce(sum(amount_total)::bigint,0)
       from public.orders
      where status = 'paid') as revenue_cents_paid,
    (select max(created_at) from public.registrations) as last_registration_at;
end;
$$;


ALTER FUNCTION "public"."admin_overview_safe"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ambassador_ensure_rewards"("p_ambassador_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_total_points integer := 0;
begin
  select coalesce(ap.total_points, 0)
  into v_total_points
  from public.ambassador_points ap
  where ap.ambassador_id = p_ambassador_id;

  insert into public.ambassador_rewards (
    ambassador_id,
    reward_level,
    reward_name,
    status,
    earned_at,
    updated_at
  )
  select
    p_ambassador_id,
    c.reward_level,
    c.reward_name,
    'earned',
    now(),
    now()
  from (
    values
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
  ) as c(reward_level, points_required, reward_name)
  where v_total_points >= c.points_required
  on conflict (ambassador_id, reward_level) do update
    set reward_name = excluded.reward_name;
end;
$$;


ALTER FUNCTION "public"."ambassador_ensure_rewards"("p_ambassador_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ambassador_ensure_rewards"("p_ambassador_id" "uuid", "p_edition" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_total int := 0;
begin
  select total_points
  into v_total
  from ambassador_points
  where ambassador_id = p_ambassador_id
    and edition = p_edition;

  v_total := coalesce(v_total, 0);

  insert into ambassador_rewards (ambassador_id, edition, reward_level, reward_name, status, earned_at)
  select p_ambassador_id, p_edition, level_id, reward_name, 'earned', now()
  from (
    values
      (1, 5, 'T-shirt ambassadeur'),
      (2, 10, 'Dossard Open offert'),
      (3, 20, 'Dossard Ranked offert'),
      (4, 35, 'Pack VIP (file prioritaire + badge + mention officielle)'),
      (5, 50, 'Dossard offert edition suivante')
  ) as levels(level_id, points_required, reward_name)
  where v_total >= points_required
  on conflict (ambassador_id, edition, reward_level) do nothing;
end;
$$;


ALTER FUNCTION "public"."ambassador_ensure_rewards"("p_ambassador_id" "uuid", "p_edition" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ambassador_points_for_format"("p_format" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
  select case
    when lower(coalesce(p_format, 'open')) = 'ranked' then 2
    else 1
  end
$$;


ALTER FUNCTION "public"."ambassador_points_for_format"("p_format" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ambassador_reward_level_for_points"("p_total_points" integer) RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select case
    when coalesce(p_total_points, 0) >= 30 then 10
    when coalesce(p_total_points, 0) >= 25 then 9
    when coalesce(p_total_points, 0) >= 20 then 8
    when coalesce(p_total_points, 0) >= 15 then 7
    when coalesce(p_total_points, 0) >= 10 then 6
    when coalesce(p_total_points, 0) >= 8 then 5
    when coalesce(p_total_points, 0) >= 5 then 4
    when coalesce(p_total_points, 0) >= 3 then 3
    when coalesce(p_total_points, 0) >= 2 then 2
    when coalesce(p_total_points, 0) >= 1 then 1
    else 0
  end;
$$;


ALTER FUNCTION "public"."ambassador_reward_level_for_points"("p_total_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ambassador_sync_points"("p_ambassador_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_total int := 0;
  v_open int := 0;
  v_ranked int := 0;
begin
  select
    coalesce(sum(points), 0),
    count(*) filter (where race_format = 'open'),
    count(*) filter (where race_format = 'ranked')
  into v_total, v_open, v_ranked
  from ambassador_points_events
  where ambassador_id = p_ambassador_id;

  insert into ambassador_points (
    ambassador_id,
    total_points,
    recruits_open,
    recruits_ranked,
    current_reward_level,
    updated_at
  ) values (
    p_ambassador_id,
    v_total,
    v_open,
    v_ranked,
    ambassador_reward_level_for_points(v_total),
    now()
  )
  on conflict (ambassador_id)
  do update
    set total_points = excluded.total_points,
        recruits_open = excluded.recruits_open,
        recruits_ranked = excluded.recruits_ranked,
        current_reward_level = excluded.current_reward_level,
        updated_at = now();
end;
$$;


ALTER FUNCTION "public"."ambassador_sync_points"("p_ambassador_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ambassador_sync_points"("p_ambassador_id" "uuid", "p_edition" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_total int := 0;
  v_open int := 0;
  v_ranked int := 0;
begin
  select
    coalesce(sum(points), 0),
    count(*) filter (where race_format = 'open'),
    count(*) filter (where race_format = 'ranked')
  into v_total, v_open, v_ranked
  from ambassador_points_events
  where ambassador_id = p_ambassador_id
    and edition = p_edition;

  insert into ambassador_points (
    ambassador_id,
    edition,
    total_points,
    recruits_open,
    recruits_ranked,
    current_reward_level,
    updated_at
  ) values (
    p_ambassador_id,
    p_edition,
    v_total,
    v_open,
    v_ranked,
    ambassador_reward_level_for_points(v_total),
    now()
  )
  on conflict (ambassador_id, edition)
  do update
    set total_points = excluded.total_points,
        recruits_open = excluded.recruits_open,
        recruits_ranked = excluded.recruits_ranked,
        current_reward_level = excluded.current_reward_level,
        updated_at = now();
end;
$$;


ALTER FUNCTION "public"."ambassador_sync_points"("p_ambassador_id" "uuid", "p_edition" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_open_wave_to_order"("p_event_id" "uuid", "p_order_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer) RETURNS TABLE("out_wave_index" integer, "out_start_time" timestamp with time zone, "out_wave_capacity" integer, "out_assigned_count" integer, "out_order_size" integer)
    LANGUAGE "plpgsql"
    AS $$
declare
  v_idx integer;
  start_at timestamptz;
  allocation record;
  v_order_size integer;
begin
  if p_wave_count is null or p_wave_count <= 0 then
    raise exception 'wave_count_invalid';
  end if;

  select count(*)
    into v_order_size
  from public.registrations
  where order_id = p_order_id
    and event_id = p_event_id;

  if v_order_size is null or v_order_size = 0 then
    raise exception 'order_not_found';
  end if;

  if v_order_size > 10 then
    raise exception 'order_too_large_manual';
  end if;

  for v_idx in 1..p_wave_count loop
    start_at := p_first_departure + ((v_idx - 1) * (p_interval_minutes || ' minutes')::interval);
    insert into public.event_waves (event_id, wave_index, start_time, capacity)
    values (p_event_id, v_idx, start_at, p_default_capacity)
    on conflict on constraint event_waves_event_wave_index do nothing;
  end loop;

  with candidate as (
    select event_id, wave_index
    from public.event_waves
    where event_id = p_event_id
      and is_closed = false
      and assigned_count + v_order_size <= capacity
    order by (assigned_count + v_order_size)::float / nullif(capacity, 0) asc,
             start_time asc
    limit 1
    for update skip locked
  )
  update public.event_waves as ew
    set assigned_count = ew.assigned_count + v_order_size,
        updated_at = now()
  from candidate
  where ew.event_id = candidate.event_id
    and ew.wave_index = candidate.wave_index
  returning ew.wave_index, ew.start_time, ew.capacity, ew.assigned_count into allocation;

  if not found then
    raise exception 'no_slot_for_order';
  end if;

  update public.registrations as r
    set start_time = allocation.start_time,
        wave_index = allocation.wave_index,
        wave_capacity = allocation.capacity,
        wave_position = null,
        auto_assigned = true
  where r.order_id = p_order_id
    and r.event_id = p_event_id;

  out_wave_index := allocation.wave_index;
  out_start_time := allocation.start_time;
  out_wave_capacity := allocation.capacity;
  out_assigned_count := allocation.assigned_count;
  out_order_size := v_order_size;
  return next;
  return;
end;
$$;


ALTER FUNCTION "public"."assign_open_wave_to_order"("p_event_id" "uuid", "p_order_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_open_wave_to_registration"("p_event_id" "uuid", "p_registration_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer) RETURNS TABLE("wave_index" integer, "start_time" timestamp with time zone, "wave_capacity" integer, "wave_position" integer)
    LANGUAGE "plpgsql"
    AS $$
declare
  idx integer;
  allocation record;
  start_at timestamptz;
begin
  if p_wave_count is null or p_wave_count <= 0 then
    raise exception 'wave_count_invalid';
  end if;

  for idx in 1..p_wave_count loop
    start_at := p_first_departure + ((idx - 1) * (p_interval_minutes || ' minutes')::interval);
    insert into public.event_waves (event_id, wave_index, start_time, capacity)
    values (p_event_id, idx, start_at, p_default_capacity)
    on conflict (event_id, wave_index) do nothing;
  end loop;

  for idx in 1..p_wave_count loop
    update public.event_waves
      set assigned_count = assigned_count + 1,
          updated_at = now()
    where event_id = p_event_id
      and wave_index = idx
      and is_closed = false
      and assigned_count < capacity
    returning wave_index, start_time, capacity, assigned_count into allocation;

    if found then
      update public.registrations
        set start_time = allocation.start_time,
            wave_index = allocation.wave_index,
            wave_capacity = allocation.capacity,
            wave_position = allocation.assigned_count,
            auto_assigned = true
      where id = p_registration_id;

      wave_index := allocation.wave_index;
      start_time := allocation.start_time;
      wave_capacity := allocation.capacity;
      wave_position := allocation.assigned_count;
      return next;
      return;
    end if;
  end loop;

  raise exception 'no_available_wave';
end;
$$;


ALTER FUNCTION "public"."assign_open_wave_to_registration"("p_event_id" "uuid", "p_registration_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_open_wave_to_registration"("p_event_id" "uuid", "p_registration_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer, "p_preferred_start" timestamp with time zone, "p_preferred_end" timestamp with time zone, "p_latest_allowed" timestamp with time zone) RETURNS TABLE("out_wave_index" integer, "out_start_time" timestamp with time zone, "out_wave_capacity" integer, "out_wave_position" integer, "out_assignment_constraint_breached" boolean, "out_preferred_window_start" timestamp with time zone, "out_preferred_window_end" timestamp with time zone, "out_latest_allowed_time" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
declare
  v_idx integer;
  allocation record;
  start_at timestamptz;
  breach boolean := false;
begin
  if p_wave_count is null or p_wave_count <= 0 then
    raise exception 'wave_count_invalid';
  end if;

  for v_idx in 1..p_wave_count loop
    start_at := p_first_departure + ((v_idx - 1) * (p_interval_minutes || ' minutes')::interval);
    insert into public.event_waves (event_id, wave_index, start_time, capacity)
    values (p_event_id, v_idx, start_at, p_default_capacity)
    on conflict on constraint event_waves_event_wave_index do nothing;
  end loop;

  with candidate as (
    select event_id, wave_index
    from public.event_waves
    where event_id = p_event_id
      and is_closed = false
      and assigned_count < capacity
      and start_time >= p_preferred_start
      and start_time <= p_preferred_end
      and start_time <= p_latest_allowed
    order by assigned_count asc, start_time asc
    limit 1
    for update skip locked
  )
  update public.event_waves as ew
    set assigned_count = ew.assigned_count + 1,
        updated_at = now()
  from candidate
  where ew.event_id = candidate.event_id
    and ew.wave_index = candidate.wave_index
  returning ew.wave_index, ew.start_time, ew.capacity, ew.assigned_count into allocation;

  if not found then
    with candidate as (
      select event_id, wave_index
      from public.event_waves
      where event_id = p_event_id
        and is_closed = false
        and assigned_count < capacity
        and start_time <= p_latest_allowed
      order by assigned_count asc, start_time asc
      limit 1
      for update skip locked
    )
    update public.event_waves as ew
      set assigned_count = ew.assigned_count + 1,
          updated_at = now()
    from candidate
    where ew.event_id = candidate.event_id
      and ew.wave_index = candidate.wave_index
    returning ew.wave_index, ew.start_time, ew.capacity, ew.assigned_count into allocation;
  end if;

  if not found then
    breach := true;
    with candidate as (
      select event_id, wave_index
      from public.event_waves
      where event_id = p_event_id
        and is_closed = false
        and assigned_count < capacity
      order by assigned_count asc, start_time asc
      limit 1
      for update skip locked
    )
    update public.event_waves as ew
      set assigned_count = ew.assigned_count + 1,
          updated_at = now()
    from candidate
    where ew.event_id = candidate.event_id
      and ew.wave_index = candidate.wave_index
    returning ew.wave_index, ew.start_time, ew.capacity, ew.assigned_count into allocation;
  end if;

  if not found then
    raise exception 'no_available_wave';
  end if;

  update public.registrations as r
    set start_time = allocation.start_time,
        wave_index = allocation.wave_index,
        wave_capacity = allocation.capacity,
        wave_position = allocation.assigned_count,
        auto_assigned = true,
        preferred_window_start = p_preferred_start,
        preferred_window_end = p_preferred_end,
        latest_allowed_time = p_latest_allowed,
        assignment_constraint_breached = breach
  where r.id = p_registration_id;

  out_wave_index := allocation.wave_index;
  out_start_time := allocation.start_time;
  out_wave_capacity := allocation.capacity;
  out_wave_position := allocation.assigned_count;
  out_assignment_constraint_breached := breach;
  out_preferred_window_start := p_preferred_start;
  out_preferred_window_end := p_preferred_end;
  out_latest_allowed_time := p_latest_allowed;
  return next;
  return;
end;
$$;


ALTER FUNCTION "public"."assign_open_wave_to_registration"("p_event_id" "uuid", "p_registration_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer, "p_preferred_start" timestamp with time zone, "p_preferred_end" timestamp with time zone, "p_latest_allowed" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_ambassador_points_for_order"("p_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  with registration_candidates as (
    select
      a.id as ambassador_id,
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
    join public.ambassadors a
      on a.promotional_code_id = r.promotional_code_id
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


ALTER FUNCTION "public"."award_ambassador_points_for_order"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_advance_tier_progression"("p_event_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_code RECORD;
  v_next_code RECORD;
  v_should_advance BOOLEAN := FALSE;
  v_result JSON;
BEGIN
  -- Get current active tier code
  SELECT * INTO v_current_code
  FROM promotional_codes pc
  INNER JOIN promotional_code_events pce ON pc.id = pce.promotional_code_id
  WHERE pce.event_id = p_event_id
    AND pc.is_active = TRUE
    AND pc.tier_order IS NOT NULL
  ORDER BY pc.tier_order ASC
  LIMIT 1;

  -- If no current code, nothing to do
  IF v_current_code IS NULL THEN
    RETURN json_build_object(
      'action', 'none',
      'message', 'No active tier code found'
    );
  END IF;

  -- Check if current code should be deactivated
  -- Condition 1: Date expired
  IF NOW() >= v_current_code.valid_until THEN
    v_should_advance := TRUE;
  END IF;

  -- Condition 2: Usage limit reached
  IF v_current_code.usage_limit IS NOT NULL
     AND v_current_code.used_count >= v_current_code.usage_limit THEN
    v_should_advance := TRUE;
  END IF;

  -- If should not advance, return current state
  IF NOT v_should_advance THEN
    RETURN json_build_object(
      'action', 'none',
      'message', 'Current tier still active',
      'current_code', v_current_code.code,
      'used_count', v_current_code.used_count,
      'usage_limit', v_current_code.usage_limit
    );
  END IF;

  -- Get next tier code
  SELECT * INTO v_next_code
  FROM promotional_codes pc
  INNER JOIN promotional_code_events pce ON pc.id = pce.promotional_code_id
  WHERE pce.event_id = p_event_id
    AND pc.tier_order IS NOT NULL
    AND pc.tier_order > v_current_code.tier_order
    AND pc.auto_activate = TRUE
  ORDER BY pc.tier_order ASC
  LIMIT 1;

  -- Deactivate current code
  UPDATE promotional_codes
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE id = v_current_code.id;

  -- If there's a next code, activate it
  IF v_next_code IS NOT NULL THEN
    UPDATE promotional_codes
    SET is_active = TRUE,
        updated_at = NOW()
    WHERE id = v_next_code.id;

    RETURN json_build_object(
      'action', 'advanced',
      'message', 'Tier progression completed',
      'deactivated_code', v_current_code.code,
      'activated_code', v_next_code.code,
      'reason', CASE
        WHEN NOW() >= v_current_code.valid_until THEN 'date_expired'
        WHEN v_current_code.used_count >= v_current_code.usage_limit THEN 'usage_limit_reached'
        ELSE 'unknown'
      END
    );
  ELSE
    -- No next tier, just deactivate current
    RETURN json_build_object(
      'action', 'deactivated',
      'message', 'Final tier reached, no next tier available',
      'deactivated_code', v_current_code.code
    );
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'action', 'error',
      'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."check_and_advance_tier_progression"("p_event_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_and_advance_tier_progression"("p_event_id" "uuid") IS 'Checks if current tier code should be deactivated and advances to next tier if conditions are met (date expired or usage limit reached).';



CREATE OR REPLACE FUNCTION "public"."create_notification_preferences_for_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Create notification preferences with default values
  INSERT INTO public.notification_preferences (
    user_id,
    events_announcements,
    price_alerts,
    news_blog,
    volunteers_opportunities,
    partner_offers,
    digest_frequency
  )
  VALUES (
    NEW.id,
    true,  -- events_announcements enabled by default
    true,  -- price_alerts enabled by default
    false, -- news_blog disabled by default
    false, -- volunteers_opportunities disabled by default
    false, -- partner_offers disabled by default
    'immediate' -- immediate digest by default
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_notification_preferences_for_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_single_promocode_per_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_existing uuid;
begin
  if new.order_id is null then
    return new;
  end if;

  select r.promotional_code_id
  into v_existing
  from registrations r
  where r.order_id = new.order_id
    and r.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  limit 1;

  if found and coalesce(v_existing, '00000000-0000-0000-0000-000000000000'::uuid)
      <> coalesce(new.promotional_code_id, '00000000-0000-0000-0000-000000000000'::uuid) then
    raise exception 'Une seule source de code promotionnel est autorisee par commande.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_single_promocode_per_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_bootcamps_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_bootcamps_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_tier_promo_code"("p_event_id" "uuid") RETURNS TABLE("id" "uuid", "code" "text", "name" "text", "discount_percent" numeric, "valid_until" timestamp with time zone, "usage_limit" integer, "used_count" integer, "tier_order" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.code,
    pc.name,
    pc.discount_percent,
    pc.valid_until,
    pc.usage_limit,
    pc.used_count,
    pc.tier_order
  FROM promotional_codes pc
  INNER JOIN promotional_code_events pce ON pc.id = pce.promotional_code_id
  WHERE pce.event_id = p_event_id
    AND pc.is_active = TRUE
    AND pc.tier_order IS NOT NULL
    AND NOW() >= pc.valid_from
    AND NOW() < pc.valid_until
    AND (pc.usage_limit IS NULL OR pc.used_count < pc.usage_limit)
  ORDER BY pc.tier_order ASC
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_active_tier_promo_code"("p_event_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_active_tier_promo_code"("p_event_id" "uuid") IS 'Returns the currently active tier-based promo code for an event based on tier_order, dates, and usage limits.';



CREATE OR REPLACE FUNCTION "public"."get_list_subscriber_count"("list_uuid" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.list_subscriptions
  WHERE list_id = list_uuid AND subscribed = true;
$$;


ALTER FUNCTION "public"."get_list_subscriber_count"("list_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_notification_preferences"("p_user_id" "uuid") RETURNS TABLE("pref_id" "uuid", "pref_user_id" "uuid", "events_announcements" boolean, "price_alerts" boolean, "news_blog" boolean, "volunteers_opportunities" boolean, "partner_offers" boolean, "digest_frequency" "text", "registration_confirmations" boolean, "ticket_updates" boolean, "account_security" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Insert if not exists
  INSERT INTO public.notification_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Return the preferences
  RETURN QUERY
  SELECT
    np.id AS pref_id,
    np.user_id AS pref_user_id,
    np.events_announcements,
    np.price_alerts,
    np.news_blog,
    np.volunteers_opportunities,
    np.partner_offers,
    np.digest_frequency,
    np.registration_confirmations,
    np.ticket_updates,
    np.account_security,
    np.created_at,
    np.updated_at
  FROM public.notification_preferences np
  WHERE np.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_notification_preferences"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_registrations_with_filters"("args" "jsonb") RETURNS TABLE("id" "uuid", "user_id" "uuid", "email" "text", "checked_in" boolean, "claim_status" "text", "qr_code_token" "text", "created_at" timestamp with time zone, "difficulty_level" "text", "ticket_id" "uuid", "event_id" "uuid", "order_id" "uuid", "approval_status" "text", "approved_at" timestamp with time zone, "approved_by" "uuid", "rejection_reason" "text", "document_url" "text", "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  approval_param text := args->>'approval';
  event_id_param uuid := (args->>'event_id')::uuid;
  search_param text := args->>'search';
  limit_param int := (args->>'limit')::int;
  offset_param int := (args->>'offset')::int;
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    r.email,
    r.checked_in,
    r.claim_status,
    r.qr_code_token,
    r.created_at,
    r.difficulty_level,  -- ⬅️ AJOUT DU CHAMP
    r.ticket_id,
    t.event_id,
    r.order_id,
    r.approval_status,
    r.approved_at,
    r.approved_by,
    r.rejection_reason,
    r.document_url,
    COUNT(*) OVER() as total_count
  FROM registrations r
  LEFT JOIN tickets t ON r.ticket_id = t.id
  WHERE
    (approval_param IS NULL OR r.approval_status = approval_param)
    AND (event_id_param IS NULL OR t.event_id = event_id_param)
    AND (
      search_param IS NULL
      OR r.email ILIKE '%' || search_param || '%'
      OR r.id::text ILIKE '%' || search_param || '%'
    )
  ORDER BY r.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;


ALTER FUNCTION "public"."get_registrations_with_filters"("args" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    'user'
  )
  on conflict (id) do nothing; -- évite l'erreur si ré-exécuté
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_promo_code_usage"("promo_code_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE promotional_codes
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = promo_code_id;
END;
$$;


ALTER FUNCTION "public"."increment_promo_code_usage"("promo_code_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."increment_promo_code_usage"("promo_code_id" "uuid") IS 'Atomically increments the used_count for a promotional code. Called after successful registration.';



CREATE OR REPLACE FUNCTION "public"."is_user_subscribed"("user_uuid" "uuid", "list_uuid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT subscribed FROM public.list_subscriptions
     WHERE user_id = user_uuid AND list_id = list_uuid),
    false
  );
$$;


ALTER FUNCTION "public"."is_user_subscribed"("user_uuid" "uuid", "list_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."manage_subscription_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Si l'utilisateur s'abonne (subscribed passe à true)
  IF NEW.subscribed = true AND (OLD.subscribed IS NULL OR OLD.subscribed = false) THEN
    NEW.subscribed_at = NOW();
    NEW.unsubscribed_at = NULL;
  END IF;

  -- Si l'utilisateur se désabonne (subscribed passe à false)
  IF NEW.subscribed = false AND OLD.subscribed = true THEN
    NEW.unsubscribed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."manage_subscription_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."merge_email_subscriptions_to_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Récupérer l'email depuis auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  IF user_email IS NOT NULL THEN
    -- Mettre à jour les subscriptions existantes avec cet email
    UPDATE list_subscriptions
    SET
      user_id = NEW.id,
      full_name = COALESCE(NEW.full_name, full_name),
      email = NULL  -- On efface l'email car on a maintenant le user_id
    WHERE
      lower(email) = lower(user_email)
      AND user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."merge_email_subscriptions_to_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."merge_list_subscriptions_before_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  normalized_email text;
  auth_email text;
  existing_user_sub_id uuid;
  anon_subscribed boolean;
  anon_subscribed_at timestamptz;
BEGIN
  -- Always normalize incoming email when present.
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;

  -- Case 1: authenticated/user-based insert.
  IF NEW.user_id IS NOT NULL THEN
    SELECT lower(trim(u.email))
    INTO auth_email
    FROM auth.users u
    WHERE u.id = NEW.user_id;

    normalized_email := COALESCE(NEW.email, auth_email);

    -- Read current user subscription for this list if it already exists.
    SELECT ls.id
    INTO existing_user_sub_id
    FROM public.list_subscriptions ls
    WHERE ls.list_id = NEW.list_id
      AND ls.user_id = NEW.user_id
    LIMIT 1
    FOR UPDATE;

    -- Aggregate anonymous subscription state for same list+email.
    IF normalized_email IS NOT NULL THEN
      SELECT
        bool_or(COALESCE(ls.subscribed, false)),
        min(ls.subscribed_at)
      INTO
        anon_subscribed,
        anon_subscribed_at
      FROM public.list_subscriptions ls
      WHERE ls.list_id = NEW.list_id
        AND ls.user_id IS NULL
        AND ls.email IS NOT NULL
        AND lower(trim(ls.email)) = normalized_email;
    ELSE
      anon_subscribed := false;
      anon_subscribed_at := NULL;
    END IF;

    -- If user row already exists, merge and keep it.
    IF existing_user_sub_id IS NOT NULL THEN
      UPDATE public.list_subscriptions ls
      SET
        subscribed = COALESCE(ls.subscribed, false) OR COALESCE(NEW.subscribed, false) OR COALESCE(anon_subscribed, false),
        subscribed_at = COALESCE(ls.subscribed_at, NEW.subscribed_at, anon_subscribed_at, now()),
        unsubscribed_at = CASE
          WHEN (COALESCE(ls.subscribed, false) OR COALESCE(NEW.subscribed, false) OR COALESCE(anon_subscribed, false)) THEN NULL
          ELSE COALESCE(ls.unsubscribed_at, NEW.unsubscribed_at, now())
        END,
        updated_at = now()
      WHERE ls.id = existing_user_sub_id;

      -- Delete temporary anonymous rows for same list+email.
      IF normalized_email IS NOT NULL THEN
        DELETE FROM public.list_subscriptions ls
        WHERE ls.list_id = NEW.list_id
          AND ls.user_id IS NULL
          AND ls.email IS NOT NULL
          AND lower(trim(ls.email)) = normalized_email;
      END IF;

      RETURN NULL;
    END IF;

    -- No user row yet: remove temporary anonymous rows, then allow NEW insert.
    IF normalized_email IS NOT NULL THEN
      DELETE FROM public.list_subscriptions ls
      WHERE ls.list_id = NEW.list_id
        AND ls.user_id IS NULL
        AND ls.email IS NOT NULL
        AND lower(trim(ls.email)) = normalized_email;
    END IF;

    -- For authenticated rows, keep identity via user_id only.
    NEW.email := NULL;
    NEW.full_name := NULL;
    NEW.subscribed := COALESCE(NEW.subscribed, false) OR COALESCE(anon_subscribed, false);
    NEW.subscribed_at := COALESCE(NEW.subscribed_at, anon_subscribed_at, now());
    IF NEW.subscribed THEN
      NEW.unsubscribed_at := NULL;
    ELSE
      NEW.unsubscribed_at := COALESCE(NEW.unsubscribed_at, now());
    END IF;

    RETURN NEW;
  END IF;

  -- Case 2: anonymous/email-based insert. Deduplicate by (list_id, normalized email).
  IF NEW.email IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.list_subscriptions ls
      WHERE ls.list_id = NEW.list_id
        AND ls.user_id IS NULL
        AND ls.email IS NOT NULL
        AND lower(trim(ls.email)) = NEW.email
      FOR UPDATE
    ) THEN
      UPDATE public.list_subscriptions ls
      SET
        full_name = COALESCE(ls.full_name, NEW.full_name),
        subscribed = COALESCE(ls.subscribed, false) OR COALESCE(NEW.subscribed, false),
        subscribed_at = COALESCE(ls.subscribed_at, NEW.subscribed_at, now()),
        unsubscribed_at = CASE
          WHEN (COALESCE(ls.subscribed, false) OR COALESCE(NEW.subscribed, false)) THEN NULL
          ELSE COALESCE(ls.unsubscribed_at, NEW.unsubscribed_at, now())
        END,
        updated_at = now()
      WHERE ls.list_id = NEW.list_id
        AND ls.user_id IS NULL
        AND ls.email IS NOT NULL
        AND lower(trim(ls.email)) = NEW.email;

      RETURN NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."merge_list_subscriptions_before_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_site_promotions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;


ALTER FUNCTION "public"."set_site_promotions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_notification_prefs_to_lists"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_list_id UUID;
BEGIN
  -- Sync events_announcements with events-announcements list
  IF (OLD IS NULL) OR (NEW.events_announcements IS DISTINCT FROM OLD.events_announcements) THEN
    SELECT id INTO v_list_id FROM public.distribution_lists WHERE slug = 'events-announcements';
    IF v_list_id IS NOT NULL THEN
      INSERT INTO public.list_subscriptions (user_id, list_id, subscribed)
      VALUES (NEW.user_id, v_list_id, NEW.events_announcements)
      ON CONFLICT (user_id, list_id)
      DO UPDATE SET subscribed = NEW.events_announcements, updated_at = NOW();
    END IF;
  END IF;

  -- Sync price_alerts with price-alerts list
  IF (OLD IS NULL) OR (NEW.price_alerts IS DISTINCT FROM OLD.price_alerts) THEN
    SELECT id INTO v_list_id FROM public.distribution_lists WHERE slug = 'price-alerts';
    IF v_list_id IS NOT NULL THEN
      INSERT INTO public.list_subscriptions (user_id, list_id, subscribed)
      VALUES (NEW.user_id, v_list_id, NEW.price_alerts)
      ON CONFLICT (user_id, list_id)
      DO UPDATE SET subscribed = NEW.price_alerts, updated_at = NOW();
    END IF;
  END IF;

  -- Sync news_blog with news-blog list
  IF (OLD IS NULL) OR (NEW.news_blog IS DISTINCT FROM OLD.news_blog) THEN
    SELECT id INTO v_list_id FROM public.distribution_lists WHERE slug = 'news-blog';
    IF v_list_id IS NOT NULL THEN
      INSERT INTO public.list_subscriptions (user_id, list_id, subscribed)
      VALUES (NEW.user_id, v_list_id, NEW.news_blog)
      ON CONFLICT (user_id, list_id)
      DO UPDATE SET subscribed = NEW.news_blog, updated_at = NOW();
    END IF;
  END IF;

  -- Sync volunteers_opportunities with volunteers-recruitment list
  IF (OLD IS NULL) OR (NEW.volunteers_opportunities IS DISTINCT FROM OLD.volunteers_opportunities) THEN
    SELECT id INTO v_list_id FROM public.distribution_lists WHERE slug = 'volunteers-recruitment';
    IF v_list_id IS NOT NULL THEN
      INSERT INTO public.list_subscriptions (user_id, list_id, subscribed)
      VALUES (NEW.user_id, v_list_id, NEW.volunteers_opportunities)
      ON CONFLICT (user_id, list_id)
      DO UPDATE SET subscribed = NEW.volunteers_opportunities, updated_at = NOW();
    END IF;
  END IF;

  -- Sync partner_offers with partners-offers list
  IF (OLD IS NULL) OR (NEW.partner_offers IS DISTINCT FROM OLD.partner_offers) THEN
    SELECT id INTO v_list_id FROM public.distribution_lists WHERE slug = 'partners-offers';
    IF v_list_id IS NOT NULL THEN
      INSERT INTO public.list_subscriptions (user_id, list_id, subscribed)
      VALUES (NEW.user_id, v_list_id, NEW.partner_offers)
      ON CONFLICT (user_id, list_id)
      DO UPDATE SET subscribed = NEW.partner_offers, updated_at = NOW();
    END IF;
  END IF;

  -- Update profiles.marketing_opt_in based on any marketing preference being true
  UPDATE public.profiles
  SET marketing_opt_in = (
    NEW.events_announcements OR
    NEW.price_alerts OR
    NEW.news_blog OR
    NEW.volunteers_opportunities OR
    NEW.partner_offers
  )
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_notification_prefs_to_lists"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_orders_award_ambassador_points"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    perform award_ambassador_points_for_order(new.id);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."trg_orders_award_ambassador_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_registrations_award_ambassador_points"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_status text;
begin
  if new.order_id is null then
    return new;
  end if;

  select status into v_status from orders where id = new.order_id;
  if v_status = 'paid' then
    perform award_ambassador_points_for_order(new.order_id);
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."trg_registrations_award_ambassador_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_check_tier_progression"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_event_ids UUID[];
BEGIN
  -- Get all events associated with this promo code
  SELECT ARRAY_AGG(event_id) INTO v_event_ids
  FROM promotional_code_events
  WHERE promotional_code_id = NEW.id;

  -- Check progression for each event
  IF v_event_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_event_ids, 1) LOOP
      PERFORM check_and_advance_tier_progression(v_event_ids[i]);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_check_tier_progression"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_distribution_lists_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_distribution_lists_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_price_tiers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_event_price_tiers_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_list_subscriptions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_list_subscriptions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notification_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notification_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_promo_code_usage_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE promotional_codes 
        SET used_count = used_count + 1 
        WHERE id = NEW.promotional_code_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE promotional_codes 
        SET used_count = used_count - 1 
        WHERE id = OLD.promotional_code_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_promo_code_usage_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_request_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "request_id" "uuid" DEFAULT "gen_random_uuid"(),
    "method" "text" NOT NULL,
    "path" "text" NOT NULL,
    "query_params" "jsonb",
    "body" "jsonb",
    "user_id" "uuid",
    "user_email" "text",
    "status_code" integer NOT NULL,
    "duration_ms" integer,
    "ip_address" "text",
    "action_type" "text",
    "summary" "text" NOT NULL,
    "metadata" "jsonb",
    "error_message" "text"
);


ALTER TABLE "public"."admin_request_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ambassador_manual_referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ambassador_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ambassador_manual_referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ambassador_points" (
    "ambassador_id" "uuid" NOT NULL,
    "total_points" integer DEFAULT 0 NOT NULL,
    "recruits_open" integer DEFAULT 0 NOT NULL,
    "recruits_ranked" integer DEFAULT 0 NOT NULL,
    "current_reward_level" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ambassador_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ambassador_points_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ambassador_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "race_format" "text" NOT NULL,
    "points" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ambassador_points_events_points_check" CHECK (("points" >= 0)),
    CONSTRAINT "ambassador_points_events_race_format_check" CHECK (("race_format" = ANY (ARRAY['open'::"text", 'ranked'::"text"])))
);


ALTER TABLE "public"."ambassador_points_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ambassador_promotional_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ambassador_id" "uuid" NOT NULL,
    "promotional_code_id" "uuid" NOT NULL,
    "is_current" boolean DEFAULT false NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ambassador_promotional_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ambassador_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ambassador_id" "uuid" NOT NULL,
    "reward_level" integer NOT NULL,
    "reward_name" "text" NOT NULL,
    "status" "text" DEFAULT 'earned'::"text" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "claimed_at" timestamp with time zone,
    "fulfilled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notified_at" timestamp with time zone,
    CONSTRAINT "ambassador_rewards_status_check" CHECK (("status" = ANY (ARRAY['earned'::"text", 'claimed'::"text", 'fulfilled'::"text"])))
);


ALTER TABLE "public"."ambassador_rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ambassadors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "promotional_code_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ambassadors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bootcamp_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bootcamp_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registered_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bootcamp_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bootcamps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "location_name" "text" NOT NULL,
    "location_address" "text",
    "lat" double precision,
    "lng" double precision,
    "starts_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bootcamps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."distribution_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "slug" "text" NOT NULL,
    "type" "text" NOT NULL,
    "default_subscribed" boolean DEFAULT false,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_type" CHECK (("type" = ANY (ARRAY['marketing'::"text", 'transactional'::"text", 'events'::"text", 'volunteers'::"text", 'partners'::"text", 'news'::"text", 'blog'::"text"])))
);


ALTER TABLE "public"."distribution_lists" OWNER TO "postgres";


COMMENT ON TABLE "public"."distribution_lists" IS 'Listes de distribution pour la gestion des emails marketing et notifications';



COMMENT ON COLUMN "public"."distribution_lists"."slug" IS 'Identifiant URL-friendly unique pour la liste';



COMMENT ON COLUMN "public"."distribution_lists"."default_subscribed" IS 'Si true, les nouveaux utilisateurs sont automatiquement abonnés';



CREATE TABLE IF NOT EXISTS "public"."list_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "list_id" "uuid" NOT NULL,
    "subscribed" boolean DEFAULT true,
    "source" "text",
    "subscription_ip" "text",
    "subscribed_at" timestamp with time zone,
    "unsubscribed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "full_name" "text",
    CONSTRAINT "user_or_email_required" CHECK ((("user_id" IS NOT NULL) OR ("email" IS NOT NULL)))
);


ALTER TABLE "public"."list_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."list_subscriptions" IS 'Abonnements des utilisateurs aux listes de distribution';



COMMENT ON COLUMN "public"."list_subscriptions"."user_id" IS 'UUID de l''utilisateur authentifié (NULL si inscription par email seulement)';



COMMENT ON COLUMN "public"."list_subscriptions"."source" IS 'Source de l''abonnement (signup, event_registration, manual, etc.)';



COMMENT ON COLUMN "public"."list_subscriptions"."subscription_ip" IS 'Adresse IP lors de l''abonnement (GDPR compliance)';



COMMENT ON COLUMN "public"."list_subscriptions"."email" IS 'Email direct pour les non-authentifiés (NULL si user_id existe)';



COMMENT ON COLUMN "public"."list_subscriptions"."full_name" IS 'Nom complet pour les non-authentifiés (NULL si user_id existe)';



CREATE OR REPLACE VIEW "public"."distribution_lists_stats" AS
 SELECT "dl"."id",
    "dl"."name",
    "dl"."slug",
    "dl"."type",
    "dl"."active",
    "count"(
        CASE
            WHEN ("ls"."subscribed" = true) THEN 1
            ELSE NULL::integer
        END) AS "subscriber_count",
    "count"(
        CASE
            WHEN ("ls"."subscribed" = false) THEN 1
            ELSE NULL::integer
        END) AS "unsubscriber_count",
    "count"("ls"."id") AS "total_interactions",
    "dl"."created_at"
   FROM ("public"."distribution_lists" "dl"
     LEFT JOIN "public"."list_subscriptions" "ls" ON (("dl"."id" = "ls"."list_id")))
  GROUP BY "dl"."id", "dl"."name", "dl"."slug", "dl"."type", "dl"."active", "dl"."created_at"
  ORDER BY ("count"(
        CASE
            WHEN ("ls"."subscribed" = true) THEN 1
            ELSE NULL::integer
        END)) DESC;


ALTER VIEW "public"."distribution_lists_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "email_type" "text" NOT NULL,
    "context" "jsonb",
    "sent_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."email_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_opening_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "full_name" "text",
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notified_at" timestamp with time zone
);


ALTER TABLE "public"."event_opening_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_price_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "discount_percentage" integer NOT NULL,
    "available_from" timestamp with time zone,
    "available_until" timestamp with time zone,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "max_registrations" integer,
    CONSTRAINT "event_price_tiers_discount_percentage_check" CHECK ((("discount_percentage" >= 0) AND ("discount_percentage" <= 100)))
);


ALTER TABLE "public"."event_price_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_races" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "race_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_races" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "event_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 10)))
);


ALTER TABLE "public"."event_ratings" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_ratings" IS 'Stores NPS ratings from event participants';



COMMENT ON COLUMN "public"."event_ratings"."user_id" IS 'References the user who submitted the rating';



COMMENT ON COLUMN "public"."event_ratings"."event_id" IS 'References the event being rated';



COMMENT ON COLUMN "public"."event_ratings"."rating" IS 'NPS rating from 1 (lowest) to 10 (highest)';



CREATE TABLE IF NOT EXISTS "public"."event_waves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "wave_index" integer NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "capacity" integer DEFAULT 50 NOT NULL,
    "assigned_count" integer DEFAULT 0 NOT NULL,
    "is_closed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_waves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "date" timestamp with time zone NOT NULL,
    "location" "text" NOT NULL,
    "capacity" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "external_provider" "text",
    "external_event_id" "text",
    "external_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "sales_start" timestamp with time zone
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "group_members_role_check" CHECK (("role" = ANY (ARRAY['captain'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "captain_id" "uuid" NOT NULL,
    "invite_code" "text" DEFAULT "upper"("substring"("replace"(("gen_random_uuid"())::"text", '-'::"text", ''::"text"), 1, 8)) NOT NULL,
    "anchor_event_id" "uuid",
    "anchor_wave_index" integer,
    "anchor_start_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "anchor_initialized_by" "text",
    "anchor_initialized_from_profile_id" "uuid",
    "anchor_initialized_at" timestamp with time zone,
    CONSTRAINT "groups_anchor_initialized_by_check" CHECK ((("anchor_initialized_by" IS NULL) OR ("anchor_initialized_by" = ANY (ARRAY['creator'::"text", 'member_join'::"text", 'admin_manual'::"text"]))))
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."import_logs" (
    "id" bigint NOT NULL,
    "provider" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."import_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "events_announcements" boolean DEFAULT true,
    "price_alerts" boolean DEFAULT true,
    "news_blog" boolean DEFAULT false,
    "volunteers_opportunities" boolean DEFAULT false,
    "partner_offers" boolean DEFAULT false,
    "digest_frequency" "text" DEFAULT 'immediate'::"text",
    "registration_confirmations" boolean DEFAULT true,
    "ticket_updates" boolean DEFAULT true,
    "account_security" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_preferences_digest_frequency_check" CHECK (("digest_frequency" = ANY (ARRAY['immediate'::"text", 'daily'::"text", 'weekly'::"text", 'never'::"text"])))
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_preferences" IS 'Stores granular email notification preferences for users';



COMMENT ON COLUMN "public"."notification_preferences"."events_announcements" IS 'Receive emails about new events';



COMMENT ON COLUMN "public"."notification_preferences"."price_alerts" IS 'Receive emails about price changes and promotions';



COMMENT ON COLUMN "public"."notification_preferences"."news_blog" IS 'Receive blog updates and news';



COMMENT ON COLUMN "public"."notification_preferences"."volunteers_opportunities" IS 'Receive volunteer recruitment emails';



COMMENT ON COLUMN "public"."notification_preferences"."partner_offers" IS 'Receive partner offers and collaborations';



COMMENT ON COLUMN "public"."notification_preferences"."digest_frequency" IS 'How often to receive digest emails: immediate, daily, weekly, or never';



COMMENT ON COLUMN "public"."notification_preferences"."registration_confirmations" IS 'Transactional: event registration confirmations (always enabled)';



COMMENT ON COLUMN "public"."notification_preferences"."ticket_updates" IS 'Transactional: ticket and order updates (always enabled)';



COMMENT ON COLUMN "public"."notification_preferences"."account_security" IS 'Transactional: account security notifications (always enabled)';



CREATE OR REPLACE VIEW "public"."my_notification_preferences" WITH ("security_invoker"='true') AS
 SELECT "id",
    "user_id",
    "events_announcements",
    "price_alerts",
    "news_blog",
    "volunteers_opportunities",
    "partner_offers",
    "digest_frequency",
    "registration_confirmations",
    "ticket_updates",
    "account_security",
    "created_at",
    "updated_at"
   FROM "public"."notification_preferences"
  WHERE ("user_id" = "auth"."uid"());


ALTER VIEW "public"."my_notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "provider" "text" DEFAULT 'internal'::"text" NOT NULL,
    "provider_order_id" "text",
    "status" "text" DEFAULT 'paid'::"text" NOT NULL,
    "amount_total" integer,
    "currency" "text" DEFAULT 'eur'::"text",
    "invoice_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "event_id" "uuid",
    "ticket_id" "uuid",
    "provider" "text" DEFAULT 'internal'::"text" NOT NULL,
    "provider_registration_id" "text",
    "qr_code_token" "text",
    "checked_in" boolean DEFAULT false NOT NULL,
    "claim_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "document_url" "text",
    "document_filename" "text",
    "document_size" bigint,
    "approval_status" "text" DEFAULT 'pending'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "guarantor_user_id" "uuid",
    "affiliation_token" character varying(255),
    "is_affiliated" boolean DEFAULT true,
    "affiliation_deadline" timestamp with time zone,
    "promotional_code_id" "uuid",
    "race_id" "uuid",
    "transfer_token" "uuid" DEFAULT "gen_random_uuid"(),
    "event_price_tier_id" "uuid",
    "difficulty_level" "text",
    "stripe_payment_intent_id" "text",
    "start_time" timestamp with time zone,
    "wave_index" integer,
    "wave_capacity" integer,
    "wave_position" integer,
    "auto_assigned" boolean DEFAULT true,
    "distance_ideal_km" numeric NOT NULL,
    "distance_min_km" numeric NOT NULL,
    "preferred_window_start" timestamp with time zone,
    "preferred_window_end" timestamp with time zone,
    "latest_allowed_time" timestamp with time zone,
    "assignment_constraint_breached" boolean DEFAULT false,
    CONSTRAINT "registrations_difficulty_level_check" CHECK (("difficulty_level" = ANY (ARRAY['low'::"text", 'mid'::"text", 'hard'::"text"]))),
    CONSTRAINT "registrations_distance_ideal_gte_min" CHECK (("distance_ideal_km" >= "distance_min_km")),
    CONSTRAINT "registrations_distance_min_positive" CHECK (("distance_min_km" > (0)::numeric))
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."registrations"."difficulty_level" IS 'Difficulty level chosen by the participant for non-universal races. Values: low (Primal), mid (Fury), hard (Ultra Hardcore)';



COMMENT ON COLUMN "public"."registrations"."stripe_payment_intent_id" IS 'Stripe Payment Intent ID for tracking payments';



CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "distance_km" numeric,
    "quota" integer DEFAULT 0 NOT NULL,
    "sales_start" timestamp with time zone,
    "sales_end" timestamp with time zone,
    "external_ticket_id" "text",
    "external_price_name" "text",
    "race_id" "uuid",
    "max_participants" integer DEFAULT 0,
    "requires_document" boolean DEFAULT false,
    "document_types" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "currency" "text",
    "final_price_cents" integer DEFAULT 0 NOT NULL,
    "race_format" "text",
    CONSTRAINT "tickets_race_format_check" CHECK ((("race_format" IS NULL) OR ("race_format" = ANY (ARRAY['open'::"text", 'ranked'::"text"]))))
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."my_registrations" WITH ("security_invoker"='true') AS
 SELECT "r"."id" AS "registration_id",
    "r"."user_id",
    "r"."email",
    "r"."checked_in",
    "r"."claim_status",
    "r"."qr_code_token",
    "r"."created_at",
    "r"."difficulty_level",
    "t"."id" AS "ticket_id",
    "t"."name" AS "ticket_name",
    "e"."id" AS "event_id",
    "e"."title" AS "event_title",
    "e"."date" AS "event_date",
    "e"."location" AS "event_location",
    "o"."amount_total",
    "o"."currency",
    "o"."status" AS "order_status",
    "o"."invoice_url",
    "o"."created_at" AS "order_created_at"
   FROM ((("public"."registrations" "r"
     LEFT JOIN "public"."tickets" "t" ON (("r"."ticket_id" = "t"."id")))
     LEFT JOIN "public"."events" "e" ON (("t"."event_id" = "e"."id")))
     LEFT JOIN "public"."orders" "o" ON (("r"."order_id" = "o"."id")))
  WHERE ("r"."user_id" = "auth"."uid"());


ALTER VIEW "public"."my_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obstacles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "image_url" character varying(500),
    "video_url" character varying(500),
    "difficulty" integer DEFAULT 5,
    "type" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."obstacles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "item_type" character varying(20) NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price_cents" integer NOT NULL,
    "total_price_cents" integer NOT NULL,
    "promotional_code_id" "uuid",
    "discount_applied_cents" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "order_items_discount_applied_cents_check" CHECK (("discount_applied_cents" >= 0)),
    CONSTRAINT "order_items_item_type_check" CHECK ((("item_type")::"text" = ANY ((ARRAY['ticket'::character varying, 'upsell'::character varying])::"text"[]))),
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "order_items_total_price_cents_check" CHECK (("total_price_cents" >= 0)),
    CONSTRAINT "order_items_unit_price_cents_check" CHECK (("unit_price_cents" >= 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."order_items" IS 'Détail des items dans chaque commande';



CREATE OR REPLACE VIEW "public"."orders_with_details" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"uuid" AS "user_id",
    NULL::"text" AS "email",
    NULL::"text" AS "provider",
    NULL::"text" AS "provider_order_id",
    NULL::"text" AS "status",
    NULL::integer AS "amount_total",
    NULL::"text" AS "currency",
    NULL::"text" AS "invoice_url",
    NULL::timestamp with time zone AS "created_at",
    NULL::bigint AS "total_items",
    NULL::bigint AS "calculated_total_cents",
    NULL::bigint AS "total_discount_cents";


ALTER VIEW "public"."orders_with_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "date_of_birth" "date",
    "marketing_opt_in" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."date_of_birth" IS 'Date de naissance de l’utilisateur';



CREATE TABLE IF NOT EXISTS "public"."promotional_code_events" (
    "promotional_code_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL
);


ALTER TABLE "public"."promotional_code_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotional_code_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promotional_code_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "discount_applied_cents" integer NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "promotional_code_usage_discount_applied_cents_check" CHECK (("discount_applied_cents" >= 0))
);


ALTER TABLE "public"."promotional_code_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."promotional_code_usage" IS 'Historique d''utilisation des codes promo';



CREATE TABLE IF NOT EXISTS "public"."promotional_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "discount_percent" integer,
    "discount_amount" integer,
    "currency" character varying(3) DEFAULT 'eur'::character varying,
    "valid_from" timestamp with time zone NOT NULL,
    "valid_until" timestamp with time zone NOT NULL,
    "usage_limit" integer,
    "used_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tier_order" integer,
    "event_price_tier_id" "uuid",
    "auto_activate" boolean DEFAULT false,
    CONSTRAINT "check_discount_type" CHECK (((("discount_percent" IS NOT NULL) AND ("discount_amount" IS NULL)) OR (("discount_percent" IS NULL) AND ("discount_amount" IS NOT NULL)))),
    CONSTRAINT "check_usage_limit" CHECK ((("usage_limit" IS NULL) OR ("used_count" <= "usage_limit"))),
    CONSTRAINT "check_validity_dates" CHECK (("valid_from" < "valid_until")),
    CONSTRAINT "promotional_codes_discount_amount_check" CHECK (("discount_amount" >= 0)),
    CONSTRAINT "promotional_codes_discount_percent_check" CHECK ((("discount_percent" >= 0) AND ("discount_percent" <= 100))),
    CONSTRAINT "promotional_codes_usage_limit_check" CHECK (("usage_limit" > 0)),
    CONSTRAINT "promotional_codes_used_count_check" CHECK (("used_count" >= 0))
);


ALTER TABLE "public"."promotional_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."promotional_codes" IS 'Codes promotionnels pour les inscriptions';



COMMENT ON COLUMN "public"."promotional_codes"."tier_order" IS 'Sequential order for automatic tier progression (1 = first tier, 2 = second tier, etc.). NULL = not part of tier progression.';



COMMENT ON COLUMN "public"."promotional_codes"."event_price_tier_id" IS 'Optional link to EventPriceTier for display purposes. The promo code discount takes precedence.';



COMMENT ON COLUMN "public"."promotional_codes"."auto_activate" IS 'If true, this code will automatically activate when the previous tier code expires or reaches usage limit.';



CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text",
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."race_obstacles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "race_id" "uuid" NOT NULL,
    "obstacle_id" "uuid" NOT NULL,
    "order_position" integer,
    "is_mandatory" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."race_obstacles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."races" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "logo_url" character varying(500),
    "type" character varying(100) NOT NULL,
    "difficulty" integer DEFAULT 5,
    "target_public" character varying(100) NOT NULL,
    "distance_km" numeric(6,2),
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_universal" boolean DEFAULT false NOT NULL,
    "format_template" character varying(50),
    "estimated_time_min" integer,
    "estimated_time_max" integer,
    "prerequisites" "jsonb",
    "ideal_profile" "jsonb",
    "progression_from" character varying(50)[],
    "progression_to" character varying(50)[],
    "gallery_images" "jsonb"
);


ALTER TABLE "public"."races" OWNER TO "postgres";


COMMENT ON COLUMN "public"."races"."is_universal" IS 'True for single-format races (Kids, Backyard), false for multi-format races (Standard/Guerrier/Elite)';



CREATE TABLE IF NOT EXISTS "public"."registration_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "document_url" "text" NOT NULL,
    "document_filename" "text" NOT NULL,
    "document_size" bigint NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "rejection_reason" "text",
    "approved_at" timestamp with time zone,
    "approved_by" "uuid"
);


ALTER TABLE "public"."registration_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registration_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "regulation_version" character varying(50) NOT NULL,
    "signed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signature_data" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."registration_signatures" OWNER TO "postgres";


COMMENT ON TABLE "public"."registration_signatures" IS 'Signatures électroniques des règlements';



CREATE TABLE IF NOT EXISTS "public"."registration_upsells" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "price_cents" integer NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "currency" "text" DEFAULT 'eur'::"text" NOT NULL,
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "registration_upsells_price_cents_check" CHECK (("price_cents" >= 0)),
    CONSTRAINT "registration_upsells_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."registration_upsells" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_promotions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "link_url" "text" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "link_text" "text",
    "type" character varying(10) DEFAULT 'banner'::character varying NOT NULL,
    "popup_config" "jsonb",
    CONSTRAINT "site_promotions_starts_before_end" CHECK (("starts_at" < "ends_at")),
    CONSTRAINT "site_promotions_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['banner'::character varying, 'popup'::character varying])::"text"[])))
);


ALTER TABLE "public"."site_promotions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."site_promotions"."type" IS 'Type de promotion: banner (sous header) ou popup (modale)';



COMMENT ON COLUMN "public"."site_promotions"."popup_config" IS 'Configuration JSON pour les popups (null pour les banners)';



CREATE TABLE IF NOT EXISTS "public"."upsells" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "price_cents" integer NOT NULL,
    "currency" character varying(3) DEFAULT 'eur'::character varying,
    "type" character varying(50) NOT NULL,
    "event_id" "uuid",
    "is_active" boolean DEFAULT true,
    "stock_quantity" integer,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "options" "jsonb",
    CONSTRAINT "upsells_options_sizes_array" CHECK ((("options" IS NULL) OR ("jsonb_typeof"(("options" -> 'sizes'::"text")) = 'array'::"text"))),
    CONSTRAINT "upsells_price_cents_check" CHECK (("price_cents" >= 0))
);


ALTER TABLE "public"."upsells" OWNER TO "postgres";


COMMENT ON TABLE "public"."upsells" IS 'Produits complémentaires (t-shirts, photos, etc.)';



CREATE OR REPLACE VIEW "public"."user_notification_preferences" WITH ("security_barrier"='true') AS
 SELECT "np"."id",
    "np"."user_id",
    "np"."events_announcements",
    "np"."price_alerts",
    "np"."news_blog",
    "np"."volunteers_opportunities",
    "np"."partner_offers",
    "np"."digest_frequency",
    "np"."registration_confirmations",
    "np"."ticket_updates",
    "np"."account_security",
    "np"."created_at",
    "np"."updated_at",
    "p"."full_name"
   FROM ("public"."notification_preferences" "np"
     LEFT JOIN "public"."profiles" "p" ON (("p"."id" = "np"."user_id")));


ALTER VIEW "public"."user_notification_preferences" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_all_subscribers" WITH ("security_barrier"='true') AS
 SELECT "ls"."id",
    "ls"."list_id",
    "ls"."user_id",
    COALESCE(("ls"."email")::character varying, (("p"."id")::"text")::character varying) AS "email",
    COALESCE("p"."full_name", "ls"."full_name") AS "full_name",
    "ls"."subscribed",
    "ls"."subscribed_at",
    "ls"."unsubscribed_at",
    "ls"."source",
    "ls"."created_at",
        CASE
            WHEN ("ls"."user_id" IS NOT NULL) THEN 'authenticated'::"text"
            ELSE 'email_only'::"text"
        END AS "subscriber_type"
   FROM ("public"."list_subscriptions" "ls"
     LEFT JOIN "public"."profiles" "p" ON (("p"."id" = "ls"."user_id")));


ALTER VIEW "public"."v_all_subscribers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_my_registrations" WITH ("security_invoker"='on') AS
 SELECT "r"."id" AS "registration_id",
    "r"."email",
    "r"."checked_in",
    "r"."claim_status",
    "e"."title" AS "event_title",
    "e"."date" AS "event_date",
    "e"."location" AS "event_location",
    "t"."name" AS "ticket_name",
    "o"."status" AS "order_status",
    "o"."amount_total",
    "o"."currency",
    "r"."created_at"
   FROM ((("public"."registrations" "r"
     LEFT JOIN "public"."orders" "o" ON (("o"."id" = "r"."order_id")))
     LEFT JOIN "public"."tickets" "t" ON (("t"."id" = "r"."ticket_id")))
     LEFT JOIN "public"."events" "e" ON (("e"."id" = "r"."event_id")));


ALTER VIEW "public"."v_my_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."volunteer_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "availability" "text" NOT NULL,
    "preferred_mission" "text" NOT NULL,
    "experience" "text",
    "motivations" "text",
    "event_id" "uuid",
    "event_snapshot" "jsonb",
    "gdpr_consent" boolean DEFAULT false NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."volunteer_applications" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_request_logs"
    ADD CONSTRAINT "admin_request_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ambassador_manual_referrals"
    ADD CONSTRAINT "ambassador_manual_referrals_ambassador_id_registration_id_key" UNIQUE ("ambassador_id", "registration_id");



ALTER TABLE ONLY "public"."ambassador_manual_referrals"
    ADD CONSTRAINT "ambassador_manual_referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ambassador_points_events"
    ADD CONSTRAINT "ambassador_points_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ambassador_points"
    ADD CONSTRAINT "ambassador_points_pkey" PRIMARY KEY ("ambassador_id");



ALTER TABLE ONLY "public"."ambassador_promotional_codes"
    ADD CONSTRAINT "ambassador_promotional_codes_ambassador_id_promotional_code_key" UNIQUE ("ambassador_id", "promotional_code_id");



ALTER TABLE ONLY "public"."ambassador_promotional_codes"
    ADD CONSTRAINT "ambassador_promotional_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ambassador_rewards"
    ADD CONSTRAINT "ambassador_rewards_ambassador_id_reward_level_key" UNIQUE ("ambassador_id", "reward_level");



ALTER TABLE ONLY "public"."ambassador_rewards"
    ADD CONSTRAINT "ambassador_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ambassadors"
    ADD CONSTRAINT "ambassadors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ambassadors"
    ADD CONSTRAINT "ambassadors_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."ambassadors"
    ADD CONSTRAINT "ambassadors_promotional_code_id_key" UNIQUE ("promotional_code_id");



ALTER TABLE ONLY "public"."bootcamp_registrations"
    ADD CONSTRAINT "bootcamp_registrations_bootcamp_id_user_id_key" UNIQUE ("bootcamp_id", "user_id");



ALTER TABLE ONLY "public"."bootcamp_registrations"
    ADD CONSTRAINT "bootcamp_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bootcamps"
    ADD CONSTRAINT "bootcamps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."distribution_lists"
    ADD CONSTRAINT "distribution_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."distribution_lists"
    ADD CONSTRAINT "distribution_lists_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_opening_notifications"
    ADD CONSTRAINT "event_opening_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_price_tiers"
    ADD CONSTRAINT "event_price_tiers_event_id_display_order_key" UNIQUE ("event_id", "display_order");



ALTER TABLE ONLY "public"."event_price_tiers"
    ADD CONSTRAINT "event_price_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_races"
    ADD CONSTRAINT "event_races_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_ratings"
    ADD CONSTRAINT "event_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_ratings"
    ADD CONSTRAINT "event_ratings_user_id_event_id_key" UNIQUE ("user_id", "event_id");



ALTER TABLE ONLY "public"."event_waves"
    ADD CONSTRAINT "event_waves_event_wave_index" UNIQUE ("event_id", "wave_index");



ALTER TABLE ONLY "public"."event_waves"
    ADD CONSTRAINT "event_waves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_profile_id_key" UNIQUE ("group_id", "profile_id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_logs"
    ADD CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."list_subscriptions"
    ADD CONSTRAINT "list_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."list_subscriptions"
    ADD CONSTRAINT "list_subscriptions_user_id_list_id_key" UNIQUE ("user_id", "list_id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."obstacles"
    ADD CONSTRAINT "obstacles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promotional_code_events"
    ADD CONSTRAINT "promotional_code_events_pkey" PRIMARY KEY ("promotional_code_id", "event_id");



ALTER TABLE ONLY "public"."promotional_code_usage"
    ADD CONSTRAINT "promotional_code_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promotional_code_usage"
    ADD CONSTRAINT "promotional_code_usage_promotional_code_id_order_id_key" UNIQUE ("promotional_code_id", "order_id");



ALTER TABLE ONLY "public"."promotional_codes"
    ADD CONSTRAINT "promotional_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."promotional_codes"
    ADD CONSTRAINT "promotional_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE ("endpoint");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."race_obstacles"
    ADD CONSTRAINT "race_obstacles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."races"
    ADD CONSTRAINT "races_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registration_documents"
    ADD CONSTRAINT "registration_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registration_signatures"
    ADD CONSTRAINT "registration_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registration_signatures"
    ADD CONSTRAINT "registration_signatures_registration_id_regulation_version_key" UNIQUE ("registration_id", "regulation_version");



ALTER TABLE ONLY "public"."registration_upsells"
    ADD CONSTRAINT "registration_upsells_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_affiliation_token_key" UNIQUE ("affiliation_token");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_promotions"
    ADD CONSTRAINT "site_promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."upsells"
    ADD CONSTRAINT "upsells_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."volunteer_applications"
    ADD CONSTRAINT "volunteer_applications_pkey" PRIMARY KEY ("id");



CREATE INDEX "admin_request_logs_action_idx" ON "public"."admin_request_logs" USING "btree" ("action_type");



CREATE INDEX "admin_request_logs_created_at_idx" ON "public"."admin_request_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "admin_request_logs_method_idx" ON "public"."admin_request_logs" USING "btree" ("method");



CREATE INDEX "admin_request_logs_status_idx" ON "public"."admin_request_logs" USING "btree" ("status_code");



CREATE UNIQUE INDEX "ambassador_points_events_ambassador_registration_uidx" ON "public"."ambassador_points_events" USING "btree" ("ambassador_id", "registration_id");



CREATE UNIQUE INDEX "ambassador_points_events_ambassador_registration_unique" ON "public"."ambassador_points_events" USING "btree" ("ambassador_id", "registration_id");



CREATE UNIQUE INDEX "ambassador_rewards_ambassador_level_uidx" ON "public"."ambassador_rewards" USING "btree" ("ambassador_id", "reward_level");



CREATE UNIQUE INDEX "ambassador_rewards_level_unique" ON "public"."ambassador_rewards" USING "btree" ("ambassador_id", "reward_level");



CREATE INDEX "ambassador_rewards_status_idx" ON "public"."ambassador_rewards" USING "btree" ("ambassador_id", "status");



CREATE INDEX "email_logs_context_idx" ON "public"."email_logs" USING "gin" ("context");



CREATE INDEX "email_logs_user_type_idx" ON "public"."email_logs" USING "btree" ("user_id", "email_type", "sent_at" DESC);



CREATE INDEX "event_opening_notifications_email_idx" ON "public"."event_opening_notifications" USING "btree" ("email");



CREATE INDEX "event_opening_notifications_event_id_idx" ON "public"."event_opening_notifications" USING "btree" ("event_id");



CREATE UNIQUE INDEX "event_opening_notifications_unique" ON "public"."event_opening_notifications" USING "btree" ("event_id", "email");



CREATE UNIQUE INDEX "event_races_event_id_race_id_key" ON "public"."event_races" USING "btree" ("event_id", "race_id");



CREATE INDEX "events_date_idx" ON "public"."events" USING "btree" ("date");



CREATE INDEX "events_provider_idx" ON "public"."events" USING "btree" ("external_provider", "external_event_id");



CREATE UNIQUE INDEX "events_slug_key" ON "public"."events" USING "btree" ("slug");



CREATE INDEX "idx_ambassador_manual_referrals_ambassador_id" ON "public"."ambassador_manual_referrals" USING "btree" ("ambassador_id");



CREATE INDEX "idx_ambassador_manual_referrals_registration_id" ON "public"."ambassador_manual_referrals" USING "btree" ("registration_id");



CREATE INDEX "idx_apc_ambassador_id" ON "public"."ambassador_promotional_codes" USING "btree" ("ambassador_id");



CREATE INDEX "idx_bootcamp_registrations_bootcamp" ON "public"."bootcamp_registrations" USING "btree" ("bootcamp_id");



CREATE INDEX "idx_bootcamp_registrations_user" ON "public"."bootcamp_registrations" USING "btree" ("user_id");



CREATE INDEX "idx_distribution_lists_active" ON "public"."distribution_lists" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_distribution_lists_slug" ON "public"."distribution_lists" USING "btree" ("slug");



CREATE INDEX "idx_distribution_lists_type" ON "public"."distribution_lists" USING "btree" ("type");



CREATE INDEX "idx_event_price_tiers_dates" ON "public"."event_price_tiers" USING "btree" ("available_from", "available_until");



CREATE INDEX "idx_event_price_tiers_event_id" ON "public"."event_price_tiers" USING "btree" ("event_id");



CREATE INDEX "idx_event_races_event_id" ON "public"."event_races" USING "btree" ("event_id");



CREATE INDEX "idx_event_races_race_id" ON "public"."event_races" USING "btree" ("race_id");



CREATE INDEX "idx_event_ratings_created_at" ON "public"."event_ratings" USING "btree" ("created_at");



CREATE INDEX "idx_event_ratings_event_id" ON "public"."event_ratings" USING "btree" ("event_id");



CREATE INDEX "idx_event_ratings_rating" ON "public"."event_ratings" USING "btree" ("rating");



CREATE INDEX "idx_event_ratings_user_id" ON "public"."event_ratings" USING "btree" ("user_id");



CREATE INDEX "idx_group_members_group_id" ON "public"."group_members" USING "btree" ("group_id");



CREATE INDEX "idx_group_members_profile_id" ON "public"."group_members" USING "btree" ("profile_id");



CREATE INDEX "idx_groups_invite_code" ON "public"."groups" USING "btree" ("invite_code");



CREATE INDEX "idx_list_subscriptions_active" ON "public"."list_subscriptions" USING "btree" ("list_id", "subscribed") WHERE ("subscribed" = true);



CREATE UNIQUE INDEX "idx_list_subscriptions_email" ON "public"."list_subscriptions" USING "btree" ("list_id", "lower"("email")) WHERE (("user_id" IS NULL) AND ("email" IS NOT NULL));



CREATE INDEX "idx_list_subscriptions_email_lookup" ON "public"."list_subscriptions" USING "btree" ("lower"("email")) WHERE ("email" IS NOT NULL);



CREATE INDEX "idx_list_subscriptions_list" ON "public"."list_subscriptions" USING "btree" ("list_id");



CREATE INDEX "idx_list_subscriptions_user" ON "public"."list_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_list_subscriptions_user_subscribed" ON "public"."list_subscriptions" USING "btree" ("user_id", "subscribed");



CREATE INDEX "idx_notification_preferences_user_id" ON "public"."notification_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_obstacles_difficulty" ON "public"."obstacles" USING "btree" ("difficulty");



CREATE INDEX "idx_obstacles_type" ON "public"."obstacles" USING "btree" ("type");



CREATE INDEX "idx_order_items_item" ON "public"."order_items" USING "btree" ("item_id", "item_type");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_promotional_codes_code" ON "public"."promotional_codes" USING "btree" ("code") WHERE ("is_active" = true);



CREATE INDEX "idx_promotional_codes_event_tier" ON "public"."promotional_codes" USING "btree" ("event_price_tier_id") WHERE ("event_price_tier_id" IS NOT NULL);



CREATE INDEX "idx_promotional_codes_tier_order" ON "public"."promotional_codes" USING "btree" ("tier_order") WHERE ("tier_order" IS NOT NULL);



CREATE INDEX "idx_promotional_codes_validity" ON "public"."promotional_codes" USING "btree" ("valid_from", "valid_until") WHERE ("is_active" = true);



CREATE INDEX "idx_race_obstacles_obstacle_id" ON "public"."race_obstacles" USING "btree" ("obstacle_id");



CREATE INDEX "idx_race_obstacles_race_id" ON "public"."race_obstacles" USING "btree" ("race_id");



CREATE INDEX "idx_races_difficulty" ON "public"."races" USING "btree" ("difficulty");



CREATE INDEX "idx_races_target_public" ON "public"."races" USING "btree" ("target_public");



CREATE INDEX "idx_races_type" ON "public"."races" USING "btree" ("type");



CREATE INDEX "idx_registrations_affiliation_token" ON "public"."registrations" USING "btree" ("affiliation_token") WHERE ("affiliation_token" IS NOT NULL);



CREATE INDEX "idx_registrations_difficulty_level" ON "public"."registrations" USING "btree" ("difficulty_level");



CREATE INDEX "idx_registrations_guarantor" ON "public"."registrations" USING "btree" ("guarantor_user_id") WHERE ("guarantor_user_id" IS NOT NULL);



CREATE INDEX "idx_registrations_stripe_payment_intent_id" ON "public"."registrations" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_site_promotions_active_type" ON "public"."site_promotions" USING "btree" ("is_active", "type", "starts_at", "ends_at") WHERE ("is_active" = true);



CREATE INDEX "idx_site_promotions_type" ON "public"."site_promotions" USING "btree" ("type");



CREATE INDEX "idx_tickets_race_id" ON "public"."tickets" USING "btree" ("race_id");



CREATE INDEX "orders_email_idx" ON "public"."orders" USING "btree" ("email");



CREATE UNIQUE INDEX "orders_provider_provider_order_id_key" ON "public"."orders" USING "btree" ("provider", "provider_order_id");



CREATE INDEX "orders_user_idx" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "push_subscriptions_email_idx" ON "public"."push_subscriptions" USING "btree" ("email");



CREATE UNIQUE INDEX "race_obstacles_race_id_obstacle_id_key" ON "public"."race_obstacles" USING "btree" ("race_id", "obstacle_id");



CREATE INDEX "registration_documents_registration_id" ON "public"."registration_documents" USING "btree" ("registration_id");



CREATE UNIQUE INDEX "registration_documents_unique_type" ON "public"."registration_documents" USING "btree" ("registration_id", "document_type");



CREATE INDEX "registration_upsells_created_at_idx" ON "public"."registration_upsells" USING "btree" ("created_at");



CREATE INDEX "registration_upsells_registration_id_idx" ON "public"."registration_upsells" USING "btree" ("registration_id");



CREATE INDEX "registrations_approval_status_idx" ON "public"."registrations" USING "btree" ("approval_status");



CREATE INDEX "registrations_approved_by_idx" ON "public"."registrations" USING "btree" ("approved_by");



CREATE INDEX "registrations_document_url_idx" ON "public"."registrations" USING "btree" ("document_url") WHERE ("document_url" IS NOT NULL);



CREATE INDEX "registrations_email_idx" ON "public"."registrations" USING "btree" ("email");



CREATE INDEX "registrations_event_idx" ON "public"."registrations" USING "btree" ("event_id");



CREATE INDEX "registrations_event_price_tier_id_idx" ON "public"."registrations" USING "btree" ("event_price_tier_id");



CREATE INDEX "registrations_event_wave_index" ON "public"."registrations" USING "btree" ("event_id", "wave_index");



CREATE INDEX "registrations_promotional_code_id_idx" ON "public"."registrations" USING "btree" ("promotional_code_id");



CREATE INDEX "registrations_provider_idx" ON "public"."registrations" USING "btree" ("provider", "provider_registration_id");



CREATE UNIQUE INDEX "registrations_provider_provider_registration_id_key" ON "public"."registrations" USING "btree" ("provider", "provider_registration_id");



CREATE UNIQUE INDEX "registrations_qr_code_token_key" ON "public"."registrations" USING "btree" ("qr_code_token");



CREATE INDEX "registrations_race_id_idx" ON "public"."registrations" USING "btree" ("race_id");



CREATE UNIQUE INDEX "registrations_transfer_token_idx" ON "public"."registrations" USING "btree" ("transfer_token") WHERE ("transfer_token" IS NOT NULL);



CREATE INDEX "registrations_user_idx" ON "public"."registrations" USING "btree" ("user_id");



CREATE INDEX "site_promotions_active_idx" ON "public"."site_promotions" USING "btree" ("is_active", "starts_at", "ends_at");



CREATE INDEX "site_promotions_schedule_idx" ON "public"."site_promotions" USING "btree" ("starts_at", "ends_at");



CREATE INDEX "tickets_event_idx" ON "public"."tickets" USING "btree" ("event_id");



CREATE INDEX "tickets_external_idx" ON "public"."tickets" USING "btree" ("external_ticket_id");



CREATE INDEX "volunteer_applications_email_idx" ON "public"."volunteer_applications" USING "btree" ("email");



CREATE INDEX "volunteer_applications_event_id_idx" ON "public"."volunteer_applications" USING "btree" ("event_id");



CREATE INDEX "volunteer_applications_submitted_at_idx" ON "public"."volunteer_applications" USING "btree" ("submitted_at");



CREATE OR REPLACE VIEW "public"."orders_with_details" WITH ("security_invoker"='on') AS
 SELECT "o"."id",
    "o"."user_id",
    "o"."email",
    "o"."provider",
    "o"."provider_order_id",
    "o"."status",
    "o"."amount_total",
    "o"."currency",
    "o"."invoice_url",
    "o"."created_at",
    "count"("oi"."id") AS "total_items",
    "sum"("oi"."total_price_cents") AS "calculated_total_cents",
    "sum"("oi"."discount_applied_cents") AS "total_discount_cents"
   FROM ("public"."orders" "o"
     LEFT JOIN "public"."order_items" "oi" ON (("o"."id" = "oi"."order_id")))
  GROUP BY "o"."id";



CREATE OR REPLACE TRIGGER "create_notification_prefs_on_profile_creation" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_notification_preferences_for_new_user"();



CREATE OR REPLACE TRIGGER "event_price_tiers_updated_at_trigger" BEFORE UPDATE ON "public"."event_price_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."update_event_price_tiers_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_events" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_obstacles" BEFORE UPDATE ON "public"."obstacles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_races" BEFORE UPDATE ON "public"."races" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_tickets" BEFORE UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "merge_email_subscriptions_trigger" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."merge_email_subscriptions_to_user"();



CREATE OR REPLACE TRIGGER "merge_list_subscriptions_before_insert_trigger" BEFORE INSERT ON "public"."list_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."merge_list_subscriptions_before_insert"();



CREATE OR REPLACE TRIGGER "notification_preferences_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_notification_preferences_updated_at"();



CREATE OR REPLACE TRIGGER "orders_award_ambassador_points_trigger" AFTER INSERT OR UPDATE OF "status" ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."trg_orders_award_ambassador_points"();



CREATE OR REPLACE TRIGGER "registrations_award_ambassador_points_trigger" AFTER INSERT OR UPDATE OF "promotional_code_id" ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."trg_registrations_award_ambassador_points"();



CREATE OR REPLACE TRIGGER "registrations_single_promocode_trigger" BEFORE INSERT OR UPDATE OF "promotional_code_id" ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_single_promocode_per_order"();



CREATE OR REPLACE TRIGGER "set_site_promotions_updated_at" BEFORE UPDATE ON "public"."site_promotions" FOR EACH ROW EXECUTE FUNCTION "public"."set_site_promotions_updated_at"();



CREATE OR REPLACE TRIGGER "sync_notification_prefs_to_lists_trigger" AFTER INSERT OR UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."sync_notification_prefs_to_lists"();



CREATE OR REPLACE TRIGGER "tier_progression_check" AFTER UPDATE OF "used_count" ON "public"."promotional_codes" FOR EACH ROW WHEN ((("new"."tier_order" IS NOT NULL) AND ("new"."used_count" >= "new"."usage_limit"))) EXECUTE FUNCTION "public"."trigger_check_tier_progression"();



CREATE OR REPLACE TRIGGER "trg_bootcamps_set_updated_at" BEFORE UPDATE ON "public"."bootcamps" FOR EACH ROW EXECUTE FUNCTION "public"."fn_bootcamps_set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_distribution_lists_updated_at" BEFORE UPDATE ON "public"."distribution_lists" FOR EACH ROW EXECUTE FUNCTION "public"."update_distribution_lists_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_list_subscriptions_updated_at" BEFORE UPDATE ON "public"."list_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_list_subscriptions_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_manage_subscription_timestamps" BEFORE UPDATE ON "public"."list_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."manage_subscription_timestamps"();



CREATE OR REPLACE TRIGGER "trigger_update_promo_code_usage_count" AFTER INSERT OR DELETE ON "public"."promotional_code_usage" FOR EACH ROW EXECUTE FUNCTION "public"."update_promo_code_usage_count"();



CREATE OR REPLACE TRIGGER "update_promotional_codes_updated_at" BEFORE UPDATE ON "public"."promotional_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_upsells_updated_at" BEFORE UPDATE ON "public"."upsells" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."ambassador_manual_referrals"
    ADD CONSTRAINT "ambassador_manual_referrals_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ambassador_manual_referrals"
    ADD CONSTRAINT "ambassador_manual_referrals_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ambassador_points"
    ADD CONSTRAINT "ambassador_points_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ambassador_points_events"
    ADD CONSTRAINT "ambassador_points_events_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ambassador_points_events"
    ADD CONSTRAINT "ambassador_points_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ambassador_points_events"
    ADD CONSTRAINT "ambassador_points_events_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ambassador_promotional_codes"
    ADD CONSTRAINT "ambassador_promotional_codes_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ambassador_promotional_codes"
    ADD CONSTRAINT "ambassador_promotional_codes_promotional_code_id_fkey" FOREIGN KEY ("promotional_code_id") REFERENCES "public"."promotional_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ambassador_rewards"
    ADD CONSTRAINT "ambassador_rewards_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ambassadors"
    ADD CONSTRAINT "ambassadors_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ambassadors"
    ADD CONSTRAINT "ambassadors_promotional_code_id_fkey" FOREIGN KEY ("promotional_code_id") REFERENCES "public"."promotional_codes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."bootcamp_registrations"
    ADD CONSTRAINT "bootcamp_registrations_bootcamp_id_fkey" FOREIGN KEY ("bootcamp_id") REFERENCES "public"."bootcamps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bootcamp_registrations"
    ADD CONSTRAINT "bootcamp_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_opening_notifications"
    ADD CONSTRAINT "event_opening_notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_opening_notifications"
    ADD CONSTRAINT "event_opening_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_price_tiers"
    ADD CONSTRAINT "event_price_tiers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_races"
    ADD CONSTRAINT "event_races_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_races"
    ADD CONSTRAINT "event_races_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_ratings"
    ADD CONSTRAINT "event_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_waves"
    ADD CONSTRAINT "event_waves_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_anchor_event_id_fkey" FOREIGN KEY ("anchor_event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_anchor_initialized_from_profile_id_fkey" FOREIGN KEY ("anchor_initialized_from_profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_captain_id_fkey" FOREIGN KEY ("captain_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."list_subscriptions"
    ADD CONSTRAINT "list_subscriptions_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."distribution_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_subscriptions"
    ADD CONSTRAINT "list_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_promotional_code_id_fkey" FOREIGN KEY ("promotional_code_id") REFERENCES "public"."promotional_codes"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promotional_code_events"
    ADD CONSTRAINT "promotional_code_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promotional_code_events"
    ADD CONSTRAINT "promotional_code_events_promotional_code_id_fkey" FOREIGN KEY ("promotional_code_id") REFERENCES "public"."promotional_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promotional_code_usage"
    ADD CONSTRAINT "promotional_code_usage_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promotional_code_usage"
    ADD CONSTRAINT "promotional_code_usage_promotional_code_id_fkey" FOREIGN KEY ("promotional_code_id") REFERENCES "public"."promotional_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promotional_code_usage"
    ADD CONSTRAINT "promotional_code_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."promotional_codes"
    ADD CONSTRAINT "promotional_codes_event_price_tier_id_fkey" FOREIGN KEY ("event_price_tier_id") REFERENCES "public"."event_price_tiers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."race_obstacles"
    ADD CONSTRAINT "race_obstacles_obstacle_id_fkey" FOREIGN KEY ("obstacle_id") REFERENCES "public"."obstacles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."race_obstacles"
    ADD CONSTRAINT "race_obstacles_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_documents"
    ADD CONSTRAINT "registration_documents_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_signatures"
    ADD CONSTRAINT "registration_signatures_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_upsells"
    ADD CONSTRAINT "registration_upsells_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_event_price_tier_id_fkey" FOREIGN KEY ("event_price_tier_id") REFERENCES "public"."event_price_tiers"("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_guarantor_user_id_fkey" FOREIGN KEY ("guarantor_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_promotional_code_id_fkey" FOREIGN KEY ("promotional_code_id") REFERENCES "public"."promotional_codes"("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."upsells"
    ADD CONSTRAINT "upsells_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."volunteer_applications"
    ADD CONSTRAINT "volunteer_applications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



CREATE POLICY "AUTH ACCESS" ON "public"."registrations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Admins can manage all subscriptions" ON "public"."list_subscriptions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage distribution lists" ON "public"."distribution_lists" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all notification preferences" ON "public"."notification_preferences" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all subscriptions" ON "public"."list_subscriptions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins manage site promotions" ON "public"."site_promotions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow email subscriptions" ON "public"."list_subscriptions" FOR INSERT WITH CHECK ((("user_id" IS NULL) AND ("email" IS NOT NULL)));



CREATE POLICY "Anyone can view active distribution lists" ON "public"."distribution_lists" FOR SELECT USING (("active" = true));



CREATE POLICY "Enable read access for all users" ON "public"."email_logs" FOR SELECT TO "supabase_admin" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."promotional_code_events" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."promotional_code_usage" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."promotional_codes" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."upsells" FOR SELECT USING (true);



CREATE POLICY "Only admins can view import_logs" ON "public"."import_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'volunteer'::"text"]))))));



CREATE POLICY "Policy with security definer functions" ON "public"."upsells" TO "supabase_admin" USING (true);



CREATE POLICY "Public event_races are viewable by everyone" ON "public"."event_races" FOR SELECT USING (true);



CREATE POLICY "Public events are viewable by everyone" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Public obstacles are viewable by everyone" ON "public"."obstacles" FOR SELECT USING (true);



CREATE POLICY "Public race_obstacles are viewable by everyone" ON "public"."race_obstacles" FOR SELECT USING (true);



CREATE POLICY "Public races are viewable by everyone" ON "public"."races" FOR SELECT USING (true);



CREATE POLICY "Public read active site promotions" ON "public"."site_promotions" FOR SELECT USING (("is_active" AND ("starts_at" <= "timezone"('utc'::"text", "now"())) AND ("ends_at" >= "timezone"('utc'::"text", "now"()))));



CREATE POLICY "Public tickets are viewable by everyone" ON "public"."tickets" FOR SELECT USING (true);



CREATE POLICY "Service role can manage all profiles" ON "public"."profiles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all subscriptions" ON "public"."list_subscriptions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage notification preferences" ON "public"."notification_preferences" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can insert event_races" ON "public"."event_races" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert obstacles" ON "public"."obstacles" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert own notification preferences" ON "public"."notification_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own orders" ON "public"."orders" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("email" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own registrations" ON "public"."registrations" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("email" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Users can insert race_obstacles" ON "public"."race_obstacles" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert races" ON "public"."races" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert their own ratings" ON "public"."event_ratings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert tickets" ON "public"."tickets" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can manage own notification preferences" ON "public"."notification_preferences" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own subscriptions" ON "public"."list_subscriptions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own subscriptions" ON "public"."list_subscriptions" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update events" ON "public"."events" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can update obstacles" ON "public"."obstacles" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can update own notification preferences" ON "public"."notification_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update races" ON "public"."races" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can update their own ratings" ON "public"."event_ratings" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notification preferences" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own orders" ON "public"."orders" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("email" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own registrations" ON "public"."registrations" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("email" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Users can view own subscriptions" ON "public"."list_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own ratings" ON "public"."event_ratings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."list_subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."admin_request_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ambassador_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ambassador_points_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ambassador_rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ambassadors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bootcamp_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bootcamps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bootcamps_admin_all" ON "public"."bootcamps" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "bootcamps_public_read" ON "public"."bootcamps" FOR SELECT USING (true);



ALTER TABLE "public"."distribution_lists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ds" ON "public"."admin_request_logs" FOR SELECT TO "supabase_admin" USING (true);



ALTER TABLE "public"."email_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_opening_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_price_tiers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_price_tiers_delete_policy" ON "public"."event_price_tiers" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "event_price_tiers_insert_policy" ON "public"."event_price_tiers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "event_price_tiers_select_policy" ON "public"."event_price_tiers" FOR SELECT USING (true);



CREATE POLICY "event_price_tiers_update_policy" ON "public"."event_price_tiers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



ALTER TABLE "public"."event_races" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "group_members_member_read" ON "public"."group_members" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "group_members"."group_id") AND ("gm"."profile_id" = "auth"."uid"())))));



ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "groups_member_read" ON "public"."groups" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "groups"."id") AND ("gm"."profile_id" = "auth"."uid"())))));



ALTER TABLE "public"."import_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."list_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."obstacles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_delete_own" ON "public"."orders" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "orders_insert_own" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "orders_select_own" ON "public"."orders" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "orders_update_own" ON "public"."orders" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_delete_own" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "profiles_update_role_admin_only" ON "public"."profiles" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "promo_insert_admin_only" ON "public"."promotional_codes" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



ALTER TABLE "public"."promotional_code_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotional_code_usage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "promotional_code_usage_delete_own" ON "public"."promotional_code_usage" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "promotional_code_usage_insert_own" ON "public"."promotional_code_usage" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "promotional_code_usage_select_own" ON "public"."promotional_code_usage" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "promotional_code_usage_update_own" ON "public"."promotional_code_usage" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."promotional_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."race_obstacles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."races" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registration_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registration_signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "registrations_delete_own" ON "public"."registrations" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "registrations_insert_own" ON "public"."registrations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "registrations_own_delete" ON "public"."bootcamp_registrations" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "registrations_own_insert" ON "public"."bootcamp_registrations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "registrations_own_read" ON "public"."bootcamp_registrations" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "registrations_select_own" ON "public"."registrations" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "registrations_update_own" ON "public"."registrations" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "service_role_all_ambassador_points" ON "public"."ambassador_points" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_ambassador_points_events" ON "public"."ambassador_points_events" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_ambassador_rewards" ON "public"."ambassador_rewards" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_ambassadors" ON "public"."ambassadors" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_event_opening_notifications" ON "public"."event_opening_notifications" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_push_subscriptions" ON "public"."push_subscriptions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_registration_documents" ON "public"."registration_documents" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_volunteer_applications" ON "public"."volunteer_applications" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."site_promotions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."upsells" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."volunteer_applications" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."admin_overview_safe"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_overview_safe"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_overview_safe"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_overview_safe"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ambassador_ensure_rewards"("p_ambassador_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ambassador_ensure_rewards"("p_ambassador_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ambassador_ensure_rewards"("p_ambassador_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ambassador_ensure_rewards"("p_ambassador_id" "uuid", "p_edition" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ambassador_ensure_rewards"("p_ambassador_id" "uuid", "p_edition" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ambassador_ensure_rewards"("p_ambassador_id" "uuid", "p_edition" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ambassador_points_for_format"("p_format" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ambassador_points_for_format"("p_format" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ambassador_points_for_format"("p_format" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ambassador_reward_level_for_points"("p_total_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."ambassador_reward_level_for_points"("p_total_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ambassador_reward_level_for_points"("p_total_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."ambassador_sync_points"("p_ambassador_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ambassador_sync_points"("p_ambassador_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ambassador_sync_points"("p_ambassador_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ambassador_sync_points"("p_ambassador_id" "uuid", "p_edition" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ambassador_sync_points"("p_ambassador_id" "uuid", "p_edition" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ambassador_sync_points"("p_ambassador_id" "uuid", "p_edition" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_open_wave_to_order"("p_event_id" "uuid", "p_order_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."assign_open_wave_to_order"("p_event_id" "uuid", "p_order_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_open_wave_to_order"("p_event_id" "uuid", "p_order_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_open_wave_to_registration"("p_event_id" "uuid", "p_registration_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."assign_open_wave_to_registration"("p_event_id" "uuid", "p_registration_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_open_wave_to_registration"("p_event_id" "uuid", "p_registration_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_open_wave_to_registration"("p_event_id" "uuid", "p_registration_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer, "p_preferred_start" timestamp with time zone, "p_preferred_end" timestamp with time zone, "p_latest_allowed" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."assign_open_wave_to_registration"("p_event_id" "uuid", "p_registration_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer, "p_preferred_start" timestamp with time zone, "p_preferred_end" timestamp with time zone, "p_latest_allowed" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_open_wave_to_registration"("p_event_id" "uuid", "p_registration_id" "uuid", "p_first_departure" timestamp with time zone, "p_wave_count" integer, "p_interval_minutes" integer, "p_default_capacity" integer, "p_preferred_start" timestamp with time zone, "p_preferred_end" timestamp with time zone, "p_latest_allowed" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."award_ambassador_points_for_order"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."award_ambassador_points_for_order"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_ambassador_points_for_order"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_advance_tier_progression"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_advance_tier_progression"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_advance_tier_progression"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification_preferences_for_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_preferences_for_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_preferences_for_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_single_promocode_per_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_single_promocode_per_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_single_promocode_per_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_bootcamps_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_bootcamps_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_bootcamps_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_tier_promo_code"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_tier_promo_code"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_tier_promo_code"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_list_subscriber_count"("list_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_list_subscriber_count"("list_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_list_subscriber_count"("list_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_notification_preferences"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_notification_preferences"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_notification_preferences"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_registrations_with_filters"("args" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."get_registrations_with_filters"("args" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_registrations_with_filters"("args" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_promo_code_usage"("promo_code_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_promo_code_usage"("promo_code_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_promo_code_usage"("promo_code_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_subscribed"("user_uuid" "uuid", "list_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_subscribed"("user_uuid" "uuid", "list_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_subscribed"("user_uuid" "uuid", "list_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."manage_subscription_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."manage_subscription_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_subscription_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."merge_email_subscriptions_to_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."merge_email_subscriptions_to_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."merge_email_subscriptions_to_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."merge_list_subscriptions_before_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."merge_list_subscriptions_before_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."merge_list_subscriptions_before_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_site_promotions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_site_promotions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_site_promotions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_notification_prefs_to_lists"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_notification_prefs_to_lists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_notification_prefs_to_lists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_orders_award_ambassador_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_orders_award_ambassador_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_orders_award_ambassador_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_registrations_award_ambassador_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_registrations_award_ambassador_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_registrations_award_ambassador_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_check_tier_progression"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_check_tier_progression"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_check_tier_progression"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_distribution_lists_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_distribution_lists_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_distribution_lists_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_price_tiers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_price_tiers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_price_tiers_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_list_subscriptions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_list_subscriptions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_list_subscriptions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notification_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_promo_code_usage_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_promo_code_usage_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_promo_code_usage_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_request_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_request_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_request_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ambassador_manual_referrals" TO "anon";
GRANT ALL ON TABLE "public"."ambassador_manual_referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."ambassador_manual_referrals" TO "service_role";



GRANT ALL ON TABLE "public"."ambassador_points" TO "anon";
GRANT ALL ON TABLE "public"."ambassador_points" TO "authenticated";
GRANT ALL ON TABLE "public"."ambassador_points" TO "service_role";



GRANT ALL ON TABLE "public"."ambassador_points_events" TO "anon";
GRANT ALL ON TABLE "public"."ambassador_points_events" TO "authenticated";
GRANT ALL ON TABLE "public"."ambassador_points_events" TO "service_role";



GRANT ALL ON TABLE "public"."ambassador_promotional_codes" TO "anon";
GRANT ALL ON TABLE "public"."ambassador_promotional_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."ambassador_promotional_codes" TO "service_role";



GRANT ALL ON TABLE "public"."ambassador_rewards" TO "anon";
GRANT ALL ON TABLE "public"."ambassador_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."ambassador_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."ambassadors" TO "anon";
GRANT ALL ON TABLE "public"."ambassadors" TO "authenticated";
GRANT ALL ON TABLE "public"."ambassadors" TO "service_role";



GRANT ALL ON TABLE "public"."bootcamp_registrations" TO "anon";
GRANT ALL ON TABLE "public"."bootcamp_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."bootcamp_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."bootcamps" TO "anon";
GRANT ALL ON TABLE "public"."bootcamps" TO "authenticated";
GRANT ALL ON TABLE "public"."bootcamps" TO "service_role";



GRANT ALL ON TABLE "public"."distribution_lists" TO "anon";
GRANT ALL ON TABLE "public"."distribution_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."distribution_lists" TO "service_role";



GRANT ALL ON TABLE "public"."list_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."list_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."list_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."distribution_lists_stats" TO "service_role";



GRANT ALL ON TABLE "public"."email_logs" TO "anon";
GRANT ALL ON TABLE "public"."email_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."email_logs" TO "service_role";



GRANT ALL ON TABLE "public"."event_opening_notifications" TO "anon";
GRANT ALL ON TABLE "public"."event_opening_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."event_opening_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."event_price_tiers" TO "anon";
GRANT ALL ON TABLE "public"."event_price_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."event_price_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."event_races" TO "anon";
GRANT ALL ON TABLE "public"."event_races" TO "authenticated";
GRANT ALL ON TABLE "public"."event_races" TO "service_role";



GRANT ALL ON TABLE "public"."event_ratings" TO "anon";
GRANT ALL ON TABLE "public"."event_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."event_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."event_waves" TO "anon";
GRANT ALL ON TABLE "public"."event_waves" TO "authenticated";
GRANT ALL ON TABLE "public"."event_waves" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."import_logs" TO "anon";
GRANT ALL ON TABLE "public"."import_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."import_logs" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."my_notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."my_notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."my_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."my_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."obstacles" TO "anon";
GRANT ALL ON TABLE "public"."obstacles" TO "authenticated";
GRANT ALL ON TABLE "public"."obstacles" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders_with_details" TO "anon";
GRANT ALL ON TABLE "public"."orders_with_details" TO "authenticated";
GRANT ALL ON TABLE "public"."orders_with_details" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promotional_code_events" TO "anon";
GRANT ALL ON TABLE "public"."promotional_code_events" TO "authenticated";
GRANT ALL ON TABLE "public"."promotional_code_events" TO "service_role";



GRANT ALL ON TABLE "public"."promotional_code_usage" TO "anon";
GRANT ALL ON TABLE "public"."promotional_code_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."promotional_code_usage" TO "service_role";



GRANT ALL ON TABLE "public"."promotional_codes" TO "anon";
GRANT ALL ON TABLE "public"."promotional_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promotional_codes" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."race_obstacles" TO "anon";
GRANT ALL ON TABLE "public"."race_obstacles" TO "authenticated";
GRANT ALL ON TABLE "public"."race_obstacles" TO "service_role";



GRANT ALL ON TABLE "public"."races" TO "anon";
GRANT ALL ON TABLE "public"."races" TO "authenticated";
GRANT ALL ON TABLE "public"."races" TO "service_role";



GRANT ALL ON TABLE "public"."registration_documents" TO "anon";
GRANT ALL ON TABLE "public"."registration_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_documents" TO "service_role";



GRANT ALL ON TABLE "public"."registration_signatures" TO "anon";
GRANT ALL ON TABLE "public"."registration_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_signatures" TO "service_role";



GRANT ALL ON TABLE "public"."registration_upsells" TO "anon";
GRANT ALL ON TABLE "public"."registration_upsells" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_upsells" TO "service_role";



GRANT ALL ON TABLE "public"."site_promotions" TO "anon";
GRANT ALL ON TABLE "public"."site_promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."site_promotions" TO "service_role";



GRANT ALL ON TABLE "public"."upsells" TO "anon";
GRANT ALL ON TABLE "public"."upsells" TO "authenticated";
GRANT ALL ON TABLE "public"."upsells" TO "service_role";



GRANT ALL ON TABLE "public"."user_notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."v_all_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."v_my_registrations" TO "anon";
GRANT ALL ON TABLE "public"."v_my_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."volunteer_applications" TO "anon";
GRANT ALL ON TABLE "public"."volunteer_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."volunteer_applications" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































