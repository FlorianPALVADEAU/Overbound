-- FDR-0012: participant-selected SAS OPEN. Replaces automatic bin-packing
-- for the OPEN format with an explicit wave_index chosen by the user,
-- revalidated and locked atomically at registration time. RANKED is
-- unaffected. See docs/fdr/FDR-0012-user-selected-open-wave.md.

-- Atomic selection: locks the target event_waves row, checks it is open
-- and has remaining capacity, then writes the registration in the same
-- transaction. No SELECT-then-UPDATE from application code.
CREATE OR REPLACE FUNCTION assign_selected_wave_to_registration(
  p_event_id uuid,
  p_registration_id uuid,
  p_wave_index integer
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_wave event_waves%ROWTYPE;
  v_position integer;
BEGIN
  SELECT * INTO v_wave
  FROM event_waves
  WHERE event_id = p_event_id AND wave_index = p_wave_index
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SELECTED_WAVE_UNAVAILABLE: wave % not found for event %', p_wave_index, p_event_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_wave.is_closed THEN
    RAISE EXCEPTION 'SELECTED_WAVE_UNAVAILABLE: wave % is closed for event %', p_wave_index, p_event_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_wave.assigned_count >= v_wave.capacity THEN
    RAISE EXCEPTION 'SELECTED_WAVE_UNAVAILABLE: wave % is full for event %', p_wave_index, p_event_id
      USING ERRCODE = 'check_violation';
  END IF;

  v_position := v_wave.assigned_count + 1;

  UPDATE event_waves
  SET assigned_count = assigned_count + 1,
      updated_at = now()
  WHERE event_id = p_event_id AND wave_index = p_wave_index;

  UPDATE registrations
  SET wave_index = p_wave_index,
      start_time = v_wave.start_time,
      wave_capacity = v_wave.capacity,
      wave_position = v_position,
      auto_assigned = false,
      assignment_constraint_breached = false
  WHERE id = p_registration_id;

  RETURN json_build_object(
    'wave_index', p_wave_index,
    'start_time', v_wave.start_time,
    'wave_capacity', v_wave.capacity,
    'wave_position', v_position
  );
END;
$$;

-- Hardens the pre-existing group-anchor path (FDR-0009 §1.2): joining a
-- registration onto an already-anchored group's wave must use the same
-- locked read-modify-write as a fresh selection, never a separate
-- SELECT count + application-computed UPDATE. Mirrors
-- assign_selected_wave_to_registration but does not enforce is_closed —
-- an anchor already committed to a wave must still be honorable even if
-- that wave was closed to new unanchored selections afterwards.
CREATE OR REPLACE FUNCTION sync_registration_to_group_anchor(
  p_event_id uuid,
  p_registration_id uuid,
  p_wave_index integer
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_wave event_waves%ROWTYPE;
  v_position integer;
BEGIN
  SELECT * INTO v_wave
  FROM event_waves
  WHERE event_id = p_event_id AND wave_index = p_wave_index
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GROUP_ANCHOR_WAVE_NOT_FOUND: wave % not found for event %', p_wave_index, p_event_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_position := v_wave.assigned_count + 1;

  UPDATE event_waves
  SET assigned_count = assigned_count + 1,
      updated_at = now()
  WHERE event_id = p_event_id AND wave_index = p_wave_index;

  UPDATE registrations
  SET wave_index = p_wave_index,
      start_time = v_wave.start_time,
      wave_capacity = v_wave.capacity,
      wave_position = v_position,
      auto_assigned = true,
      assignment_constraint_breached = false
  WHERE id = p_registration_id;

  RETURN json_build_object(
    'wave_index', p_wave_index,
    'start_time', v_wave.start_time,
    'wave_capacity', v_wave.capacity,
    'wave_position', v_position
  );
END;
$$;
