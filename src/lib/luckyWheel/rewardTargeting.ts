// FDR-0014 addendum (product-line discounts) §3.1: validates that a
// PRODUCT_DISCOUNT/PHOTO_DISCOUNT reward's target_upsell_id is actually
// reachable by at least one of the campaign's linked events -- a reward
// configured on an upsell that exists nowhere the campaign runs could never
// be won meaningfully redeemed. Applicative validation, not a DB CHECK: the
// rule depends on reward.type, and "the upsell is active for at least one
// linked event" needs a join query a CHECK constraint can't express.

type AdminClient = any

export class TargetUpsellNotReachableError extends Error {
  constructor(upsellId: string) {
    super(
      `TARGET_UPSELL_NOT_REACHABLE: upsell ${upsellId} is not active on any event linked to this campaign`,
    )
    this.name = 'TargetUpsellNotReachableError'
  }
}

// FREE_PRODUCT/FREE_PHOTO_PACK joined 2026-09-27: same targeting need as
// the *_DISCOUNT variants (a 100%-off code still needs to know which
// upsell it's 100% off). FREE_TICKET is deliberately absent -- it targets
// the ticket, not an upsell, same as TICKET_PERCENT_DISCOUNT.
const PRODUCT_SCOPED_REWARD_TYPES = new Set([
  'PRODUCT_PERCENT_DISCOUNT',
  'PRODUCT_FIXED_DISCOUNT',
  'PHOTO_PERCENT_DISCOUNT',
  'PHOTO_FIXED_DISCOUNT',
  'FREE_PRODUCT',
  'FREE_PHOTO_PACK',
])

export const requiresTargetUpsell = (rewardType: string) => PRODUCT_SCOPED_REWARD_TYPES.has(rewardType)

/**
 * Throws TargetUpsellNotReachableError if targetUpsellId isn't active on at
 * least one event linked to campaignId. An upsell with event_id IS NULL
 * (global -- sold on every event) always counts as reachable. No-op for
 * reward types that don't require a target (nothing to validate).
 */
export const assertTargetUpsellReachableForCampaign = async ({
  admin,
  rewardType,
  campaignId,
  targetUpsellId,
}: {
  admin: AdminClient
  rewardType: string
  campaignId: string
  targetUpsellId: string | null | undefined
}): Promise<void> => {
  if (!requiresTargetUpsell(rewardType)) return
  if (!targetUpsellId) return // Schema-level "required" is enforced by the caller's Zod schema, not here.

  const { data: campaignEvents, error: campaignEventsError } = await admin
    .from('lucky_wheel_campaign_events')
    .select('event_id')
    .eq('campaign_id', campaignId)

  if (campaignEventsError) throw campaignEventsError

  const eventIds = (campaignEvents ?? []).map((row: { event_id: string }) => row.event_id)
  if (eventIds.length === 0) {
    throw new TargetUpsellNotReachableError(targetUpsellId)
  }

  const orFilter = eventIds.map((eventId: string) => `event_id.eq.${eventId}`).concat('event_id.is.null').join(',')

  const { data: reachableUpsell, error: upsellError } = await admin
    .from('upsells')
    .select('id')
    .eq('id', targetUpsellId)
    .eq('is_active', true)
    .or(orFilter)
    .maybeSingle()

  if (upsellError) throw upsellError
  if (!reachableUpsell) {
    throw new TargetUpsellNotReachableError(targetUpsellId)
  }
}
