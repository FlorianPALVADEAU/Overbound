-- Dossards : plage unique par événement (remplace FDR-0011 "plages indépendantes par format").
--   RANKED : 1 .. ranked_bib_capacity
--   OPEN   : ranked_bib_capacity + 1 .. events.capacity
-- events.open_bib_capacity n'est plus lu par l'application (colonne conservée,
-- non détruite). Les dossards existants sont renumérotés (ordre created_at, id)
-- ; les inscriptions annulées gardent leur ancien numéro (hors index unique).
-- À RELIRE avant application (FDR-0009) : la migration échoue explicitement si
-- un événement ne peut pas tenir dans la nouvelle plage.

DO $$
DECLARE
  ev record;
  v_ranked_cap integer;
  v_ranked_count integer;
  v_open_count integer;
BEGIN
  PERFORM set_config('app.allow_bib_reassignment', 'true', true);

  FOR ev IN
    SELECT e.id, e.capacity, e.ranked_bib_capacity,
           (SELECT c.max_number FROM event_bib_counters c WHERE c.event_id = e.id AND c.race_format = 'ranked') AS ranked_counter_max
    FROM events e
    WHERE EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.event_id = e.id AND r.bib_number IS NOT NULL AND r.claim_status <> 'cancelled'
    )
  LOOP
    v_ranked_cap := COALESCE(ev.ranked_bib_capacity, ev.ranked_counter_max);

    SELECT count(*) INTO v_ranked_count FROM registrations
      WHERE event_id = ev.id AND race_format = 'ranked' AND bib_number IS NOT NULL AND claim_status <> 'cancelled';
    SELECT count(*) INTO v_open_count FROM registrations
      WHERE event_id = ev.id AND race_format = 'open' AND bib_number IS NOT NULL AND claim_status <> 'cancelled';

    IF v_ranked_cap IS NULL THEN
      RAISE EXCEPTION 'Event %: ranked_bib_capacity inconnue, renseigne-la avant la migration', ev.id;
    END IF;
    IF v_ranked_count > v_ranked_cap THEN
      RAISE EXCEPTION 'Event %: % RANKED > capacité RANKED %', ev.id, v_ranked_count, v_ranked_cap;
    END IF;
    IF v_ranked_cap + v_open_count > ev.capacity THEN
      RAISE EXCEPTION 'Event %: % RANKED réservés + % OPEN > capacité totale %', ev.id, v_ranked_cap, v_open_count, ev.capacity;
    END IF;

    UPDATE events SET ranked_bib_capacity = v_ranked_cap WHERE id = ev.id AND ranked_bib_capacity IS DISTINCT FROM v_ranked_cap;

    UPDATE registrations SET bib_number = NULL
      WHERE event_id = ev.id AND bib_number IS NOT NULL AND claim_status <> 'cancelled';

    UPDATE registrations r SET bib_number = n.new_bib
    FROM (
      SELECT id,
             CASE race_format
               WHEN 'ranked' THEN row_number() OVER (PARTITION BY race_format ORDER BY created_at, id)
               ELSE v_ranked_cap + row_number() OVER (PARTITION BY race_format ORDER BY created_at, id)
             END AS new_bib
      FROM registrations
      WHERE event_id = ev.id AND race_format IN ('open', 'ranked')
        AND claim_status <> 'cancelled'
        AND id IN (SELECT id FROM registrations WHERE event_id = ev.id)
    ) n
    WHERE r.id = n.id;
    -- Remarque : les lignes sans race_format n'avaient pas de dossard.

    DELETE FROM event_bib_counters WHERE event_id = ev.id;
    INSERT INTO event_bib_counters (event_id, race_format, next_number, max_number) VALUES
      (ev.id, 'ranked', 1 + v_ranked_count, v_ranked_cap),
      (ev.id, 'open', v_ranked_cap + 1 + v_open_count, ev.capacity);
  END LOOP;

  PERFORM set_config('app.allow_bib_reassignment', 'false', true);
END;
$$;

-- Un numéro = une inscription par événement, tous formats confondus.
DROP INDEX IF EXISTS registrations_bib_number_unique_per_format;
CREATE UNIQUE INDEX IF NOT EXISTS registrations_bib_number_unique_per_event
  ON registrations (event_id, bib_number)
  WHERE bib_number IS NOT NULL AND claim_status <> 'cancelled';

DROP FUNCTION IF EXISTS assign_bib_number(uuid, uuid, text, integer);
DROP FUNCTION IF EXISTS transfer_bib_number(uuid, uuid, text, integer);

-- Le plafond et le plancher du compteur suivent la config courante de
-- l'événement à chaque appel (l'admin peut modifier les capacités).
CREATE OR REPLACE FUNCTION assign_bib_number(
  p_event_id uuid,
  p_registration_id uuid,
  p_race_format text,
  p_min_number integer,
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
  IF p_min_number < 1 OR p_min_number > p_max_number THEN
    RAISE EXCEPTION 'BIB_CAPACITY_EXHAUSTED: plage invalide % .. % pour event % format %', p_min_number, p_max_number, p_event_id, p_race_format
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO event_bib_counters (event_id, race_format, next_number, max_number)
  VALUES (p_event_id, p_race_format, p_min_number, p_max_number)
  ON CONFLICT (event_id, race_format) DO UPDATE
    SET max_number = EXCLUDED.max_number,
        next_number = GREATEST(event_bib_counters.next_number, EXCLUDED.next_number);

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

CREATE OR REPLACE FUNCTION transfer_bib_number(
  p_registration_id uuid,
  p_event_id uuid,
  p_target_format text,
  p_min_number integer,
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

  v_assigned := assign_bib_number(p_event_id, p_registration_id, p_target_format, p_min_number, p_max_number);

  RETURN v_assigned;
END;
$$;
