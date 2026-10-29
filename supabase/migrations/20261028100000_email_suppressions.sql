-- Marketing email suppression list (ADR-0006, plan: SES marketing + Supabase audience).
-- An address lands here after a permanent bounce or a spam complaint reported by Amazon SES
-- (SNS -> /api/webhooks/ses). The audience resolver and the marketing sender both exclude it.
--
-- Written and reviewed only: NOT applied automatically (FDR-0009). Apply on a Supabase branch first.
-- Service role only: no policy is created, so RLS blocks anon and authenticated entirely, and the
-- grants are revoked so the Data API cannot reach the table even if a policy is added by mistake.
--
-- Rollback: DROP TABLE public.email_suppressions;

CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email text PRIMARY KEY,
  reason text NOT NULL CHECK (reason IN ('bounce', 'complaint')),
  source text NOT NULL DEFAULT 'ses',
  -- SNS MessageId of the event that created the row: makes a replayed notification a no-op.
  event_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_suppressions_email_lowercase CHECK (email = lower(email))
);

CREATE UNIQUE INDEX IF NOT EXISTS email_suppressions_event_id_key
  ON public.email_suppressions (event_id)
  WHERE event_id IS NOT NULL;

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.email_suppressions FROM anon, authenticated;
GRANT ALL ON public.email_suppressions TO service_role;
