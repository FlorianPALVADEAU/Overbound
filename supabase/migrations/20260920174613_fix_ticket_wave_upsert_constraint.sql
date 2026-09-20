-- PostgREST emits ON CONFLICT (ticket_id, wave_index) for Supabase upserts.
-- A partial unique index cannot be inferred without its predicate, so expose a
-- non-partial unique constraint. PostgreSQL still permits multiple NULL values,
-- preserving the expand/migrate compatibility window for legacy rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.event_waves'::regclass
      AND constraint_row.conname = 'event_waves_ticket_wave_unique'
      AND constraint_row.contype = 'u'
  ) THEN
    DROP INDEX IF EXISTS public.event_waves_ticket_wave_unique;
    ALTER TABLE public.event_waves
      ADD CONSTRAINT event_waves_ticket_wave_unique UNIQUE (ticket_id, wave_index);
  END IF;
END;
$$;
