-- Server-only, idempotent command registry for administrative corrections.
-- This migration intentionally supports only NO_MOVEMENT ticket changes.

CREATE TABLE public.admin_operation_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  event_id uuid NOT NULL REFERENCES public.events(id),
  registration_id uuid NOT NULL REFERENCES public.registrations(id),
  command_id uuid NOT NULL,
  preview_id text NOT NULL,
  operation_kind text NOT NULL CHECK (operation_kind = 'CHANGE_TICKET'),
  policy_variant text NOT NULL CHECK (policy_variant = 'NO_MOVEMENT'),
  status text NOT NULL CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED')),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 1000),
  requested_by uuid NOT NULL REFERENCES public.profiles(id),
  request_hash text NOT NULL,
  before_snapshot jsonb NOT NULL,
  after_snapshot jsonb,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT admin_operation_commands_org_command_key UNIQUE (organization_id, command_id)
);

CREATE INDEX admin_operation_commands_event_created_idx
  ON public.admin_operation_commands (organization_id, event_id, created_at DESC);
CREATE INDEX admin_operation_commands_registration_created_idx
  ON public.admin_operation_commands (organization_id, registration_id, created_at DESC);

ALTER TABLE public.admin_operation_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_operation_commands FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_operation_commands TO service_role;

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
  v_anchor record;
  v_format text;
  v_wave_position integer;
  v_before jsonb;
  v_after jsonb;
  v_command_id uuid;
BEGIN
  SELECT * INTO v_existing
    FROM public.admin_operation_commands
   WHERE organization_id = p_organization_id AND command_id = p_command_id;
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.request_hash <> p_request_hash THEN
      RAISE EXCEPTION 'Command id already used with a different payload' USING ERRCODE = '23505';
    END IF;
    RETURN jsonb_build_object('commandId', v_existing.command_id, 'status', v_existing.status,
      'registrationId', v_existing.registration_id, 'ticketId', (v_existing.after_snapshot ->> 'ticket_id')::uuid);
  END IF;

  SELECT r.id, r.event_id, r.ticket_id, r.user_id, r.wave_index, r.wave_position,
         r.wave_capacity, r.start_time, e.organization_id, e.date AS event_date
    INTO v_registration
    FROM public.registrations r
    JOIN public.events e ON e.id = r.event_id
   WHERE r.id = p_registration_id AND r.event_id = p_event_id
     AND e.organization_id = p_organization_id
   FOR UPDATE;
  IF v_registration.id IS NULL THEN
    RAISE EXCEPTION 'Registration not found in organization' USING ERRCODE = 'P0002';
  END IF;
  IF v_registration.ticket_id IS DISTINCT FROM p_expected_ticket_id
     OR v_registration.wave_index IS DISTINCT FROM p_expected_wave_index
     OR v_registration.start_time IS DISTINCT FROM p_expected_start_time THEN
    RAISE EXCEPTION 'Registration changed since preview' USING ERRCODE = '40001';
  END IF;

  SELECT t.id, t.event_id, t.name AS ticket_name, race.name AS race_name
    INTO v_target
    FROM public.tickets t
    LEFT JOIN public.races race ON race.id = t.race_id
   WHERE t.id = p_target_ticket_id AND t.event_id = p_event_id;
  IF v_target.id IS NULL OR v_target.id = v_registration.ticket_id THEN
    RAISE EXCEPTION 'Target ticket is invalid' USING ERRCODE = '22023';
  END IF;

  IF position('open' IN lower(coalesce(v_target.ticket_name, '') || ' ' || coalesce(v_target.race_name, ''))) > 0
     AND position('ranked' IN lower(coalesce(v_target.ticket_name, '') || ' ' || coalesce(v_target.race_name, ''))) = 0 THEN
    v_format := 'open';
  ELSIF position('ranked' IN lower(coalesce(v_target.ticket_name, '') || ' ' || coalesce(v_target.race_name, ''))) > 0
     AND position('open' IN lower(coalesce(v_target.ticket_name, '') || ' ' || coalesce(v_target.race_name, ''))) = 0 THEN
    v_format := 'ranked';
  ELSE
    -- Custom ticket profiles do not infer departure rules from labels. The
    -- ticket change itself is safe; profile-specific scheduling is handled by
    -- the ticket configuration layer when it is present.
    v_format := 'custom';
  END IF;

  v_before := jsonb_build_object('ticket_id', v_registration.ticket_id, 'wave_index', v_registration.wave_index,
    'wave_position', v_registration.wave_position, 'wave_capacity', v_registration.wave_capacity,
    'start_time', v_registration.start_time);

  INSERT INTO public.admin_operation_commands (
    organization_id, event_id, registration_id, command_id, preview_id, operation_kind,
    policy_variant, status, reason, requested_by, request_hash, before_snapshot
  ) VALUES (
    p_organization_id, p_event_id, p_registration_id, p_command_id, p_preview_id, 'CHANGE_TICKET',
    'NO_MOVEMENT', 'PENDING', p_reason, p_actor_id, p_request_hash, v_before
  ) RETURNING id INTO v_command_id;

  IF v_format = 'ranked' THEN
    UPDATE public.registrations
       SET ticket_id = v_target.id,
           start_time = (date_trunc('day', v_registration.event_date AT TIME ZONE 'Europe/Paris') + interval '8 hour') AT TIME ZONE 'Europe/Paris',
           wave_index = NULL, wave_capacity = NULL, wave_position = NULL,
           auto_assigned = NULL, preferred_window_start = NULL, preferred_window_end = NULL,
           latest_allowed_time = NULL, assignment_constraint_breached = FALSE
     WHERE id = v_registration.id;
  ELSIF v_format = 'open' THEN
    SELECT g.id, g.anchor_wave_index, g.anchor_start_time INTO v_anchor
      FROM public.group_members gm
      JOIN public.groups g ON g.id = gm.group_id
     WHERE gm.profile_id = v_registration.user_id AND g.anchor_event_id = p_event_id
       AND g.anchor_wave_index IS NOT NULL AND g.anchor_start_time IS NOT NULL
     ORDER BY gm.joined_at DESC LIMIT 1;

    UPDATE public.registrations
       SET ticket_id = v_target.id, start_time = NULL, wave_index = NULL,
           wave_capacity = NULL, wave_position = NULL, auto_assigned = TRUE,
           preferred_window_start = NULL, preferred_window_end = NULL,
           latest_allowed_time = NULL, assignment_constraint_breached = FALSE
     WHERE id = v_registration.id;

    IF v_anchor.id IS NOT NULL THEN
      SELECT coalesce(max(r.wave_position), 0) + 1 INTO v_wave_position
        FROM public.registrations r
       WHERE r.event_id = p_event_id AND r.wave_index = v_anchor.anchor_wave_index;
      UPDATE public.registrations
         SET start_time = v_anchor.anchor_start_time, wave_index = v_anchor.anchor_wave_index,
             wave_capacity = 50, wave_position = v_wave_position
       WHERE id = v_registration.id;
    ELSE
      PERFORM * FROM public.assign_open_wave_to_registration(
        p_event_id := p_event_id, p_registration_id := p_registration_id,
        p_first_departure := (date_trunc('day', v_registration.event_date AT TIME ZONE 'Europe/Paris') + interval '12 hour') AT TIME ZONE 'Europe/Paris',
        p_wave_count := 24, p_interval_minutes := 10, p_default_capacity := 50,
        p_preferred_start := (date_trunc('day', v_registration.event_date AT TIME ZONE 'Europe/Paris') + interval '12 hour') AT TIME ZONE 'Europe/Paris',
        p_preferred_end := (date_trunc('day', v_registration.event_date AT TIME ZONE 'Europe/Paris') + interval '15 hour 50 minute') AT TIME ZONE 'Europe/Paris',
        p_latest_allowed := (date_trunc('day', v_registration.event_date AT TIME ZONE 'Europe/Paris') + interval '15 hour 50 minute') AT TIME ZONE 'Europe/Paris'
      );
    END IF;
  ELSE
    UPDATE public.registrations
       SET ticket_id = v_target.id
     WHERE id = v_registration.id;
  END IF;

  SELECT jsonb_build_object('ticket_id', r.ticket_id, 'wave_index', r.wave_index,
      'wave_position', r.wave_position, 'wave_capacity', r.wave_capacity, 'start_time', r.start_time)
    INTO v_after FROM public.registrations r WHERE r.id = p_registration_id;

  UPDATE public.admin_operation_commands
     SET status = 'SUCCEEDED', after_snapshot = v_after, completed_at = now()
   WHERE id = v_command_id;

  RETURN jsonb_build_object('commandId', p_command_id, 'status', 'SUCCEEDED',
    'registrationId', p_registration_id, 'ticketId', (v_after ->> 'ticket_id')::uuid);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_confirm_ticket_change(uuid, uuid, uuid, uuid, uuid, text, text, uuid, uuid, integer, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_confirm_ticket_change(uuid, uuid, uuid, uuid, uuid, text, text, uuid, uuid, integer, timestamptz, text) TO service_role;
