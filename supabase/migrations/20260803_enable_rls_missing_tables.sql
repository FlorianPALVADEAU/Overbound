-- Enable RLS on 5 tables that were left without it (found during EventManager
-- load-testing readiness review, 2026-08-03). None of these tables are ever
-- read/written by a browser or user-session Supabase client anywhere in the
-- codebase -- every call site uses the service-role client (supabaseAdmin()).
-- Enabling RLS with no anon/authenticated policies closes the public read/
-- write exposure via the anon key without breaking any existing code path,
-- since the service role bypasses RLS entirely.
--
-- Safe to re-run: ENABLE ROW LEVEL SECURITY is idempotent in Postgres.

ALTER TABLE public.ambassador_manual_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_promotional_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_departure_reschedule_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_upsells ENABLE ROW LEVEL SECURITY;
