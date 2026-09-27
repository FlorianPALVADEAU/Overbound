-- Older reward generation paths could persist a newly earned reward as
-- fulfilled without any claim or fulfillment timestamp. Such rows were never
-- actually sent and must start in the unlocked state.

update public.ambassador_rewards
set status = 'earned',
    updated_at = now()
where status = 'fulfilled'
  and claimed_at is null
  and fulfilled_at is null;
