-- Quote requests sent from the /entreprises page (marketing plan V2, section 7).
-- One row per request: it is the pipeline the founder works from (status), and it keeps the
-- acquisition source (utm) so each deal can be tied back to a channel.
--
-- Written and reviewed only: NOT applied automatically (FDR-0009). Apply on a Supabase branch first,
-- and BEFORE deploying the code that writes to it (without the table the route answers 500 and
-- the visitor is asked to write by email).
-- Service role only: RLS on with no policy, grants revoked for anon and authenticated. The public
-- route validates the payload (Zod) and inserts with the service role.
--
-- Rollback: DROP TABLE public.b2b_quote_requests;

CREATE TABLE IF NOT EXISTS public.b2b_quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  company_name text NOT NULL CHECK (char_length(company_name) BETWEEN 2 AND 120),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (email = lower(email) AND char_length(email) <= 254),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 30),
  team_size text NOT NULL CHECK (team_size IN ('2-5', '6-9', '10-19', '20-49', '50+')),
  project_type text NOT NULL CHECK (project_type IN ('tickets', 'tickets-options', 'custom', 'partnership')),
  message text CHECK (message IS NULL OR char_length(message) <= 2000),
  utm jsonb,
  source text NOT NULL DEFAULT 'entreprises-page',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost'))
);

CREATE INDEX IF NOT EXISTS b2b_quote_requests_status_created_idx
  ON public.b2b_quote_requests (status, created_at DESC);

ALTER TABLE public.b2b_quote_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.b2b_quote_requests FROM anon, authenticated;
GRANT ALL ON public.b2b_quote_requests TO service_role;
