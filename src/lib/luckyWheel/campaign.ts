// FDR-0014 §2/§12.2: campaign.enabled + paused IS the feature flag (no env
// var, matches repo convention -- see FDR-0014 §12.2). A campaign spans
// multiple events via lucky_wheel_campaign_events (Q-1).

type AdminClient = any

export type ActiveCampaign = {
  id: string
  name: string
  triggerRules: Record<string, unknown>
  commercialPhase: string
  rewardExpirationHours: number
}

export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type DisplayableReward = {
  id: string
  name: string
  type: string
  rarity: RewardRarity
  imageUrl: string | null
}

/**
 * Buckets a reward's real weight/probability into a coarse rarity tier for
 * color coding (product request 2026-09-22). Deliberately a 4-value enum,
 * never the raw number: spec §17 forbids implying a probability that isn't
 * the real one, and while a color gradient tied to real rarity is honest
 * (unlike equal-size segments would be if colored by rarity too), exposing
 * exact weight/probability would let a participant back-calculate their
 * real odds, which the product has chosen not to surface. `probability` (an
 * absolute chance) and `weight` (a relative share) aren't comparable
 * numbers -- probability is ranked against fixed thresholds, weight is
 * ranked relative to the other weighted rewards' median in the same pool.
 */
const rarityFromProbability = (probability: number): RewardRarity => {
  if (probability <= 0.01) return 'legendary'
  if (probability <= 0.05) return 'rare'
  if (probability <= 0.2) return 'uncommon'
  return 'common'
}

const rarityFromWeightRank = (weight: number, sortedWeightsAsc: number[]): RewardRarity => {
  const position = sortedWeightsAsc.indexOf(weight)
  const percentile = sortedWeightsAsc.length > 1 ? position / (sortedWeightsAsc.length - 1) : 1
  // Lower weight = smaller share of the pool = rarer. percentile is the
  // weight's rank among its peers, ascending, so a low percentile (small
  // weight) maps to a rarer tier.
  if (percentile <= 0.15) return 'legendary'
  if (percentile <= 0.4) return 'rare'
  if (percentile <= 0.7) return 'uncommon'
  return 'common'
}

/**
 * Resolves the active Lucky Wheel campaign for a given event, or null if
 * none applies. "Active" = enabled, not paused, within its date window, and
 * associated with this event via lucky_wheel_campaign_events. Never exposes
 * estimated_cost or other admin-only fields -- callers of this function are
 * public-facing routes.
 */
export const getActiveCampaignForEvent = async ({
  admin,
  eventId,
}: {
  admin: AdminClient
  eventId: string
}): Promise<ActiveCampaign | null> => {
  const now = new Date().toISOString()

  const { data, error } = await admin
    .from('lucky_wheel_campaigns')
    .select(
      'id, name, trigger_rules, commercial_phase, reward_expiration_hours, lucky_wheel_campaign_events!inner(event_id)',
    )
    .eq('enabled', true)
    .eq('paused', false)
    .eq('lucky_wheel_campaign_events.event_id', eventId)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    name: data.name,
    triggerRules: data.trigger_rules ?? {},
    commercialPhase: data.commercial_phase,
    rewardExpirationHours: data.reward_expiration_hours,
  }
}

/**
 * Rewards to render on the wheel before spinning, for the "what can I win"
 * suspense (spec §3.3: probabilities must not be misrepresented). Mirrors
 * the eligibility filter used by lucky_wheel_spin (enabled, valid window,
 * stock/max_wins, commercial phase) so the wheel never shows a segment the
 * draw could never actually pick -- but never exposes weight, probability,
 * or estimated_cost, only what's needed to render a segment label.
 */
export const getDisplayableRewardsForCampaign = async ({
  admin,
  campaignId,
  commercialPhase,
}: {
  admin: AdminClient
  campaignId: string
  commercialPhase: string
}): Promise<DisplayableReward[]> => {
  const now = new Date().toISOString()

  const { data, error } = await admin
    .from('lucky_wheel_rewards')
    .select(
      'id, name, type, weight, probability, stock, max_wins, wins_count, valid_from, valid_until, commercial_phases, image_url',
    )
    .eq('campaign_id', campaignId)
    .eq('enabled', true)

  if (error) {
    throw error
  }

  const eligible = (data ?? []).filter((reward: any) => {
    if (reward.valid_from && reward.valid_from > now) return false
    if (reward.valid_until && reward.valid_until < now) return false
    if (reward.stock !== null && reward.stock <= 0) return false
    if (reward.max_wins !== null && reward.wins_count >= reward.max_wins) return false
    if (!reward.commercial_phases.includes(commercialPhase)) return false
    return true
  })

  const weightedPoolWeights = eligible
    .filter((reward: any) => reward.probability === null)
    .map((reward: any) => reward.weight ?? 1)
    .sort((a: number, b: number) => a - b)

  return eligible.map((reward: any) => ({
    id: reward.id,
    name: reward.name,
    type: reward.type,
    rarity:
      reward.probability !== null
        ? rarityFromProbability(reward.probability)
        : rarityFromWeightRank(reward.weight ?? 1, weightedPoolWeights),
    imageUrl: reward.image_url ?? null,
  }))
}
