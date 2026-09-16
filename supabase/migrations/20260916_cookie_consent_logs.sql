-- Server-side, timestamped proof of cookie consent decisions (FDR-0009 §2.6).
-- The banner already stores the decision in localStorage for client-side gating
-- of analytics scripts; this table adds the audit trail an ANIL/CNIL request
-- would ask for, independent of a browser's local storage.
--
-- No auth required: the banner can show before login, and consent is a
-- per-browser decision, not a per-account one. RLS: insert-only from the
-- anon/authenticated role (never update/delete/select from the client),
-- full access reserved to the service role.

CREATE TABLE IF NOT EXISTS "public"."cookie_consent_logs" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "analytics_accepted" boolean NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "user_id" uuid
);

ALTER TABLE "public"."cookie_consent_logs" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "cookie_consent_logs_created_at_idx"
  ON "public"."cookie_consent_logs" USING btree ("created_at" DESC);

CREATE POLICY "anyone_can_log_consent"
  ON "public"."cookie_consent_logs"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
