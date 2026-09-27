-- FDR-0014: Lucky Wheel schema. Conversion mechanism (email capture + server-side
-- spin + reward applied at checkout), campaign spans multiple events (Q-1),
-- reward only redeemable through a purchase (Q-2). See
-- docs/fdr/FDR-0014-lucky-wheel.md.
--
-- RLS enabled from creation, not retrofitted (FDR-0009 §2.2 lesson). Admin
-- write access follows the existing repo convention: inline
-- profiles.role = 'admin' EXISTS subquery (no is_admin() helper exists in
-- this schema, verified against prod-schema.sql).

CREATE TABLE IF NOT EXISTS public.lucky_wheel_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  paused boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  trigger_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  commercial_phase text NOT NULL DEFAULT 'STANDARD',
  reward_expiration_hours integer NOT NULL DEFAULT 48,
  max_discount_budget numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lucky_wheel_campaigns_phase_check
    CHECK (commercial_phase IN ('LAUNCH', 'STANDARD', 'HIGH_DEMAND')),
  CONSTRAINT lucky_wheel_campaigns_dates_check CHECK (starts_at < ends_at),
  CONSTRAINT lucky_wheel_campaigns_expiration_check CHECK (reward_expiration_hours > 0),
  CONSTRAINT lucky_wheel_campaigns_budget_check
    CHECK (max_discount_budget IS NULL OR max_discount_budget >= 0)
);

COMMENT ON COLUMN public.lucky_wheel_campaigns.max_discount_budget IS
  'FDR-0014 §3/§7: cumulative estimated_cost cap across all allocations for this campaign. NULL = unlimited.';

COMMENT ON TABLE public.lucky_wheel_campaigns IS
  'Lucky Wheel campaign config. Multi-event via lucky_wheel_campaign_events (FDR-0014 Q-1).';

CREATE TABLE IF NOT EXISTS public.lucky_wheel_campaign_events (
  campaign_id uuid NOT NULL REFERENCES public.lucky_wheel_campaigns(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_lucky_wheel_campaign_events_event_id
  ON public.lucky_wheel_campaign_events(event_id);

CREATE TABLE IF NOT EXISTS public.lucky_wheel_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.lucky_wheel_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  weight numeric,
  probability numeric,
  stock integer,
  max_wins integer,
  wins_count integer NOT NULL DEFAULT 0,
  public_value numeric,
  estimated_cost numeric,
  minimum_basket numeric,
  valid_from timestamptz,
  valid_until timestamptz,
  commercial_phases text[] NOT NULL DEFAULT ARRAY['LAUNCH', 'STANDARD', 'HIGH_DEMAND'],
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lucky_wheel_rewards_type_check CHECK (type IN (
    'TICKET_PERCENT_DISCOUNT', 'TICKET_FIXED_DISCOUNT', 'FREE_TICKET',
    'FREE_PRODUCT', 'PRODUCT_DISCOUNT', 'PHOTO_DISCOUNT', 'FREE_PHOTO_PACK', 'CUSTOM'
  )),
  CONSTRAINT lucky_wheel_rewards_stock_check CHECK (stock IS NULL OR stock >= 0),
  CONSTRAINT lucky_wheel_rewards_max_wins_check CHECK (max_wins IS NULL OR max_wins >= 0),
  CONSTRAINT lucky_wheel_rewards_wins_count_check CHECK (wins_count >= 0),
  CONSTRAINT lucky_wheel_rewards_weight_check CHECK (weight IS NULL OR weight >= 0),
  CONSTRAINT lucky_wheel_rewards_probability_check
    CHECK (probability IS NULL OR (probability >= 0 AND probability <= 1))
);

CREATE INDEX IF NOT EXISTS idx_lucky_wheel_rewards_campaign_id
  ON public.lucky_wheel_rewards(campaign_id);

CREATE TABLE IF NOT EXISTS public.lucky_wheel_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.lucky_wheel_campaigns(id),
  event_id uuid NOT NULL REFERENCES public.events(id),
  email text NOT NULL,
  session_id text,
  marketing_consent boolean NOT NULL DEFAULT false,
  spun_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, email)
);

CREATE INDEX IF NOT EXISTS idx_lucky_wheel_entries_email
  ON public.lucky_wheel_entries(email);
CREATE INDEX IF NOT EXISTS idx_lucky_wheel_entries_event_id
  ON public.lucky_wheel_entries(event_id);

CREATE TABLE IF NOT EXISTS public.lucky_wheel_reward_allocations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wheel_entry_id uuid NOT NULL REFERENCES public.lucky_wheel_entries(id),
  reward_id uuid NOT NULL REFERENCES public.lucky_wheel_rewards(id),
  redemption_code text UNIQUE,
  redemption_event_id uuid REFERENCES public.events(id),
  won_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz,
  order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lucky_wheel_allocations_wheel_entry_id
  ON public.lucky_wheel_reward_allocations(wheel_entry_id);
CREATE INDEX IF NOT EXISTS idx_lucky_wheel_allocations_reward_id
  ON public.lucky_wheel_reward_allocations(reward_id);
CREATE INDEX IF NOT EXISTS idx_lucky_wheel_allocations_redemption_code
  ON public.lucky_wheel_reward_allocations(redemption_code);

-- RLS -------------------------------------------------------------------

ALTER TABLE public.lucky_wheel_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_wheel_campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_wheel_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_wheel_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_wheel_reward_allocations ENABLE ROW LEVEL SECURITY;

-- Campaigns/rewards/campaign_events: public read of non-sensitive fields is
-- handled at the API layer (route selects only the columns the widget
-- needs, never estimated_cost). RLS itself stays coarse: anon/authenticated
-- can SELECT active rows, only admins can write.
CREATE POLICY "Anyone can view enabled lucky wheel campaigns"
  ON public.lucky_wheel_campaigns FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage lucky wheel campaigns"
  ON public.lucky_wheel_campaigns FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Anyone can view lucky wheel campaign events"
  ON public.lucky_wheel_campaign_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage lucky wheel campaign events"
  ON public.lucky_wheel_campaign_events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Anyone can view enabled lucky wheel rewards"
  ON public.lucky_wheel_rewards FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage lucky wheel rewards"
  ON public.lucky_wheel_rewards FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Entries/allocations: never readable by anon directly (no user_id column,
-- deliberately -- a wheel participant is not necessarily an authenticated
-- user). All application access goes through the service-role client via
-- API routes that authorize by matching email/redemption_code server-side.
-- Only admins get a direct SELECT policy for the dashboard.
CREATE POLICY "Admins can view lucky wheel entries"
  ON public.lucky_wheel_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can view lucky wheel reward allocations"
  ON public.lucky_wheel_reward_allocations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Table-level GRANT: RLS (above) is meaningless without base privileges.
-- Every other table in this schema gets these implicitly via
-- ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" (see prod-schema.sql), which
-- only applies to tables created by that exact role. Grant explicitly here
-- so this migration is correct regardless of which role runs it
-- (local CLI, dashboard SQL editor, or the "postgres" role in prod).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lucky_wheel_campaigns TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lucky_wheel_campaign_events TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lucky_wheel_rewards TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lucky_wheel_entries TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lucky_wheel_reward_allocations TO anon, authenticated, service_role;
