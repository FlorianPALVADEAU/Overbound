-- The public registration APIs join upsells with their gallery rows.
-- RLS controls which rows are visible; this grants only the table privilege
-- required for the existing public SELECT policy to take effect.
grant select on table public.upsell_images to anon, authenticated;

-- Admin API routes use the service role and also need explicit table access.
grant select, insert, update, delete on table public.upsell_images to service_role;
