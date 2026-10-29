-- Per-recipient ledger of marketing campaigns (ADR-0006, plan P3).
-- One row per (campaign, address). It makes a campaign resumable: a request that stops on its time
-- budget, or a re-click after a partial failure, skips every address already sent and retries the
-- others. It also records why a send failed, which email_logs cannot do for subscribers without
-- an account (email_logs.user_id is a NOT NULL uuid).
--
-- Written and reviewed only: NOT applied automatically (FDR-0009). Apply on a Supabase branch first,
-- and BEFORE deploying the code that writes to it (without the table a campaign aborts, it never
-- sends unrecorded).
-- Service role only: RLS on with no policy, grants revoked for anon and authenticated.
--
-- Rollback: DROP TABLE public.marketing_sends;

CREATE TABLE IF NOT EXISTS public.marketing_sends (
  campaign_key text NOT NULL,
  email text NOT NULL,
  user_id uuid,
  status text NOT NULL CHECK (status IN ('sent', 'failed_permanent', 'failed_transient')),
  provider text NOT NULL,
  message_id text,
  error text,
  attempts integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_key, email),
  CONSTRAINT marketing_sends_email_lowercase CHECK (email = lower(email))
);

CREATE INDEX IF NOT EXISTS marketing_sends_campaign_status_idx
  ON public.marketing_sends (campaign_key, status);

ALTER TABLE public.marketing_sends ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.marketing_sends FROM anon, authenticated;
GRANT ALL ON public.marketing_sends TO service_role;
