-- Hardening (defense in depth): drop the legacy RLS policies that let any signed-in user write
-- the catalogue tables.
--
-- These policies accept any authenticated session:
--   "Users can insert events" / "Users can update events"
--   "Users can insert races" / "Users can update races"
--   "Users can insert obstacles" / "Users can update obstacles"
--   "Users can insert tickets", "Users can insert event_races", "Users can insert race_obstacles"
-- They are inert today: 20261012140000_revoke_client_writes.sql revoked INSERT/UPDATE/DELETE on
-- these tables from anon and authenticated (checked in production on 2026-10-13). But a future
-- GRANT (for example to let one route write with the visitor's session) would silently reopen
-- them: anyone could then rename an event, change its capacity or status, or create tickets.
--
-- The application writes these tables only with the service-role client (api/admin/*, cron),
-- which bypasses RLS, so dropping the policies changes nothing for it. SELECT policies are kept.
--
-- Idempotent: DROP POLICY IF EXISTS can be replayed; missing tables are skipped.
--
-- Rollback (restores the previous, permissive state; do not use):
--   CREATE POLICY "Users can insert events" ON public.events FOR INSERT
--     WITH CHECK (auth.role() = 'authenticated');
--   (same pattern for each policy listed above; UPDATE policies use USING instead of WITH CHECK)

DO $$
DECLARE
  legacy record;
BEGIN
  FOR legacy IN
    SELECT * FROM (VALUES
      ('events', 'Users can insert events'),
      ('events', 'Users can update events'),
      ('races', 'Users can insert races'),
      ('races', 'Users can update races'),
      ('obstacles', 'Users can insert obstacles'),
      ('obstacles', 'Users can update obstacles'),
      ('tickets', 'Users can insert tickets'),
      ('event_races', 'Users can insert event_races'),
      ('race_obstacles', 'Users can insert race_obstacles')
    ) AS policies(table_name, policy_name)
  LOOP
    IF to_regclass(format('public.%I', legacy.table_name)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', legacy.policy_name, legacy.table_name);
    END IF;
  END LOOP;
END
$$;
