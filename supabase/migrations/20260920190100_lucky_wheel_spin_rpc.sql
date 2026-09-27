-- FDR-0014 §3: Lucky Wheel spin RPC. Atomic, row-locked draw + inventory
-- decrement + allocation creation in one transaction. Mirrors the locking
-- pattern of assign_selected_wave_to_registration (FDR-0012,
-- 20260918_user_selected_open_wave.sql) -- no SELECT-then-UPDATE from
-- application code, per the FDR-0009 §1.2 lesson.

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
  v_running numeric := 0;
  v_allocation_id uuid;
  v_redemption_code text;
  v_expires_at timestamptz;
  v_spent_budget numeric;
BEGIN
  -- Lock the entry row first: prevents the same entry from being spun twice
  -- concurrently (belt-and-suspenders on top of the spun_at check and the
  -- (campaign_id, email) unique constraint on lucky_wheel_entries).
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

  -- Campaign budget (FDR-0014 §3/§7): spend computed from allocations already
  -- created for this campaign's rewards. Locked rows above already serialize
  -- concurrent spins against each other, so this read is consistent within
  -- the transaction.
  SELECT COALESCE(SUM(rw.estimated_cost), 0) INTO v_spent_budget
  FROM public.lucky_wheel_reward_allocations rwa
  JOIN public.lucky_wheel_rewards rw ON rw.id = rwa.reward_id
  WHERE rw.campaign_id = v_campaign.id;

  SELECT COALESCE(SUM(COALESCE(weight, 1)), 0) INTO v_total_weight
  FROM public.lucky_wheel_rewards
  WHERE campaign_id = v_campaign.id
    AND enabled = true
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
    -- No eligible reward: mark the entry spun anyway so it cannot be
    -- retried into existence once a reward frees up later (spec: refresh
    -- must not allow a reroll; a "no reward" result is still a final result).
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
    -- Should not happen given v_total_weight > 0, but never leave the entry
    -- unresolved.
    UPDATE public.lucky_wheel_entries SET spun_at = v_now WHERE id = p_wheel_entry_id;
    RETURN json_build_object('success', false, 'error', 'NO_REWARD_AVAILABLE');
  END IF;

  UPDATE public.lucky_wheel_rewards
  SET stock = CASE WHEN stock IS NOT NULL THEN stock - 1 ELSE NULL END,
      wins_count = wins_count + 1,
      updated_at = v_now
  WHERE id = v_reward.id;

  v_expires_at := v_now + make_interval(hours => v_campaign.reward_expiration_hours);

  -- Non-predictable, single-use redemption code. Only meaningful for reward
  -- types that translate into a dedicated promo code at checkout (FDR-0014
  -- §7); non-code rewards (e.g. a physical patch) can leave it null, but the
  -- RPC always generates one so the application layer decides per type
  -- without a second write.
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
  'FDR-0014 §3: atomic weighted draw + inventory decrement + allocation creation. Never call from application code as SELECT-then-UPDATE.';
