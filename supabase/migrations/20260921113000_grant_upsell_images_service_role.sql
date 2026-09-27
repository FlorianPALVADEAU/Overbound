-- The server-side Supabase client uses service_role to read and mutate the
-- gallery. RLS does not replace the underlying table privilege grant.
grant select, insert, update, delete on table public.upsell_images to service_role;
