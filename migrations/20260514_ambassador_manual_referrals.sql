CREATE TABLE IF NOT EXISTS ambassador_manual_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ambassador_id, registration_id)
);

CREATE INDEX IF NOT EXISTS idx_ambassador_manual_referrals_ambassador_id
  ON ambassador_manual_referrals(ambassador_id);

CREATE INDEX IF NOT EXISTS idx_ambassador_manual_referrals_registration_id
  ON ambassador_manual_referrals(registration_id);
