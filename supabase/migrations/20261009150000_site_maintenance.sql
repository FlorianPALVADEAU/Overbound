-- Global maintenance switch. Single row (id is always true).
-- Read by the edge middleware with the anon key on every request, hence the public SELECT policy:
-- the row holds no secret. Writes go through /api/admin/maintenance (service role, admin only).

CREATE TABLE IF NOT EXISTS public.site_maintenance (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  message text,
  estimated_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

INSERT INTO public.site_maintenance (id, enabled) VALUES (true, false) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_maintenance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_maintenance_public_read" ON public.site_maintenance;
CREATE POLICY "site_maintenance_public_read"
  ON public.site_maintenance FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON public.site_maintenance FROM anon, authenticated;
GRANT SELECT ON public.site_maintenance TO anon, authenticated;
GRANT ALL ON public.site_maintenance TO service_role;
