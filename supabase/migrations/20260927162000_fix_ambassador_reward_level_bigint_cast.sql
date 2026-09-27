-- Supabase/PostgREST exposes SUM(integer) as bigint.  The existing reward
-- level helper accepts integer, so aggregate expressions used by the annual
-- adjustment RPC need a bigint-compatible overload.

create or replace function public.ambassador_reward_level_for_points(p_total_points bigint)
returns integer
language sql
immutable
security invoker
set search_path = public
as $$
  select public.ambassador_reward_level_for_points(p_total_points::integer);
$$;

comment on function public.ambassador_reward_level_for_points(bigint) is
  'Bigint adapter for aggregate point calculations; delegates to the canonical integer helper.';

revoke all on function public.ambassador_reward_level_for_points(bigint) from public, anon, authenticated;
grant execute on function public.ambassador_reward_level_for_points(bigint) to service_role;
