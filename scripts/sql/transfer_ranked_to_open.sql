-- Transfer one registration from RANKED ticket to OPEN ticket (same event)
-- Safe-by-default with dry-run and strict validations.
--
-- Usage:
-- 1) Edit the PARAMS section below.
-- 2) Run in SQL editor / psql.
-- 3) Verify NOTICE output.
-- 4) Set v_dry_run := false and rerun.
--
-- IMPORTANT:
-- - This script updates only the registration/ticket/wave assignment.
-- - It does NOT rebill/refund/order accounting differences.

BEGIN;

DO $$
DECLARE
  -- =========================
  -- PARAMS (edit these)
  -- =========================
  v_registration_id uuid := '00000000-0000-0000-0000-000000000000';
  -- Optional explicit OPEN ticket id. Keep NULL to auto-resolve.
  v_open_ticket_id uuid := NULL;
  -- Keep TRUE for simulation first, then FALSE to apply.
  v_dry_run boolean := TRUE;

  -- =========================
  -- Internal vars
  -- =========================
  r record;
  t_open record;
  g_anchor record;
  v_new_wave_position integer;
  v_new_start_time timestamptz;
  v_new_wave_index integer;
BEGIN
  -- Lock the registration row we are about to mutate.
  SELECT
    reg.id,
    reg.user_id,
    reg.event_id,
    reg.ticket_id,
    reg.wave_index,
    reg.start_time,
    reg.distance_ideal_km,
    reg.distance_min_km,
    t.name AS ticket_name,
    race.name AS race_name,
    race.distance_km AS race_distance_km,
    evt.date AS event_date
  INTO r
  FROM registrations reg
  JOIN tickets t ON t.id = reg.ticket_id
  LEFT JOIN races race ON race.id = t.race_id
  JOIN events evt ON evt.id = reg.event_id
  WHERE reg.id = v_registration_id
  FOR UPDATE;

  IF r.id IS NULL THEN
    RAISE EXCEPTION 'Registration % not found', v_registration_id;
  END IF;

  IF r.user_id IS NULL THEN
    RAISE EXCEPTION 'Registration % has NULL user_id; cannot map group/member logic safely', v_registration_id;
  END IF;

  -- Validate source format is ranked.
  IF POSITION('ranked' IN LOWER(COALESCE(r.ticket_name, '') || ' ' || COALESCE(r.race_name, ''))) = 0 THEN
    RAISE EXCEPTION 'Registration % is not on a RANKED ticket (ticket=%, race=%)', r.id, r.ticket_name, r.race_name;
  END IF;

  -- Resolve target OPEN ticket.
  IF v_open_ticket_id IS NOT NULL THEN
    SELECT
      t.id,
      t.name,
      race.name AS race_name,
      race.distance_km AS race_distance_km
    INTO t_open
    FROM tickets t
    LEFT JOIN races race ON race.id = t.race_id
    WHERE t.id = v_open_ticket_id
      AND t.event_id = r.event_id;

    IF t_open.id IS NULL THEN
      RAISE EXCEPTION 'Provided OPEN ticket id % does not exist on same event %', v_open_ticket_id, r.event_id;
    END IF;
  ELSE
    -- Auto-choice strategy:
    -- 1) same event
    -- 2) OPEN format ticket/race naming
    -- 3) prefer closest distance to current ranked race distance
    SELECT
      t.id,
      t.name,
      race.name AS race_name,
      race.distance_km AS race_distance_km
    INTO t_open
    FROM tickets t
    LEFT JOIN races race ON race.id = t.race_id
    WHERE t.event_id = r.event_id
      AND POSITION('open' IN LOWER(COALESCE(t.name, '') || ' ' || COALESCE(race.name, ''))) > 0
    ORDER BY
      CASE
        WHEN r.race_distance_km IS NULL OR race.distance_km IS NULL THEN 999999
        ELSE ABS(race.distance_km - r.race_distance_km)
      END ASC,
      t.created_at ASC
    LIMIT 1;

    IF t_open.id IS NULL THEN
      RAISE EXCEPTION 'No OPEN ticket found for event %', r.event_id;
    END IF;
  END IF;

  -- Validate target format is open.
  IF POSITION('open' IN LOWER(COALESCE(t_open.name, '') || ' ' || COALESCE(t_open.race_name, ''))) = 0 THEN
    RAISE EXCEPTION 'Target ticket % is not OPEN (ticket=%, race=%)', t_open.id, t_open.name, t_open.race_name;
  END IF;

  -- If member belongs to a group with an anchor on this event, force that anchor.
  SELECT
    g.id AS group_id,
    g.anchor_event_id,
    g.anchor_wave_index,
    g.anchor_start_time
  INTO g_anchor
  FROM group_members gm
  JOIN groups g ON g.id = gm.group_id
  WHERE gm.profile_id = r.user_id
    AND g.anchor_event_id = r.event_id
    AND g.anchor_wave_index IS NOT NULL
    AND g.anchor_start_time IS NOT NULL
  ORDER BY gm.joined_at DESC
  LIMIT 1;

  RAISE NOTICE 'Registration=% user=% event=%', r.id, r.user_id, r.event_id;
  RAISE NOTICE 'Current ticket=% (% / %)', r.ticket_id, COALESCE(r.ticket_name, 'n/a'), COALESCE(r.race_name, 'n/a');
  RAISE NOTICE 'Target ticket=% (% / %)', t_open.id, COALESCE(t_open.name, 'n/a'), COALESCE(t_open.race_name, 'n/a');
  IF g_anchor.group_id IS NOT NULL THEN
    RAISE NOTICE 'Group anchor found: group=% wave_index=% start_time=%', g_anchor.group_id, g_anchor.anchor_wave_index, g_anchor.anchor_start_time;
  ELSE
    RAISE NOTICE 'No group anchor found for this user on this event. SAS OPEN will be assigned by RPC.';
  END IF;

  IF v_dry_run THEN
    RAISE NOTICE 'DRY-RUN enabled: no data was modified.';
    RETURN;
  END IF;

  -- 1) Switch ticket + reset wave fields before reassignment.
  UPDATE registrations
  SET
    ticket_id = t_open.id,
    start_time = NULL,
    wave_index = NULL,
    wave_capacity = NULL,
    wave_position = NULL,
    auto_assigned = TRUE,
    preferred_window_start = NULL,
    preferred_window_end = NULL,
    latest_allowed_time = NULL,
    assignment_constraint_breached = FALSE
  WHERE id = r.id;

  -- 2) Assign OPEN SAS.
  IF g_anchor.group_id IS NOT NULL THEN
    -- Keep group coherence: force the registration on group's anchored wave.
    SELECT COALESCE(MAX(reg2.wave_position), 0) + 1
      INTO v_new_wave_position
    FROM registrations reg2
    JOIN tickets t2 ON t2.id = reg2.ticket_id
    LEFT JOIN races race2 ON race2.id = t2.race_id
    WHERE reg2.event_id = r.event_id
      AND reg2.wave_index = g_anchor.anchor_wave_index
      AND POSITION('open' IN LOWER(COALESCE(t2.name, '') || ' ' || COALESCE(race2.name, ''))) > 0;

    UPDATE registrations
    SET
      start_time = g_anchor.anchor_start_time,
      wave_index = g_anchor.anchor_wave_index,
      wave_capacity = 50,
      wave_position = v_new_wave_position,
      auto_assigned = TRUE,
      assignment_constraint_breached = FALSE
    WHERE id = r.id;
  ELSE
    -- Use existing production assignment logic.
    PERFORM *
    FROM assign_open_wave_to_registration(
      p_event_id := r.event_id,
      p_registration_id := r.id,
      p_first_departure := (
        date_trunc('day', r.event_date AT TIME ZONE 'Europe/Paris')
        + interval '8 hour'
      ) AT TIME ZONE 'Europe/Paris',
      p_wave_count := 24,
      p_interval_minutes := 10,
      p_default_capacity := 50,
      p_preferred_start := (
        date_trunc('day', r.event_date AT TIME ZONE 'Europe/Paris')
        + interval '8 hour'
      ) AT TIME ZONE 'Europe/Paris',
      p_preferred_end := (
        date_trunc('day', r.event_date AT TIME ZONE 'Europe/Paris')
        + interval '11 hour 50 minute'
      ) AT TIME ZONE 'Europe/Paris',
      p_latest_allowed := (
        date_trunc('day', r.event_date AT TIME ZONE 'Europe/Paris')
        + interval '11 hour 50 minute'
      ) AT TIME ZONE 'Europe/Paris'
    );
  END IF;

  -- 3) Refresh event_waves assigned_count for the event (OPEN registrations only).
  UPDATE event_waves ew
  SET
    assigned_count = sub.open_count,
    updated_at = NOW()
  FROM (
    SELECT
      ew2.event_id,
      ew2.wave_index,
      COUNT(reg3.id)::int AS open_count
    FROM event_waves ew2
    LEFT JOIN registrations reg3
      ON reg3.event_id = ew2.event_id
     AND reg3.wave_index = ew2.wave_index
    LEFT JOIN tickets t3 ON t3.id = reg3.ticket_id
    LEFT JOIN races race3 ON race3.id = t3.race_id
    WHERE ew2.event_id = r.event_id
      AND (
        reg3.id IS NULL
        OR POSITION('open' IN LOWER(COALESCE(t3.name, '') || ' ' || COALESCE(race3.name, ''))) > 0
      )
    GROUP BY ew2.event_id, ew2.wave_index
  ) AS sub
  WHERE ew.event_id = sub.event_id
    AND ew.wave_index = sub.wave_index;

  SELECT reg.start_time, reg.wave_index
    INTO v_new_start_time, v_new_wave_index
  FROM registrations reg
  WHERE reg.id = r.id;

  RAISE NOTICE 'DONE: registration % moved to OPEN ticket % with start_time=% wave_index=%',
    r.id, t_open.id, v_new_start_time, v_new_wave_index;
END $$;

COMMIT;
