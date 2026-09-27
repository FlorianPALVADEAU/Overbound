-- Public registration pages read active global and event-specific upsells.
-- Existing RLS policies remain responsible for row-level visibility.
grant select on table public.upsells to anon, authenticated;

-- Server-side administration uses the service role.
grant select, insert, update, delete on table public.upsells to service_role;
