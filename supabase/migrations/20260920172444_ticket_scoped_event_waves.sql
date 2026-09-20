-- Ticket-scoped departure waves.
-- Expand/migrate phase: preserves every existing wave and registration while
-- replacing the event-wide uniqueness boundary with (ticket_id, wave_index).

ALTER TABLE public.event_waves
  ADD COLUMN IF NOT EXISTS ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE;

CREATE TEMP TABLE legacy_event_waves ON COMMIT DROP AS
SELECT id, event_id, wave_index, start_time, capacity, assigned_count,
       is_closed, created_at, updated_at, organization_id
FROM public.event_waves
WHERE ticket_id IS NULL;

-- Remove only the obsolete event-wide unique constraint. The UUID primary key
-- remains untouched.
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.event_waves'::regclass
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) = 'UNIQUE (event_id, wave_index)'
  LOOP
    EXECUTE format('ALTER TABLE public.event_waves DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END;
$$;

DROP INDEX IF EXISTS public.event_waves_event_id_wave_index_key;

-- Reuse the original rows for one explicitly wave-enabled ticket per event.
-- Prefer the ticket already owning the most registrations so occupied rows
-- keep their physical identity.
WITH ticket_rank AS (
  SELECT t.id,
         t.event_id,
         row_number() OVER (
           PARTITION BY t.event_id
           ORDER BY count(r.id) DESC, t.created_at, t.id
         ) AS rank
  FROM public.tickets t
  LEFT JOIN public.registrations r ON r.ticket_id = t.id
  WHERE t.operations_config ->> 'departure_mode' = 'wave'
  GROUP BY t.id, t.event_id, t.created_at
)
UPDATE public.event_waves ew
SET ticket_id = ticket_rank.id
FROM ticket_rank
WHERE ew.ticket_id IS NULL
  AND ew.event_id = ticket_rank.event_id
  AND ticket_rank.rank = 1;

-- Clone the legacy schedule for every other wave-enabled ticket. Counters are
-- calculated from that ticket's registrations, never copied globally.
INSERT INTO public.event_waves (
  event_id, ticket_id, wave_index, start_time, capacity, assigned_count,
  is_closed, created_at, updated_at, organization_id
)
SELECT legacy.event_id,
       ticket.id,
       legacy.wave_index,
       legacy.start_time,
       legacy.capacity,
       count(registration.id)::integer,
       legacy.is_closed,
       legacy.created_at,
       now(),
       legacy.organization_id
FROM legacy_event_waves legacy
JOIN public.tickets ticket
  ON ticket.event_id = legacy.event_id
 AND ticket.operations_config ->> 'departure_mode' = 'wave'
LEFT JOIN public.registrations registration
  ON registration.ticket_id = ticket.id
 AND registration.wave_index = legacy.wave_index
WHERE NOT EXISTS (
  SELECT 1
  FROM public.event_waves existing
  WHERE existing.ticket_id = ticket.id
    AND existing.wave_index = legacy.wave_index
)
GROUP BY legacy.event_id, ticket.id, legacy.wave_index, legacy.start_time,
         legacy.capacity, legacy.is_closed, legacy.created_at,
         legacy.organization_id;

-- Reconcile reused rows as well.
UPDATE public.event_waves wave
SET assigned_count = (
      SELECT count(*)::integer
      FROM public.registrations registration
      WHERE registration.ticket_id = wave.ticket_id
        AND registration.wave_index = wave.wave_index
    ),
    updated_at = now()
WHERE wave.ticket_id IS NOT NULL;

ALTER TABLE public.event_waves
  ADD CONSTRAINT event_waves_ticket_wave_unique UNIQUE (ticket_id, wave_index);

CREATE INDEX IF NOT EXISTS event_waves_event_ticket_idx
  ON public.event_waves (event_id, ticket_id, wave_index);

-- New writes must always be ticket-scoped. Legacy NULL rows may temporarily
-- remain only for events whose tickets have not yet received an explicit
-- operations profile; admin/public APIs never expose them.
COMMENT ON COLUMN public.event_waves.ticket_id IS
  'Owning ticket. Wave capacity and occupancy are isolated per ticket.';

CREATE OR REPLACE FUNCTION public.assign_first_available_ticket_wave(
  p_event_id uuid,
  p_registration_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_registration public.registrations%ROWTYPE;
  v_wave public.event_waves%ROWTYPE;
  v_position integer;
BEGIN
  SELECT * INTO v_registration
  FROM public.registrations registration
  WHERE registration.id = p_registration_id
    AND registration.event_id = p_event_id
  FOR UPDATE;

  IF v_registration.id IS NULL OR v_registration.ticket_id IS NULL THEN
    RAISE EXCEPTION 'TICKET_WAVE_UNAVAILABLE: registration or ticket not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT * INTO v_wave
  FROM public.event_waves wave
  WHERE wave.event_id = p_event_id
    AND wave.ticket_id = v_registration.ticket_id
    AND NOT wave.is_closed
    AND wave.assigned_count < wave.capacity
  ORDER BY wave.wave_index
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_wave.id IS NULL THEN
    RAISE EXCEPTION 'TICKET_WAVE_UNAVAILABLE: no available wave for ticket %', v_registration.ticket_id
      USING ERRCODE = 'check_violation';
  END IF;

  v_position := v_wave.assigned_count + 1;

  UPDATE public.event_waves
  SET assigned_count = assigned_count + 1,
      updated_at = now()
  WHERE id = v_wave.id;

  UPDATE public.registrations
  SET wave_index = v_wave.wave_index,
      start_time = v_wave.start_time,
      wave_capacity = v_wave.capacity,
      wave_position = v_position,
      auto_assigned = true,
      assignment_constraint_breached = false
  WHERE id = p_registration_id;

  RETURN json_build_object(
    'wave_index', v_wave.wave_index,
    'start_time', v_wave.start_time,
    'wave_capacity', v_wave.capacity,
    'wave_position', v_position
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_selected_wave_to_registration(
  p_event_id uuid,
  p_registration_id uuid,
  p_wave_index integer
) RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_wave public.event_waves%ROWTYPE;
  v_ticket_id uuid;
  v_position integer;
BEGIN
  SELECT registration.ticket_id
  INTO v_ticket_id
  FROM public.registrations registration
  WHERE registration.id = p_registration_id
    AND registration.event_id = p_event_id
  FOR UPDATE;

  IF v_ticket_id IS NULL THEN
    RAISE EXCEPTION 'SELECTED_WAVE_UNAVAILABLE: registration or ticket not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT * INTO v_wave
  FROM public.event_waves wave
  WHERE wave.event_id = p_event_id
    AND wave.ticket_id = v_ticket_id
    AND wave.wave_index = p_wave_index
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SELECTED_WAVE_UNAVAILABLE: wave % not found for ticket %', p_wave_index, v_ticket_id
      USING ERRCODE = 'no_data_found';
  END IF;
  IF v_wave.is_closed OR v_wave.assigned_count >= v_wave.capacity THEN
    RAISE EXCEPTION 'SELECTED_WAVE_UNAVAILABLE: wave % unavailable for ticket %', p_wave_index, v_ticket_id
      USING ERRCODE = 'check_violation';
  END IF;

  v_position := v_wave.assigned_count + 1;
  UPDATE public.event_waves
  SET assigned_count = assigned_count + 1, updated_at = now()
  WHERE id = v_wave.id;

  UPDATE public.registrations
  SET wave_index = p_wave_index,
      start_time = v_wave.start_time,
      wave_capacity = v_wave.capacity,
      wave_position = v_position,
      auto_assigned = false,
      assignment_constraint_breached = false
  WHERE id = p_registration_id;

  UPDATE public.event_waves wave
  SET assigned_count = (
        SELECT count(*)::integer
        FROM public.registrations registration
        WHERE registration.ticket_id = wave.ticket_id
          AND registration.wave_index = wave.wave_index
      ),
      updated_at = now()
  WHERE wave.ticket_id = v_ticket_id;

  RETURN json_build_object('wave_index', p_wave_index, 'start_time', v_wave.start_time,
    'wave_capacity', v_wave.capacity, 'wave_position', v_position);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_registration_to_group_anchor(
  p_event_id uuid,
  p_registration_id uuid,
  p_wave_index integer
) RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_wave public.event_waves%ROWTYPE;
  v_ticket_id uuid;
  v_position integer;
BEGIN
  SELECT registration.ticket_id
  INTO v_ticket_id
  FROM public.registrations registration
  WHERE registration.id = p_registration_id
    AND registration.event_id = p_event_id
  FOR UPDATE;

  SELECT * INTO v_wave
  FROM public.event_waves wave
  WHERE wave.event_id = p_event_id
    AND wave.ticket_id = v_ticket_id
    AND wave.wave_index = p_wave_index
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GROUP_ANCHOR_WAVE_NOT_FOUND: wave % not found for ticket %', p_wave_index, v_ticket_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_position := v_wave.assigned_count + 1;
  UPDATE public.event_waves
  SET assigned_count = assigned_count + 1, updated_at = now()
  WHERE id = v_wave.id;

  UPDATE public.registrations
  SET wave_index = p_wave_index,
      start_time = v_wave.start_time,
      wave_capacity = v_wave.capacity,
      wave_position = v_position,
      auto_assigned = true,
      assignment_constraint_breached = false
  WHERE id = p_registration_id;

  UPDATE public.event_waves wave
  SET assigned_count = (
        SELECT count(*)::integer
        FROM public.registrations registration
        WHERE registration.ticket_id = wave.ticket_id
          AND registration.wave_index = wave.wave_index
      ),
      updated_at = now()
  WHERE wave.ticket_id = v_ticket_id;

  RETURN json_build_object('wave_index', p_wave_index, 'start_time', v_wave.start_time,
    'wave_capacity', v_wave.capacity, 'wave_position', v_position);
END;
$$;

-- Keep the historical RPC name for API compatibility, but make its contract
-- capability-based and ticket-scoped. No ticket or race label is inspected.
CREATE OR REPLACE FUNCTION public.admin_move_open_registration_wave(
  p_registration_id uuid,
  p_wave_index integer
)
RETURNS TABLE (registration_id uuid, wave_index integer, start_time timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_registration record;
  v_wave public.event_waves%ROWTYPE;
  v_anchor_id uuid;
  v_position integer;
BEGIN
  SELECT registration.id,
         registration.user_id,
         registration.event_id,
         registration.ticket_id,
         ticket.operations_config
  INTO v_registration
  FROM public.registrations registration
  JOIN public.tickets ticket ON ticket.id = registration.ticket_id
  WHERE registration.id = p_registration_id
  FOR UPDATE;

  IF v_registration.id IS NULL THEN
    RAISE EXCEPTION 'Registration % not found', p_registration_id USING ERRCODE = 'P0002';
  END IF;
  IF v_registration.operations_config ->> 'departure_mode' IS DISTINCT FROM 'wave' THEN
    RAISE EXCEPTION 'This ticket does not support wave departures' USING ERRCODE = '22023';
  END IF;

  SELECT group_row.id INTO v_anchor_id
  FROM public.group_members membership
  JOIN public.groups group_row ON group_row.id = membership.group_id
  WHERE membership.profile_id = v_registration.user_id
    AND group_row.anchor_event_id = v_registration.event_id
    AND group_row.anchor_wave_index IS NOT NULL
  LIMIT 1;

  IF v_anchor_id IS NOT NULL THEN
    RAISE EXCEPTION 'This participant follows a group wave. Move the group anchor instead.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_wave
  FROM public.event_waves wave
  WHERE wave.event_id = v_registration.event_id
    AND wave.ticket_id = v_registration.ticket_id
    AND wave.wave_index = p_wave_index
  FOR UPDATE;

  IF v_wave.id IS NULL THEN
    RAISE EXCEPTION 'Wave % does not exist for this ticket', p_wave_index USING ERRCODE = 'P0002';
  END IF;
  IF v_wave.is_closed OR v_wave.assigned_count >= v_wave.capacity THEN
    RAISE EXCEPTION 'This wave is full or closed' USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(max(registration.wave_position), 0) + 1
  INTO v_position
  FROM public.registrations registration
  WHERE registration.ticket_id = v_registration.ticket_id
    AND registration.wave_index = p_wave_index
    AND registration.id <> v_registration.id;

  UPDATE public.registrations
  SET wave_index = v_wave.wave_index,
      start_time = v_wave.start_time,
      wave_capacity = v_wave.capacity,
      wave_position = v_position,
      auto_assigned = false,
      assignment_constraint_breached = false
  WHERE id = v_registration.id;

  UPDATE public.event_waves wave
  SET assigned_count = (
        SELECT count(*)::integer
        FROM public.registrations registration
        WHERE registration.ticket_id = wave.ticket_id
          AND registration.wave_index = wave.wave_index
      ),
      updated_at = now()
  WHERE wave.ticket_id = v_registration.ticket_id;

  RETURN QUERY
  SELECT registration.id, registration.wave_index, registration.start_time
  FROM public.registrations registration
  WHERE registration.id = v_registration.id;
END;
$$;

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
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_registration record;
  v_ticket record;
  v_anchor_wave_index integer;
  v_fixed_start_time timestamptz;
  v_previous_wave_index integer;
BEGIN
  SELECT registration.id,
         registration.user_id,
         registration.event_id,
         registration.ticket_id,
         registration.wave_index
  INTO v_registration
  FROM public.registrations registration
  WHERE registration.id = p_registration_id
  FOR UPDATE;

  IF v_registration.id IS NULL THEN
    RAISE EXCEPTION 'Registration % not found', p_registration_id USING ERRCODE = 'P0002';
  END IF;

  SELECT ticket.id, ticket.event_id, ticket.operations_config
  INTO v_ticket
  FROM public.tickets ticket
  WHERE ticket.id = p_ticket_id;

  IF v_ticket.id IS NULL THEN
    RAISE EXCEPTION 'Ticket % not found', p_ticket_id USING ERRCODE = 'P0002';
  END IF;
  IF v_ticket.event_id <> v_registration.event_id OR v_ticket.id = v_registration.ticket_id THEN
    RAISE EXCEPTION 'Target ticket is invalid' USING ERRCODE = '22023';
  END IF;
  IF v_ticket.operations_config ->> 'departure_mode' NOT IN ('none', 'fixed', 'wave')
     OR v_ticket.operations_config ->> 'departure_change_policy' NOT IN ('preserve', 'clear', 'reassign') THEN
    RAISE EXCEPTION 'Target ticket operations are not configured' USING ERRCODE = '22023';
  END IF;

  v_previous_wave_index := v_registration.wave_index;

  UPDATE public.registrations
  SET ticket_id = v_ticket.id
  WHERE id = v_registration.id;

  IF v_ticket.operations_config ->> 'departure_change_policy' = 'clear'
     OR v_ticket.operations_config ->> 'departure_mode' = 'none' THEN
    UPDATE public.registrations
    SET start_time = NULL, wave_index = NULL, wave_capacity = NULL,
        wave_position = NULL, auto_assigned = NULL,
        preferred_window_start = NULL, preferred_window_end = NULL,
        latest_allowed_time = NULL, assignment_constraint_breached = false
    WHERE id = v_registration.id;
  ELSIF v_ticket.operations_config ->> 'departure_mode' = 'wave' THEN
    UPDATE public.registrations
    SET start_time = NULL, wave_index = NULL, wave_capacity = NULL,
        wave_position = NULL, auto_assigned = true,
        assignment_constraint_breached = false
    WHERE id = v_registration.id;

    IF v_ticket.operations_config ->> 'departure_change_policy' = 'preserve'
       AND v_previous_wave_index IS NOT NULL THEN
      PERFORM public.assign_selected_wave_to_registration(
        v_registration.event_id, v_registration.id, v_previous_wave_index
      );
    ELSE
      SELECT group_row.anchor_wave_index INTO v_anchor_wave_index
      FROM public.group_members membership
      JOIN public.groups group_row ON group_row.id = membership.group_id
      WHERE membership.profile_id = v_registration.user_id
        AND group_row.anchor_event_id = v_registration.event_id
        AND group_row.anchor_wave_index IS NOT NULL
      ORDER BY membership.joined_at DESC
      LIMIT 1;

      IF v_anchor_wave_index IS NULL THEN
        PERFORM public.assign_first_available_ticket_wave(v_registration.event_id, v_registration.id);
      ELSE
        PERFORM public.sync_registration_to_group_anchor(
          v_registration.event_id, v_registration.id, v_anchor_wave_index
        );
      END IF;
    END IF;
  ELSIF v_ticket.operations_config ->> 'departure_mode' = 'fixed'
        AND v_ticket.operations_config ->> 'departure_change_policy' = 'reassign' THEN
    BEGIN
      v_fixed_start_time := (v_ticket.operations_config ->> 'fixed_start_time')::timestamptz;
    EXCEPTION WHEN invalid_datetime_format THEN
      v_fixed_start_time := NULL;
    END;
    IF v_fixed_start_time IS NULL THEN
      RAISE EXCEPTION 'Target ticket fixed_start_time is not configured' USING ERRCODE = '22023';
    END IF;
    UPDATE public.registrations
    SET start_time = v_fixed_start_time, wave_index = NULL,
        wave_capacity = NULL, wave_position = NULL, auto_assigned = false,
        assignment_constraint_breached = false
    WHERE id = v_registration.id;
  END IF;

  UPDATE public.event_waves wave
  SET assigned_count = (
        SELECT count(*)::integer
        FROM public.registrations registration
        WHERE registration.ticket_id = wave.ticket_id
          AND registration.wave_index = wave.wave_index
      ),
      updated_at = now()
  WHERE wave.ticket_id IN (v_registration.ticket_id, v_ticket.id);

  RETURN QUERY
  SELECT registration.id,
         registration.ticket_id,
         v_ticket.operations_config ->> 'departure_mode',
         registration.wave_index,
         registration.start_time
  FROM public.registrations registration
  WHERE registration.id = v_registration.id;
END;
$$;

-- Ticket changes consume only the explicit operations_config contract. The
-- target ticket owns its wave inventory; prices and payment rows are untouched.
CREATE OR REPLACE FUNCTION public.admin_confirm_ticket_change(
  p_organization_id uuid,
  p_event_id uuid,
  p_registration_id uuid,
  p_target_ticket_id uuid,
  p_command_id uuid,
  p_preview_id text,
  p_reason text,
  p_actor_id uuid,
  p_expected_ticket_id uuid,
  p_expected_wave_index integer,
  p_expected_start_time timestamptz,
  p_request_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_existing public.admin_operation_commands;
  v_registration record;
  v_target record;
  v_anchor_wave_index integer;
  v_before jsonb;
  v_after jsonb;
  v_command_row_id uuid;
  v_preserved_wave_index integer;
  v_fixed_start_time timestamptz;
BEGIN
  SELECT * INTO v_existing
  FROM public.admin_operation_commands command
  WHERE command.organization_id = p_organization_id
    AND command.command_id = p_command_id;

  IF v_existing.id IS NOT NULL THEN
    IF v_existing.request_hash <> p_request_hash THEN
      RAISE EXCEPTION 'Command id already used with a different payload' USING ERRCODE = '23505';
    END IF;
    RETURN jsonb_build_object(
      'commandId', v_existing.command_id,
      'status', v_existing.status,
      'registrationId', v_existing.registration_id,
      'ticketId', (v_existing.after_snapshot ->> 'ticket_id')::uuid
    );
  END IF;

  SELECT registration.id,
         registration.event_id,
         registration.ticket_id,
         registration.user_id,
         registration.wave_index,
         registration.wave_position,
         registration.wave_capacity,
         registration.start_time
  INTO v_registration
  FROM public.registrations registration
  WHERE registration.id = p_registration_id
    AND registration.event_id = p_event_id
    AND registration.organization_id = p_organization_id
  FOR UPDATE;

  IF v_registration.id IS NULL THEN
    RAISE EXCEPTION 'Registration not found in organization' USING ERRCODE = 'P0002';
  END IF;
  IF v_registration.ticket_id IS DISTINCT FROM p_expected_ticket_id
     OR v_registration.wave_index IS DISTINCT FROM p_expected_wave_index
     OR v_registration.start_time IS DISTINCT FROM p_expected_start_time THEN
    RAISE EXCEPTION 'Registration changed since preview' USING ERRCODE = '40001';
  END IF;

  SELECT ticket.id, ticket.operations_config
  INTO v_target
  FROM public.tickets ticket
  WHERE ticket.id = p_target_ticket_id
    AND ticket.event_id = p_event_id
    AND ticket.organization_id = p_organization_id;

  IF v_target.id IS NULL OR v_target.id = v_registration.ticket_id THEN
    RAISE EXCEPTION 'Target ticket is invalid' USING ERRCODE = '22023';
  END IF;
  IF v_target.operations_config ->> 'departure_mode' NOT IN ('none', 'fixed', 'wave')
     OR v_target.operations_config ->> 'departure_change_policy' NOT IN ('preserve', 'clear', 'reassign') THEN
    RAISE EXCEPTION 'Target ticket operations are not configured' USING ERRCODE = '22023';
  END IF;

  v_before := jsonb_build_object(
    'ticket_id', v_registration.ticket_id,
    'wave_index', v_registration.wave_index,
    'wave_position', v_registration.wave_position,
    'wave_capacity', v_registration.wave_capacity,
    'start_time', v_registration.start_time
  );

  INSERT INTO public.admin_operation_commands (
    organization_id, event_id, registration_id, command_id, preview_id,
    operation_kind, policy_variant, status, reason, requested_by,
    request_hash, before_snapshot
  ) VALUES (
    p_organization_id, p_event_id, p_registration_id, p_command_id, p_preview_id,
    'CHANGE_TICKET', 'NO_MOVEMENT', 'PENDING', p_reason, p_actor_id,
    p_request_hash, v_before
  ) RETURNING id INTO v_command_row_id;

  v_preserved_wave_index := v_registration.wave_index;

  UPDATE public.registrations
  SET ticket_id = v_target.id
  WHERE id = v_registration.id;

  IF v_target.operations_config ->> 'departure_change_policy' = 'clear'
     OR v_target.operations_config ->> 'departure_mode' = 'none' THEN
    UPDATE public.registrations
    SET start_time = NULL,
        wave_index = NULL,
        wave_capacity = NULL,
        wave_position = NULL,
        auto_assigned = NULL,
        preferred_window_start = NULL,
        preferred_window_end = NULL,
        latest_allowed_time = NULL,
        assignment_constraint_breached = false
    WHERE id = v_registration.id;
  ELSIF v_target.operations_config ->> 'departure_mode' = 'wave'
        AND v_target.operations_config ->> 'departure_change_policy' IN ('preserve', 'reassign') THEN
    UPDATE public.registrations
    SET start_time = NULL,
        wave_index = NULL,
        wave_capacity = NULL,
        wave_position = NULL,
        auto_assigned = true,
        assignment_constraint_breached = false
    WHERE id = v_registration.id;

    IF v_target.operations_config ->> 'departure_change_policy' = 'preserve'
       AND v_preserved_wave_index IS NOT NULL THEN
      PERFORM public.assign_selected_wave_to_registration(
        p_event_id,
        p_registration_id,
        v_preserved_wave_index
      );
    ELSE
      SELECT group_row.anchor_wave_index INTO v_anchor_wave_index
      FROM public.group_members membership
      JOIN public.groups group_row ON group_row.id = membership.group_id
      WHERE membership.profile_id = v_registration.user_id
        AND group_row.anchor_event_id = p_event_id
        AND group_row.anchor_wave_index IS NOT NULL
      ORDER BY membership.joined_at DESC
      LIMIT 1;

      IF v_anchor_wave_index IS NOT NULL THEN
        PERFORM public.sync_registration_to_group_anchor(
          p_event_id,
          p_registration_id,
          v_anchor_wave_index
        );
      ELSE
        PERFORM public.assign_first_available_ticket_wave(p_event_id, p_registration_id);
      END IF;
    END IF;
  ELSIF v_target.operations_config ->> 'departure_mode' = 'fixed'
        AND v_target.operations_config ->> 'departure_change_policy' = 'reassign' THEN
    BEGIN
      v_fixed_start_time := (v_target.operations_config ->> 'fixed_start_time')::timestamptz;
    EXCEPTION WHEN invalid_datetime_format THEN
      v_fixed_start_time := NULL;
    END;
    IF v_fixed_start_time IS NULL THEN
      RAISE EXCEPTION 'Target ticket fixed_start_time is not configured' USING ERRCODE = '22023';
    END IF;
    UPDATE public.registrations
    SET start_time = v_fixed_start_time,
        wave_index = NULL,
        wave_capacity = NULL,
        wave_position = NULL,
        auto_assigned = false,
        assignment_constraint_breached = false
    WHERE id = v_registration.id;
  END IF;

  UPDATE public.event_waves wave
  SET assigned_count = (
        SELECT count(*)::integer
        FROM public.registrations registration
        WHERE registration.ticket_id = wave.ticket_id
          AND registration.wave_index = wave.wave_index
      ),
      updated_at = now()
  WHERE wave.ticket_id IN (v_registration.ticket_id, v_target.id);

  SELECT jsonb_build_object(
    'ticket_id', registration.ticket_id,
    'wave_index', registration.wave_index,
    'wave_position', registration.wave_position,
    'wave_capacity', registration.wave_capacity,
    'start_time', registration.start_time
  ) INTO v_after
  FROM public.registrations registration
  WHERE registration.id = p_registration_id;

  UPDATE public.admin_operation_commands
  SET status = 'SUCCEEDED',
      after_snapshot = v_after,
      completed_at = now()
  WHERE id = v_command_row_id;

  RETURN jsonb_build_object(
    'commandId', p_command_id,
    'status', 'SUCCEEDED',
    'registrationId', p_registration_id,
    'ticketId', (v_after ->> 'ticket_id')::uuid
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_first_available_ticket_wave(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_first_available_ticket_wave(uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.assign_selected_wave_to_registration(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_selected_wave_to_registration(uuid, uuid, integer) TO service_role;
REVOKE ALL ON FUNCTION public.sync_registration_to_group_anchor(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_registration_to_group_anchor(uuid, uuid, integer) TO service_role;
REVOKE ALL ON FUNCTION public.admin_move_open_registration_wave(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_move_open_registration_wave(uuid, integer) TO service_role;
REVOKE ALL ON FUNCTION public.admin_change_registration_ticket(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_registration_ticket(uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.admin_confirm_ticket_change(uuid, uuid, uuid, uuid, uuid, text, text, uuid, uuid, integer, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_confirm_ticket_change(uuid, uuid, uuid, uuid, uuid, text, text, uuid, uuid, integer, timestamptz, text) TO service_role;
