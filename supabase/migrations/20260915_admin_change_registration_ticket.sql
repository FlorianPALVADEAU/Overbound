-- Atomic admin ticket switch. OPEN assignments use the production allocator or
-- an existing group anchor; RANKED registrations never retain wave fields.
CREATE OR REPLACE FUNCTION public.admin_change_registration_ticket(
  p_registration_id uuid,
  p_ticket_id uuid
)
RETURNS TABLE (
  registration_id uuid,
  ticket_id uuid,
  ticket_format text,
  wave_index integer,
  start_time timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registration record;
  v_ticket record;
  v_anchor record;
  v_wave_position integer;
  v_format text;
  v_first_departure timestamptz;
  v_last_departure timestamptz;
BEGIN
  SELECT r.id, r.user_id, r.event_id, r.ticket_id, r.distance_ideal_km,
         r.distance_min_km, e.date AS event_date
    INTO v_registration
    FROM registrations r
    JOIN events e ON e.id = r.event_id
   WHERE r.id = p_registration_id
   FOR UPDATE;

  IF v_registration.id IS NULL THEN
    RAISE EXCEPTION 'Registration % not found', p_registration_id USING ERRCODE = 'P0002';
  END IF;

  SELECT t.id, t.event_id, t.name AS ticket_name, race.name AS race_name
    INTO v_ticket
    FROM tickets t
    LEFT JOIN races race ON race.id = t.race_id
   WHERE t.id = p_ticket_id;

  IF v_ticket.id IS NULL THEN
    RAISE EXCEPTION 'Ticket % not found', p_ticket_id USING ERRCODE = 'P0002';
  END IF;
  IF v_ticket.event_id <> v_registration.event_id THEN
    RAISE EXCEPTION 'The target ticket must belong to the same event' USING ERRCODE = '22023';
  END IF;
  IF p_ticket_id = v_registration.ticket_id THEN
    RAISE EXCEPTION 'The registration already uses this ticket' USING ERRCODE = '22023';
  END IF;

  IF position('open' in lower(coalesce(v_ticket.ticket_name, '') || ' ' || coalesce(v_ticket.race_name, ''))) > 0
     AND position('ranked' in lower(coalesce(v_ticket.ticket_name, '') || ' ' || coalesce(v_ticket.race_name, ''))) = 0 THEN
    v_format := 'open';
  ELSIF position('ranked' in lower(coalesce(v_ticket.ticket_name, '') || ' ' || coalesce(v_ticket.race_name, ''))) > 0
     AND position('open' in lower(coalesce(v_ticket.ticket_name, '') || ' ' || coalesce(v_ticket.race_name, ''))) = 0 THEN
    v_format := 'ranked';
  ELSE
    RAISE EXCEPTION 'Target ticket must be explicitly OPEN or RANKED' USING ERRCODE = '22023';
  END IF;

  v_first_departure := (date_trunc('day', v_registration.event_date AT TIME ZONE 'Europe/Paris') + interval '12 hour') AT TIME ZONE 'Europe/Paris';
  v_last_departure := (date_trunc('day', v_registration.event_date AT TIME ZONE 'Europe/Paris') + interval '15 hour 50 minute') AT TIME ZONE 'Europe/Paris';

  IF v_format = 'ranked' THEN
    UPDATE registrations
       SET ticket_id = v_ticket.id,
           start_time = (date_trunc('day', v_registration.event_date AT TIME ZONE 'Europe/Paris') + interval '8 hour') AT TIME ZONE 'Europe/Paris',
           wave_index = NULL,
           wave_capacity = NULL,
           wave_position = NULL,
           auto_assigned = NULL,
           preferred_window_start = NULL,
           preferred_window_end = NULL,
           latest_allowed_time = NULL,
           assignment_constraint_breached = FALSE
     WHERE id = v_registration.id;
  ELSE
    SELECT g.id, g.anchor_wave_index, g.anchor_start_time
      INTO v_anchor
      FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
     WHERE gm.profile_id = v_registration.user_id
       AND g.anchor_event_id = v_registration.event_id
       AND g.anchor_wave_index IS NOT NULL
       AND g.anchor_start_time IS NOT NULL
     ORDER BY gm.joined_at DESC
     LIMIT 1;

    UPDATE registrations
       SET ticket_id = v_ticket.id,
           start_time = NULL,
           wave_index = NULL,
           wave_capacity = NULL,
           wave_position = NULL,
           auto_assigned = TRUE,
           preferred_window_start = NULL,
           preferred_window_end = NULL,
           latest_allowed_time = NULL,
           assignment_constraint_breached = FALSE
     WHERE id = v_registration.id;

    IF v_anchor.id IS NOT NULL THEN
      SELECT coalesce(max(r.wave_position), 0) + 1
        INTO v_wave_position
        FROM registrations r
        JOIN tickets t ON t.id = r.ticket_id
        LEFT JOIN races race ON race.id = t.race_id
       WHERE r.event_id = v_registration.event_id
         AND r.wave_index = v_anchor.anchor_wave_index
         AND position('open' in lower(coalesce(t.name, '') || ' ' || coalesce(race.name, ''))) > 0;

      UPDATE registrations
         SET start_time = v_anchor.anchor_start_time,
             wave_index = v_anchor.anchor_wave_index,
             wave_capacity = 50,
             wave_position = v_wave_position,
             auto_assigned = TRUE
       WHERE id = v_registration.id;
    ELSE
      PERFORM * FROM assign_open_wave_to_registration(
        p_event_id := v_registration.event_id,
        p_registration_id := v_registration.id,
        p_first_departure := v_first_departure,
        p_wave_count := 24,
        p_interval_minutes := 10,
        p_default_capacity := 50,
        p_preferred_start := v_first_departure,
        p_preferred_end := v_last_departure,
        p_latest_allowed := v_last_departure
      );
    END IF;
  END IF;

  UPDATE event_waves ew
     SET assigned_count = sub.open_count,
         updated_at = now()
    FROM (
      SELECT ew2.event_id, ew2.wave_index, count(r.id)::int AS open_count
        FROM event_waves ew2
        LEFT JOIN registrations r ON r.event_id = ew2.event_id AND r.wave_index = ew2.wave_index
        LEFT JOIN tickets t ON t.id = r.ticket_id
        LEFT JOIN races race ON race.id = t.race_id
       WHERE ew2.event_id = v_registration.event_id
         AND (r.id IS NULL OR position('open' in lower(coalesce(t.name, '') || ' ' || coalesce(race.name, ''))) > 0)
       GROUP BY ew2.event_id, ew2.wave_index
    ) sub
   WHERE ew.event_id = sub.event_id AND ew.wave_index = sub.wave_index;

  RETURN QUERY
  SELECT r.id, r.ticket_id, v_format, r.wave_index, r.start_time
    FROM registrations r
   WHERE r.id = v_registration.id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_registration_ticket(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_change_registration_ticket(uuid, uuid) TO service_role;

-- A manual SAS move is deliberately limited to OPEN participants without a
-- group anchor. Changing an anchored participant alone would break the group's
-- departure promise; move the group anchor through the group admin flow instead.
CREATE OR REPLACE FUNCTION public.admin_move_open_registration_wave(
  p_registration_id uuid,
  p_wave_index integer
)
RETURNS TABLE (registration_id uuid, wave_index integer, start_time timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registration record;
  v_wave record;
  v_anchor record;
  v_position integer;
BEGIN
  SELECT r.id, r.user_id, r.event_id, t.name AS ticket_name, race.name AS race_name
    INTO v_registration
    FROM registrations r
    JOIN tickets t ON t.id = r.ticket_id
    LEFT JOIN races race ON race.id = t.race_id
   WHERE r.id = p_registration_id
   FOR UPDATE;

  IF v_registration.id IS NULL THEN
    RAISE EXCEPTION 'Registration % not found', p_registration_id USING ERRCODE = 'P0002';
  END IF;
  IF position('open' in lower(coalesce(v_registration.ticket_name, '') || ' ' || coalesce(v_registration.race_name, ''))) = 0 THEN
    RAISE EXCEPTION 'Only OPEN registrations can be moved between SAS' USING ERRCODE = '22023';
  END IF;

  SELECT g.id INTO v_anchor
    FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
   WHERE gm.profile_id = v_registration.user_id
     AND g.anchor_event_id = v_registration.event_id
     AND g.anchor_wave_index IS NOT NULL
   LIMIT 1;
  IF v_anchor.id IS NOT NULL THEN
    RAISE EXCEPTION 'This participant follows a group SAS. Move the group anchor instead.' USING ERRCODE = '22023';
  END IF;

  SELECT ew.wave_index, ew.start_time, ew.capacity, ew.assigned_count, ew.is_closed
    INTO v_wave
    FROM event_waves ew
   WHERE ew.event_id = v_registration.event_id AND ew.wave_index = p_wave_index
   FOR UPDATE;
  IF v_wave.wave_index IS NULL THEN
    RAISE EXCEPTION 'SAS % does not exist for this event', p_wave_index USING ERRCODE = 'P0002';
  END IF;
  IF v_wave.is_closed OR v_wave.assigned_count >= v_wave.capacity THEN
    RAISE EXCEPTION 'This SAS is full or closed' USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(max(r.wave_position), 0) + 1 INTO v_position
    FROM registrations r
   WHERE r.event_id = v_registration.event_id AND r.wave_index = p_wave_index AND r.id <> v_registration.id;

  UPDATE registrations
     SET wave_index = v_wave.wave_index,
         start_time = v_wave.start_time,
         wave_capacity = v_wave.capacity,
         wave_position = v_position,
         auto_assigned = FALSE,
         assignment_constraint_breached = FALSE
   WHERE id = v_registration.id;

  UPDATE event_waves ew
     SET assigned_count = sub.open_count, updated_at = now()
    FROM (
      SELECT ew2.event_id, ew2.wave_index, count(r.id)::int AS open_count
        FROM event_waves ew2
        LEFT JOIN registrations r ON r.event_id = ew2.event_id AND r.wave_index = ew2.wave_index
        LEFT JOIN tickets t ON t.id = r.ticket_id
        LEFT JOIN races race ON race.id = t.race_id
       WHERE ew2.event_id = v_registration.event_id
         AND (r.id IS NULL OR position('open' in lower(coalesce(t.name, '') || ' ' || coalesce(race.name, ''))) > 0)
       GROUP BY ew2.event_id, ew2.wave_index
    ) sub
   WHERE ew.event_id = sub.event_id AND ew.wave_index = sub.wave_index;

  RETURN QUERY SELECT r.id, r.wave_index, r.start_time FROM registrations r WHERE r.id = v_registration.id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_move_open_registration_wave(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_move_open_registration_wave(uuid, integer) TO service_role;
