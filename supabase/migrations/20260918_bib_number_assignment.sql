-- FDR-0011: fixed bib number per registration, unique and immutable once
-- assigned. Ranges are per (event_id, race_format), never shared between
-- OPEN and RANKED. See docs/fdr/FDR-0011-fixed-bib-number-assignment.md.
--
-- Q-1 (capacity model): independent plafond per format, NOT derived from
-- event_waves.capacity — decoupled on purpose so editing a wave's capacity
-- from admin never silently changes how many bib numbers exist.
-- Q-2 (cancellation): bib numbers are frozen forever, never released back
-- into the pool on cancellation/refund — avoids a physically printed badge
-- number being handed to a second person.

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS bib_number integer,
  ADD COLUMN IF NOT EXISTS race_format text
    CHECK (race_format IS NULL OR race_format IN ('open', 'ranked'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS open_bib_capacity integer,
  ADD COLUMN IF NOT EXISTS ranked_bib_capacity integer;

-- Unicity per event + format. Cancelled registrations keep their historical
-- bib_number value (frozen, Q-2) but are excluded from the uniqueness check
-- so a cancelled slot's number is never contested — it is simply retired.
CREATE UNIQUE INDEX IF NOT EXISTS registrations_bib_number_unique_per_format
  ON registrations (event_id, race_format, bib_number)
  WHERE bib_number IS NOT NULL AND claim_status <> 'cancelled';

CREATE INDEX IF NOT EXISTS registrations_bib_number_lookup_idx
  ON registrations (event_id, race_format, bib_number)
  WHERE bib_number IS NOT NULL;

-- Sequential counter per (event, format). A dedicated table rather than
-- MAX(bib_number)+1 so the atomic UPDATE...RETURNING below never needs to
-- scan registrations under lock.
CREATE TABLE IF NOT EXISTS event_bib_counters (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_format text NOT NULL CHECK (race_format IN ('open', 'ranked')),
  next_number integer NOT NULL DEFAULT 1,
  max_number integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, race_format)
);

ALTER TABLE event_bib_counters ENABLE ROW LEVEL SECURITY;

-- Service role only: application code never reads/writes this table
-- directly from the client, always through assign_bib_number().
CREATE POLICY "service_role_full_access_event_bib_counters"
  ON event_bib_counters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Immutability guard: bib_number can only change via an explicit,
-- session-scoped override (used by the format-transfer procedure and the
-- exceptional manual reassignment flow). Any other write path that tries to
-- change an already-assigned bib_number is rejected outright — this is the
-- backstop for every existing and future script/route that touches
-- registrations without knowing about this invariant (FDR-0009 §1.3 already
-- flags unaudited scripts as a risk).
CREATE OR REPLACE FUNCTION prevent_bib_number_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.bib_number IS NOT NULL
     AND NEW.bib_number IS DISTINCT FROM OLD.bib_number
     AND current_setting('app.allow_bib_reassignment', true) IS DISTINCT FROM 'true'
  THEN
    RAISE EXCEPTION 'bib_number is immutable outside explicit reassignment (registration %)', OLD.id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_bib_number_mutation ON registrations;
CREATE TRIGGER trg_prevent_bib_number_mutation
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_bib_number_mutation();

-- Atomic assignment: single UPDATE...RETURNING on the counter row, no
-- SELECT-then-UPDATE from application code. Auto-creates the counter row on
-- first call for a given (event, format) using p_max_number as the ceiling,
-- so callers don't need a separate provisioning step.
CREATE OR REPLACE FUNCTION assign_bib_number(
  p_event_id uuid,
  p_registration_id uuid,
  p_race_format text,
  p_max_number integer
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_assigned integer;
BEGIN
  IF p_race_format NOT IN ('open', 'ranked') THEN
    RAISE EXCEPTION 'invalid race_format: %', p_race_format;
  END IF;

  INSERT INTO event_bib_counters (event_id, race_format, next_number, max_number)
  VALUES (p_event_id, p_race_format, 1, p_max_number)
  ON CONFLICT (event_id, race_format) DO NOTHING;

  UPDATE event_bib_counters
  SET next_number = next_number + 1,
      updated_at = now()
  WHERE event_id = p_event_id
    AND race_format = p_race_format
    AND next_number <= max_number
  RETURNING next_number - 1 INTO v_assigned;

  IF v_assigned IS NULL THEN
    RAISE EXCEPTION 'BIB_CAPACITY_EXHAUSTED: no bib number available for event % format %', p_event_id, p_race_format
      USING ERRCODE = 'check_violation';
  END IF;

  PERFORM set_config('app.allow_bib_reassignment', 'true', true);
  UPDATE registrations
  SET bib_number = v_assigned,
      race_format = p_race_format
  WHERE id = p_registration_id;
  PERFORM set_config('app.allow_bib_reassignment', 'false', true);

  RETURN v_assigned;
END;
$$;

-- Format transfer (RANKED <-> OPEN): releases the old bib number (frozen,
-- never reused per Q-2 — simply detached from this registration) and
-- assigns a new one in the target format, all-or-nothing. If the target
-- format has no capacity left, the whole transfer is rolled back and the
-- registration keeps its original bib_number and race_format.
CREATE OR REPLACE FUNCTION transfer_bib_number(
  p_registration_id uuid,
  p_event_id uuid,
  p_target_format text,
  p_max_number integer
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_assigned integer;
BEGIN
  IF p_target_format NOT IN ('open', 'ranked') THEN
    RAISE EXCEPTION 'invalid race_format: %', p_target_format;
  END IF;

  PERFORM set_config('app.allow_bib_reassignment', 'true', true);
  UPDATE registrations
  SET bib_number = NULL
  WHERE id = p_registration_id;
  PERFORM set_config('app.allow_bib_reassignment', 'false', true);

  v_assigned := assign_bib_number(p_event_id, p_registration_id, p_target_format, p_max_number);

  RETURN v_assigned;
END;
$$;
