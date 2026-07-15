-- Ensure the unique constraint exists on ambassador_rewards so that
-- upsert(onConflict: 'ambassador_id,reward_level') works correctly for
-- both the fixed tiers (1-10) and the dynamic bonus tickets (11+).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ambassador_rewards_ambassador_id_reward_level_key'
      AND conrelid = 'ambassador_rewards'::regclass
  ) THEN
    ALTER TABLE ambassador_rewards
      ADD CONSTRAINT ambassador_rewards_ambassador_id_reward_level_key
      UNIQUE (ambassador_id, reward_level);
  END IF;
END $$;
