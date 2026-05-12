ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS anchor_initialized_by TEXT,
  ADD COLUMN IF NOT EXISTS anchor_initialized_from_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS anchor_initialized_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'groups_anchor_initialized_by_check'
  ) THEN
    ALTER TABLE groups
      ADD CONSTRAINT groups_anchor_initialized_by_check
      CHECK (
        anchor_initialized_by IS NULL
        OR anchor_initialized_by IN ('creator', 'member_join', 'admin_manual')
      );
  END IF;
END $$;
