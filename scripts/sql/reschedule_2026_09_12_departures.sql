-- Reschedule the 2026-09-12 event departures:
-- - RANKED: single start at 08:00 Europe/Paris
-- - OPEN: same 24 SAS, first start at 12:00, 10-minute interval, last start at 15:50
--
-- Safe-by-default with dry-run and strict validations.
--
-- Usage:
-- 1) Keep v_dry_run := TRUE and run the script.
-- 2) Review NOTICE output carefully.
-- 3) If the event date matches multiple events, set v_event_id explicitly.
-- 4) Set v_dry_run := FALSE and rerun only after validation.
--
-- IMPORTANT:
-- - This mutates existing tickets/registrations display data through start times.
-- - It does NOT send emails. Participant communication must be handled separately.
-- - It preserves OPEN wave_index/wave_position order and only shifts wave start times.

BEGIN;

DO $$
DECLARE
  -- =========================
  -- PARAMS (edit if needed)
  -- =========================
  v_event_id uuid := NULL;
  v_event_local_date date := DATE '2026-09-12';
  v_ranked_departure time := TIME '08:00';
  v_open_first_departure time := TIME '12:00';
  v_open_wave_count integer := 24;
  v_open_interval_minutes integer := 10;
  v_dry_run boolean := TRUE;

  -- =========================
  -- Internal vars
  -- =========================
  v_operation_id uuid := gen_random_uuid();
  v_operation_label text := '2026-09-12-ranked-0800-open-1200';
  v_event record;
  v_event_day date;
  v_matching_events integer;
  v_wave_count integer;
  v_min_wave_index integer;
  v_max_wave_index integer;
  v_current_first_wave timestamptz;
  v_current_last_wave timestamptz;
  v_ranked_start timestamptz;
  v_open_first_start timestamptz;
  v_open_last_start timestamptz;
  v_open_registration_count integer;
  v_ranked_registration_count integer;
  v_group_anchor_count integer;
  v_open_null_wave_count integer;
  v_open_missing_wave_count integer;
  v_group_missing_wave_count integer;
BEGIN
  IF v_event_id IS NULL THEN
    SELECT COUNT(*)
      INTO v_matching_events
    FROM events e
    WHERE (e.date AT TIME ZONE 'Europe/Paris')::date = v_event_local_date;

    IF v_matching_events <> 1 THEN
      RAISE EXCEPTION 'Expected exactly 1 event on %, found %. Set v_event_id explicitly.',
        v_event_local_date,
        v_matching_events;
    END IF;

    SELECT e.id, e.title, e.date
      INTO v_event
    FROM events e
    WHERE (e.date AT TIME ZONE 'Europe/Paris')::date = v_event_local_date
    LIMIT 1;
  ELSE
    SELECT e.id, e.title, e.date
      INTO v_event
    FROM events e
    WHERE e.id = v_event_id;

    IF v_event.id IS NULL THEN
      RAISE EXCEPTION 'Event % not found', v_event_id;
    END IF;
  END IF;

  v_event_day := (v_event.date AT TIME ZONE 'Europe/Paris')::date;
  v_ranked_start := (v_event_day + v_ranked_departure) AT TIME ZONE 'Europe/Paris';
  v_open_first_start := (v_event_day + v_open_first_departure) AT TIME ZONE 'Europe/Paris';
  v_open_last_start := v_open_first_start + ((v_open_wave_count - 1) * v_open_interval_minutes * interval '1 minute');

  SELECT
    COUNT(*)::integer,
    MIN(ew.wave_index),
    MAX(ew.wave_index),
    MIN(ew.start_time),
    MAX(ew.start_time)
  INTO
    v_wave_count,
    v_min_wave_index,
    v_max_wave_index,
    v_current_first_wave,
    v_current_last_wave
  FROM event_waves ew
  WHERE ew.event_id = v_event.id;

  IF v_wave_count <> v_open_wave_count THEN
    RAISE EXCEPTION 'Expected % OPEN waves for event %, found %',
      v_open_wave_count,
      v_event.id,
      COALESCE(v_wave_count, 0);
  END IF;

  WITH registration_formats AS (
    SELECT
      reg.id,
      reg.wave_index,
      POSITION('open' IN LOWER(COALESCE(t.name, '') || ' ' || COALESCE(race.name, ''))) > 0 AS is_open,
      POSITION('ranked' IN LOWER(COALESCE(t.name, '') || ' ' || COALESCE(race.name, ''))) > 0 AS is_ranked
    FROM registrations reg
    JOIN tickets t ON t.id = reg.ticket_id
    LEFT JOIN races race ON race.id = t.race_id
    WHERE reg.event_id = v_event.id
  )
  SELECT
    COUNT(*) FILTER (WHERE is_open)::integer,
    COUNT(*) FILTER (WHERE is_ranked)::integer,
    COUNT(*) FILTER (WHERE is_open AND wave_index IS NULL)::integer
  INTO
    v_open_registration_count,
    v_ranked_registration_count,
    v_open_null_wave_count
  FROM registration_formats;

  SELECT COUNT(*)::integer
    INTO v_open_missing_wave_count
  FROM registrations reg
  JOIN tickets t ON t.id = reg.ticket_id
  LEFT JOIN races race ON race.id = t.race_id
  LEFT JOIN event_waves ew
    ON ew.event_id = reg.event_id
   AND ew.wave_index = reg.wave_index
  WHERE reg.event_id = v_event.id
    AND POSITION('open' IN LOWER(COALESCE(t.name, '') || ' ' || COALESCE(race.name, ''))) > 0
    AND reg.wave_index IS NOT NULL
    AND ew.event_id IS NULL;

  SELECT COUNT(*)::integer
    INTO v_group_anchor_count
  FROM groups g
  WHERE g.anchor_event_id = v_event.id
    AND g.anchor_wave_index IS NOT NULL;

  SELECT COUNT(*)::integer
    INTO v_group_missing_wave_count
  FROM groups g
  LEFT JOIN event_waves ew
    ON ew.event_id = g.anchor_event_id
   AND ew.wave_index = g.anchor_wave_index
  WHERE g.anchor_event_id = v_event.id
    AND g.anchor_wave_index IS NOT NULL
    AND ew.event_id IS NULL;

  IF v_open_null_wave_count > 0 THEN
    RAISE EXCEPTION 'Found % OPEN registrations without wave_index for event %. Fix before rescheduling.',
      v_open_null_wave_count,
      v_event.id;
  END IF;

  IF v_open_missing_wave_count > 0 THEN
    RAISE EXCEPTION 'Found % OPEN registrations whose wave_index does not exist in event_waves for event %.',
      v_open_missing_wave_count,
      v_event.id;
  END IF;

  IF v_group_missing_wave_count > 0 THEN
    RAISE EXCEPTION 'Found % group anchors whose wave_index does not exist in event_waves for event %.',
      v_group_missing_wave_count,
      v_event.id;
  END IF;

  RAISE NOTICE 'Event=% title=% current_date=% local_day=%', v_event.id, v_event.title, v_event.date, v_event_day;
  RAISE NOTICE 'Current OPEN wave range: % -> % (count=%, wave_index range=%..%)',
    v_current_first_wave,
    v_current_last_wave,
    v_wave_count,
    v_min_wave_index,
    v_max_wave_index;
  RAISE NOTICE 'Target RANKED start=%', v_ranked_start;
  RAISE NOTICE 'Target OPEN wave range=% -> % (count=%, interval=% min)',
    v_open_first_start,
    v_open_last_start,
    v_open_wave_count,
    v_open_interval_minutes;
  RAISE NOTICE 'Affected rows: OPEN registrations=%, RANKED registrations=%, group anchors=%',
    v_open_registration_count,
    v_ranked_registration_count,
    v_group_anchor_count;

  IF v_dry_run THEN
    RAISE NOTICE 'DRY-RUN enabled: no data was modified.';
    RETURN;
  END IF;

  CREATE TABLE IF NOT EXISTS event_departure_reschedule_backups (
    operation_id uuid NOT NULL,
    operation_label text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    event_id uuid NOT NULL,
    table_name text NOT NULL,
    row_id uuid NOT NULL,
    row_data jsonb NOT NULL,
    PRIMARY KEY (operation_id, table_name, row_id)
  );

  INSERT INTO event_departure_reschedule_backups (
    operation_id,
    operation_label,
    event_id,
    table_name,
    row_id,
    row_data
  )
  SELECT v_operation_id, v_operation_label, v_event.id, 'events', e.id, to_jsonb(e)
  FROM events e
  WHERE e.id = v_event.id;

  INSERT INTO event_departure_reschedule_backups (
    operation_id,
    operation_label,
    event_id,
    table_name,
    row_id,
    row_data
  )
  SELECT v_operation_id, v_operation_label, v_event.id, 'event_waves', ew.id, to_jsonb(ew)
  FROM event_waves ew
  WHERE ew.event_id = v_event.id;

  INSERT INTO event_departure_reschedule_backups (
    operation_id,
    operation_label,
    event_id,
    table_name,
    row_id,
    row_data
  )
  SELECT v_operation_id, v_operation_label, v_event.id, 'registrations', reg.id, to_jsonb(reg)
  FROM registrations reg
  JOIN tickets t ON t.id = reg.ticket_id
  LEFT JOIN races race ON race.id = t.race_id
  WHERE reg.event_id = v_event.id
    AND (
      POSITION('open' IN LOWER(COALESCE(t.name, '') || ' ' || COALESCE(race.name, ''))) > 0
      OR POSITION('ranked' IN LOWER(COALESCE(t.name, '') || ' ' || COALESCE(race.name, ''))) > 0
    );

  INSERT INTO event_departure_reschedule_backups (
    operation_id,
    operation_label,
    event_id,
    table_name,
    row_id,
    row_data
  )
  SELECT v_operation_id, v_operation_label, v_event.id, 'groups', g.id, to_jsonb(g)
  FROM groups g
  WHERE g.anchor_event_id = v_event.id;

  UPDATE events
  SET
    date = v_ranked_start,
    updated_at = NOW()
  WHERE id = v_event.id;

  WITH new_wave_times AS (
    SELECT
      ew.id,
      v_open_first_start + ((ew.wave_index - v_min_wave_index) * v_open_interval_minutes * interval '1 minute') AS new_start_time
    FROM event_waves ew
    WHERE ew.event_id = v_event.id
  )
  UPDATE event_waves ew
  SET
    start_time = nwt.new_start_time,
    updated_at = NOW()
  FROM new_wave_times nwt
  WHERE ew.id = nwt.id;

  WITH open_registration_updates AS (
    SELECT
      reg.id,
      ew.start_time AS new_start_time,
      ew.capacity AS new_wave_capacity,
      CASE
        WHEN reg.distance_ideal_km IS NULL THEN v_open_first_start
        WHEN reg.distance_ideal_km >= 20 THEN v_open_first_start
        WHEN reg.distance_ideal_km >= 10 THEN v_open_first_start + interval '60 minutes'
        ELSE v_open_first_start + interval '120 minutes'
      END AS new_preferred_start,
      CASE
        WHEN reg.distance_ideal_km IS NULL THEN v_open_last_start
        WHEN reg.distance_ideal_km >= 20 THEN v_open_first_start + interval '90 minutes'
        WHEN reg.distance_ideal_km >= 10 THEN v_open_first_start + interval '150 minutes'
        ELSE v_open_last_start
      END AS new_preferred_end,
      CASE
        WHEN reg.distance_min_km IS NULL THEN v_open_last_start
        WHEN reg.distance_min_km >= 20 THEN v_open_first_start + interval '90 minutes'
        WHEN reg.distance_min_km >= 10 THEN v_open_first_start + interval '150 minutes'
        ELSE v_open_last_start
      END AS new_latest_allowed
    FROM registrations reg
    JOIN tickets t ON t.id = reg.ticket_id
    LEFT JOIN races race ON race.id = t.race_id
    JOIN event_waves ew
      ON ew.event_id = reg.event_id
     AND ew.wave_index = reg.wave_index
    WHERE reg.event_id = v_event.id
      AND POSITION('open' IN LOWER(COALESCE(t.name, '') || ' ' || COALESCE(race.name, ''))) > 0
  )
  UPDATE registrations reg
  SET
    start_time = updates.new_start_time,
    wave_capacity = updates.new_wave_capacity,
    preferred_window_start = updates.new_preferred_start,
    preferred_window_end = updates.new_preferred_end,
    latest_allowed_time = updates.new_latest_allowed,
    auto_assigned = COALESCE(reg.auto_assigned, TRUE)
  FROM open_registration_updates updates
  WHERE reg.id = updates.id;

  UPDATE registrations reg
  SET
    start_time = v_ranked_start,
    wave_index = NULL,
    wave_capacity = NULL,
    wave_position = NULL,
    preferred_window_start = NULL,
    preferred_window_end = NULL,
    latest_allowed_time = NULL,
    auto_assigned = TRUE,
    assignment_constraint_breached = FALSE
  FROM tickets t
  LEFT JOIN races race ON race.id = t.race_id
  WHERE reg.ticket_id = t.id
    AND reg.event_id = v_event.id
    AND POSITION('ranked' IN LOWER(COALESCE(t.name, '') || ' ' || COALESCE(race.name, ''))) > 0;

  UPDATE groups g
  SET
    anchor_start_time = ew.start_time,
    updated_at = NOW()
  FROM event_waves ew
  WHERE g.anchor_event_id = v_event.id
    AND ew.event_id = v_event.id
    AND ew.wave_index = g.anchor_wave_index;

  WITH open_wave_counts AS (
    SELECT
      ew2.id AS event_wave_id,
      COUNT(reg2.id)::int AS open_count
    FROM event_waves ew2
    LEFT JOIN registrations reg2
      ON reg2.event_id = ew2.event_id
     AND reg2.wave_index = ew2.wave_index
    LEFT JOIN tickets t2 ON t2.id = reg2.ticket_id
    LEFT JOIN races race2 ON race2.id = t2.race_id
    WHERE ew2.event_id = v_event.id
      AND (
        reg2.id IS NULL
        OR POSITION('open' IN LOWER(COALESCE(t2.name, '') || ' ' || COALESCE(race2.name, ''))) > 0
      )
    GROUP BY ew2.id
  )
  UPDATE event_waves ew
  SET
    assigned_count = owc.open_count,
    updated_at = NOW()
  FROM open_wave_counts owc
  WHERE ew.id = owc.event_wave_id;

  RAISE NOTICE 'DONE: operation_id=% backup_table=event_departure_reschedule_backups', v_operation_id;
END;
$$;

COMMIT;
