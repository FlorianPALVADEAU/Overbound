-- FDR-0014 §6: the spec documents "weighted rewards OR explicit
-- probabilities" as two supported draw modes. The original RPC
-- (20260920190100) only ever read `weight`, silently ignoring
-- `probability` -- a reward configured with e.g. probability = 0.02 was
-- NOT drawn at 2%, it was drawn at weight-share of the total pool. This
-- migration makes `probability` authoritative when set.
--
-- Two-pass draw:
--   1. Rewards with an explicit `probability` are tried first, each as an
--      independent Bernoulli trial in a fixed (id-ordered) sequence:
--      roll < probability wins outright. This matches the spec's jackpot
--      example (FDR-0014 §2 doc, "probability: 0.0002" = 1 in 5000) taken
--      literally as an absolute chance, not a share of a pool.
--   2. If no explicit-probability reward hits, the remaining weighted pool
--      (rewards with probability IS NULL) is drawn exactly as before,
--      unaffected by whatever explicit probabilities exist elsewhere.
--
-- Rationale for independent trials over "explicit probabilities sum to a
-- budget, weighted pool fills the remainder": the spec's jackpot example
-- is written as a standalone absolute probability, not as a share of 100%
-- alongside other configured rewards, and independent trials keep each
-- reward's admin-configured number meaningful in isolation.
--
-- The reward eligibility filter (campaign_id, enabled, valid_from/until,
-- stock, max_wins, commercial_phase, budget) is unchanged; it is now
-- duplicated across 3 SELECTs instead of the original's 3 (probability IS
-- NOT NULL / IS NULL split replaces one repetition with another, net
-- neutral -- not worth a CTE for 3 short predicates in a function this
-- size).

CREATE OR REPLACE FUNCTION public.lucky_wheel_spin(
  p_wheel_entry_id uuid
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_entry public.lucky_wheel_entries%ROWTYPE;
  v_campaign public.lucky_wheel_campaigns%ROWTYPE;
  v_reward public.lucky_wheel_rewards%ROWTYPE;
  v_now timestamptz := now();
  v_total_weight numeric;
  v_roll numeric;
  v_allocation_id uuid;
  v_redemption_code text;
  v_expires_at timestamptz;
  v_spent_budget numeric;
  v_hit boolean := false;
BEGIN
  SELECT * INTO v_entry
  FROM public.lucky_wheel_entries
  WHERE id = p_wheel_entry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WHEEL_ENTRY_NOT_FOUND: entry % not found', p_wheel_entry_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_entry.spun_at IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_SPUN: entry % already spun at %', p_wheel_entry_id, v_entry.spun_at
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_campaign
  FROM public.lucky_wheel_campaigns
  WHERE id = v_entry.campaign_id
  FOR UPDATE;

  IF NOT FOUND OR v_campaign.enabled = false OR v_campaign.paused = true THEN
    RAISE EXCEPTION 'CAMPAIGN_UNAVAILABLE: campaign % is disabled or paused', v_entry.campaign_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_now < v_campaign.starts_at OR v_now > v_campaign.ends_at THEN
    RAISE EXCEPTION 'CAMPAIGN_UNAVAILABLE: campaign % is outside its active window', v_entry.campaign_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- Lock every eligible reward row up front so no other concurrent spin can
  -- decrement stock/max_wins on the same reward between eligibility check
  -- and draw (FDR-0014 §3 step 1-2).
  PERFORM 1
  FROM public.lucky_wheel_rewards
  WHERE campaign_id = v_campaign.id
    AND enabled = true
    AND (valid_from IS NULL OR valid_from <= v_now)
    AND (valid_until IS NULL OR valid_until >= v_now)
    AND (stock IS NULL OR stock > 0)
    AND (max_wins IS NULL OR wins_count < max_wins)
    AND v_campaign.commercial_phase = ANY (commercial_phases)
  FOR UPDATE;

  -- Campaign budget (FDR-0014 §3/§7): spend computed from allocations
  -- already created for this campaign's rewards. The lock above already
  -- serializes concurrent spins, so this read is consistent within the
  -- transaction.
  SELECT COALESCE(SUM(rw.estimated_cost), 0) INTO v_spent_budget
  FROM public.lucky_wheel_reward_allocations rwa
  JOIN public.lucky_wheel_rewards rw ON rw.id = rwa.reward_id
  WHERE rw.campaign_id = v_campaign.id;

  -- Pass 1: explicit-probability rewards, tried in a fixed order as
  -- independent trials. First one to hit its own roll wins outright.
  FOR v_reward IN
    SELECT r.*
    FROM public.lucky_wheel_rewards r
    WHERE r.campaign_id = v_campaign.id
      AND r.enabled = true
      AND r.probability IS NOT NULL
      AND (r.valid_from IS NULL OR r.valid_from <= v_now)
      AND (r.valid_until IS NULL OR r.valid_until >= v_now)
      AND (r.stock IS NULL OR r.stock > 0)
      AND (r.max_wins IS NULL OR r.wins_count < r.max_wins)
      AND v_campaign.commercial_phase = ANY (r.commercial_phases)
      AND (
        v_campaign.max_discount_budget IS NULL
        OR r.estimated_cost IS NULL
        OR v_spent_budget + r.estimated_cost <= v_campaign.max_discount_budget
      )
    ORDER BY r.id
  LOOP
    IF random() < v_reward.probability THEN
      v_hit := true;
      EXIT;
    END IF;
  END LOOP;

  -- Pass 2: weighted pool among rewards with no explicit probability. Only
  -- runs if no explicit-probability reward hit above (v_hit stays false and
  -- v_reward already holds the winning row otherwise -- PL/pgSQL FOR..IN
  -- leaves the loop variable at its last-assigned value after EXIT).
  IF NOT v_hit THEN
    SELECT COALESCE(SUM(COALESCE(weight, 1)), 0) INTO v_total_weight
    FROM public.lucky_wheel_rewards
    WHERE campaign_id = v_campaign.id
      AND enabled = true
      AND probability IS NULL
      AND (valid_from IS NULL OR valid_from <= v_now)
      AND (valid_until IS NULL OR valid_until >= v_now)
      AND (stock IS NULL OR stock > 0)
      AND (max_wins IS NULL OR wins_count < max_wins)
      AND v_campaign.commercial_phase = ANY (commercial_phases)
      AND (
        v_campaign.max_discount_budget IS NULL
        OR estimated_cost IS NULL
        OR v_spent_budget + estimated_cost <= v_campaign.max_discount_budget
      );

    IF v_total_weight IS NULL OR v_total_weight <= 0 THEN
      UPDATE public.lucky_wheel_entries SET spun_at = v_now WHERE id = p_wheel_entry_id;
      RETURN json_build_object('success', false, 'error', 'NO_REWARD_AVAILABLE');
    END IF;

    v_roll := random() * v_total_weight;

    SELECT * INTO v_reward
    FROM (
      SELECT *, SUM(COALESCE(weight, 1)) OVER (ORDER BY id) AS running_weight
      FROM public.lucky_wheel_rewards
      WHERE campaign_id = v_campaign.id
        AND enabled = true
        AND probability IS NULL
        AND (valid_from IS NULL OR valid_from <= v_now)
        AND (valid_until IS NULL OR valid_until >= v_now)
        AND (stock IS NULL OR stock > 0)
        AND (max_wins IS NULL OR wins_count < max_wins)
        AND v_campaign.commercial_phase = ANY (commercial_phases)
        AND (
          v_campaign.max_discount_budget IS NULL
          OR estimated_cost IS NULL
          OR v_spent_budget + estimated_cost <= v_campaign.max_discount_budget
        )
    ) ranked
    WHERE running_weight >= v_roll
    ORDER BY running_weight
    LIMIT 1;

    IF NOT FOUND THEN
      UPDATE public.lucky_wheel_entries SET spun_at = v_now WHERE id = p_wheel_entry_id;
      RETURN json_build_object('success', false, 'error', 'NO_REWARD_AVAILABLE');
    END IF;
  END IF;

  UPDATE public.lucky_wheel_rewards
  SET stock = CASE WHEN stock IS NOT NULL THEN stock - 1 ELSE NULL END,
      wins_count = wins_count + 1,
      updated_at = v_now
  WHERE id = v_reward.id;

  v_expires_at := v_now + make_interval(hours => v_campaign.reward_expiration_hours);

  v_redemption_code := encode(gen_random_bytes(9), 'base64');
  v_redemption_code := replace(replace(replace(v_redemption_code, '/', ''), '+', ''), '=', '');

  INSERT INTO public.lucky_wheel_reward_allocations (
    wheel_entry_id, reward_id, redemption_code, won_at, expires_at
  ) VALUES (
    p_wheel_entry_id, v_reward.id, v_redemption_code, v_now, v_expires_at
  )
  RETURNING id INTO v_allocation_id;

  UPDATE public.lucky_wheel_entries SET spun_at = v_now WHERE id = p_wheel_entry_id;

  RETURN json_build_object(
    'success', true,
    'allocation_id', v_allocation_id,
    'reward_id', v_reward.id,
    'reward_name', v_reward.name,
    'reward_type', v_reward.type,
    'redemption_code', v_redemption_code,
    'won_at', v_now,
    'expires_at', v_expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.lucky_wheel_spin(uuid) IS
  'FDR-0014 §3/§6: two-pass draw -- explicit probability rewards as independent Bernoulli trials first, then weighted pool among the rest. Never call from application code as SELECT-then-UPDATE.';
