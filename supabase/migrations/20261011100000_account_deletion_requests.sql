-- Self-service erasure requests (RGPD art. 17). The request is recorded and handled by an admin within one
-- month: registrations and invoices tied to a paid order must be kept for accounting, so erasure is a reviewed
-- anonymisation, never an automatic hard delete. Writes go through /api/account/deletion-request (service role).

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  note text
);

CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_requests_one_pending_per_user
  ON public.account_deletion_requests (user_id) WHERE status = 'pending';

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.account_deletion_requests FROM anon, authenticated;
GRANT ALL ON public.account_deletion_requests TO service_role;
