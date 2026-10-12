-- Consent is now collected per purpose (audience vs marketing), and the stored IP is truncated.
-- Existing rows predate the split: they only ever recorded the single "analytics" choice, so marketing is false.

ALTER TABLE public.cookie_consent_logs
  ADD COLUMN IF NOT EXISTS marketing_accepted boolean NOT NULL DEFAULT false;
