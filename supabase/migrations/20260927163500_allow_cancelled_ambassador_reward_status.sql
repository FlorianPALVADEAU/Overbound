-- The annual reward lifecycle introduces an audited cancelled state. Extend
-- the legacy status check without changing existing rows or statuses.

alter table public.ambassador_rewards
  drop constraint if exists ambassador_rewards_status_check;

alter table public.ambassador_rewards
  add constraint ambassador_rewards_status_check
  check (status in ('earned', 'claimed', 'fulfilled', 'cancelled'));
