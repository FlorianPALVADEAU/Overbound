-- Transfer one registration from RANKED ticket to OPEN ticket (same event)
-- Safe-by-default with dry-run and strict validations.
--
-- Usage:
-- 1) Edit the PARAMS section below.
-- 2) If the participant is not part of an anchored group, resolve their
--    chosen SAS wave_index up front (v_wave_index) — this script no longer
--    auto-picks a wave; wave choice is a participant decision (FDR-0012).
-- 3) Run in SQL editor / psql.
-- 4) Verify NOTICE output.
-- 5) Set v_dry_run := false and rerun.
--
-- IMPORTANT:
-- - This script updates registration/ticket/wave/bib assignment.
-- - It does NOT rebill/refund/order accounting differences.
-- - It refuses to transfer a registration that is already checked in
--   (checked_in = true) — never move someone mid/post-event.
-- - Wave assignment goes through assign_selected_wave_to_registration /
--   sync_registration_to_group_anchor (locked, atomic — FDR-0012). No
--   manual SELECT MAX(...) + UPDATE on event_waves counters.
-- - Bib number goes through transfer_bib_number (locked, atomic, all-or-
--   nothing — FDR-0011). The RANKED bib is released and a new OPEN bib is
--   assigned; if the OPEN format has no bib capacity left, the whole
--   transfer rolls back and the registration keeps its original ticket,
--   wave and bib.

BEGIN;

DO $$
DECLARE
  -- =========================
  -- PARAMS (edit these)
  -- =========================
  v_registration_id uuid := '00000000-0000-0000-0000-000000000000';
  -- Optional explicit OPEN ticket id. Keep NULL to auto-resolve.
  v_open_ticket_id uuid := NULL;
  -- Required when the participant is NOT in an anchored group: the
  -- wave_index they chose. Ignored (and may be left NULL) when an anchor
  -- applies, since the anchor always wins (FDR-0005/FDR-0012 §3.3).
  v_wave_index integer := NULL;
  -- Keep TRUE for simulation first, then FALSE to apply.
  v_dry_run boolean := TRUE;

  -- =========================
  -- Internal vars
  -- =========================
  r record;
  t_open record;
  g_anchor record;
  v_open_bib_capacity integer;
  v_assignment json;
  v_new_bib integer;
BEGIN
  -- Lock the registration row we are about to mutate.
  SELECT
    reg.id,
    reg.user_id,
    reg.event_id,
    reg.ticket_id,
    reg.wave_index,
    reg.start_time,
    reg.checked_in,
    reg.bib_number,
    reg.race_format,
    t.name AS ticket_name,
    race.name AS race_name,
    race.distance_km AS race_distance_km,
    evt.date AS event_date,
    evt.open_bib_capacity AS event_open_bib_capacity
  INTO r
  FROM registrations reg
  JOIN tickets t ON t.id = reg.ticket_id
  LEFT JOIN races race ON race.id = t.race_id
  JOIN events evt ON evt.id = reg.event_id
  WHERE reg.id = v_registration_id
  FOR UPDATE OF reg;

  IF r.id IS NULL THEN
    RAISE EXCEPTION 'Registration % not found', v_registration_id;
  END IF;

  IF r.user_id IS NULL THEN
    RAISE EXCEPTION 'Registration % has NULL user_id; cannot map group/member logic safely', v_registration_id;
  END IF;

  IF r.checked_in THEN
    RAISE EXCEPTION 'Registration % is already checked in; refusing to transfer a checked-in participant', r.id;
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

  IF g_anchor.group_id IS NULL AND v_wave_index IS NULL THEN
    RAISE EXCEPTION 'Registration % has no group anchor on this event: v_wave_index must be set to the participant''s chosen SAS before running this script (FDR-0012)', r.id;
  END IF;

  v_open_bib_capacity := r.event_open_bib_capacity;
  IF v_open_bib_capacity IS NULL OR v_open_bib_capacity <= 0 THEN
    RAISE EXCEPTION 'Event % has no open_bib_capacity configured; cannot assign an OPEN bib number', r.event_id;
  END IF;

  RAISE NOTICE 'Registration=% user=% event=%', r.id, r.user_id, r.event_id;
  RAISE NOTICE 'Current ticket=% (% / %) bib_number=% race_format=%', r.ticket_id, COALESCE(r.ticket_name, 'n/a'), COALESCE(r.race_name, 'n/a'), COALESCE(r.bib_number::text, 'n/a'), COALESCE(r.race_format, 'n/a');
  RAISE NOTICE 'Target ticket=% (% / %)', t_open.id, COALESCE(t_open.name, 'n/a'), COALESCE(t_open.race_name, 'n/a');
  IF g_anchor.group_id IS NOT NULL THEN
    RAISE NOTICE 'Group anchor found: group=% wave_index=% start_time=% (overrides v_wave_index if set)', g_anchor.group_id, g_anchor.anchor_wave_index, g_anchor.anchor_start_time;
  ELSE
    RAISE NOTICE 'No group anchor found. Will assign to participant-chosen wave_index=%.', v_wave_index;
  END IF;

  IF v_dry_run THEN
    RAISE NOTICE 'DRY-RUN enabled: no data was modified.';
    RETURN;
  END IF;

  -- 1) Switch ticket, reset wave fields before reassignment. bib_number is
  --    intentionally left untouched here — transfer_bib_number() below
  --    handles it atomically together with the format flip.
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

  -- 2) Assign OPEN SAS via the atomic, locked RPCs (FDR-0012) — never a
  --    manual SELECT MAX(wave_position)+1 / event_waves counter UPDATE.
  IF g_anchor.group_id IS NOT NULL THEN
    PERFORM sync_registration_to_group_anchor(
      p_event_id := r.event_id,
      p_registration_id := r.id,
      p_wave_index := g_anchor.anchor_wave_index
    );
  ELSE
    PERFORM assign_selected_wave_to_registration(
      p_event_id := r.event_id,
      p_registration_id := r.id,
      p_wave_index := v_wave_index
    );
  END IF;

  -- 3) Transfer the bib number: release the RANKED bib, assign a new OPEN
  --    bib, atomically. Rolls back entirely if OPEN has no capacity left.
  v_new_bib := transfer_bib_number(
    p_registration_id := r.id,
    p_event_id := r.event_id,
    p_target_format := 'open',
    p_max_number := v_open_bib_capacity
  );

  SELECT reg.start_time, reg.wave_index, reg.bib_number
    INTO r.start_time, r.wave_index, r.bib_number
  FROM registrations reg
  WHERE reg.id = r.id;

  RAISE NOTICE 'DONE: registration % moved to OPEN ticket % with start_time=% wave_index=% bib_number=%',
    r.id, t_open.id, r.start_time, r.wave_index, r.bib_number;
END;
$$;

COMMIT;
