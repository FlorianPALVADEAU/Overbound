import { describe, expect, it } from 'vitest'
import {
  assertTargetUpsellReachableForCampaign,
  requiresTargetUpsell,
  TargetUpsellNotReachableError,
} from './rewardTargeting'

const CAMPAIGN_ID = 'campaign-1'
const UPSELL_ID = 'upsell-1'

function buildAdmin({
  campaignEventIds,
  reachableUpsell,
}: {
  campaignEventIds: string[]
  reachableUpsell: boolean
}) {
  return {
    from: (table: string) => {
      if (table === 'lucky_wheel_campaign_events') {
        return {
          select: () => ({
            eq: async () => ({ data: campaignEventIds.map((event_id) => ({ event_id })), error: null }),
          }),
        }
      }
      if (table === 'upsells') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                or: () => ({
                  maybeSingle: async () => ({ data: reachableUpsell ? { id: UPSELL_ID } : null, error: null }),
                }),
              }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

describe('requiresTargetUpsell', () => {
  // FDR-0014 addendum, corrected 2026-09-27: split into explicit
  // percent/fixed variants -- see redemption.ts header for why.
  it('is true for the 4 product/photo percent/fixed variants', () => {
    expect(requiresTargetUpsell('PRODUCT_PERCENT_DISCOUNT')).toBe(true)
    expect(requiresTargetUpsell('PRODUCT_FIXED_DISCOUNT')).toBe(true)
    expect(requiresTargetUpsell('PHOTO_PERCENT_DISCOUNT')).toBe(true)
    expect(requiresTargetUpsell('PHOTO_FIXED_DISCOUNT')).toBe(true)
  })

  // FREE_PRODUCT/FREE_PHOTO_PACK joined 2026-09-27: same targeting need as
  // the *_DISCOUNT variants (a 100%-off code still needs a target upsell).
  it('is true for FREE_PRODUCT and FREE_PHOTO_PACK', () => {
    expect(requiresTargetUpsell('FREE_PRODUCT')).toBe(true)
    expect(requiresTargetUpsell('FREE_PHOTO_PACK')).toBe(true)
  })

  // FREE_TICKET targets the ticket, not an upsell -- same as
  // TICKET_PERCENT_DISCOUNT/TICKET_FIXED_DISCOUNT.
  it('is false for every other reward type, including FREE_TICKET', () => {
    expect(requiresTargetUpsell('TICKET_PERCENT_DISCOUNT')).toBe(false)
    expect(requiresTargetUpsell('FREE_TICKET')).toBe(false)
    expect(requiresTargetUpsell('CUSTOM')).toBe(false)
  })
})

describe('assertTargetUpsellReachableForCampaign', () => {
  it('resolves for a reward type that does not require a target', async () => {
    const admin = buildAdmin({ campaignEventIds: [], reachableUpsell: false })

    await expect(
      assertTargetUpsellReachableForCampaign({
        admin,
        rewardType: 'FREE_PRODUCT',
        campaignId: CAMPAIGN_ID,
        targetUpsellId: null,
      }),
    ).resolves.toBeUndefined()
  })

  it('resolves when the target upsell is active on at least one campaign event', async () => {
    const admin = buildAdmin({ campaignEventIds: ['event-1', 'event-2'], reachableUpsell: true })

    await expect(
      assertTargetUpsellReachableForCampaign({
        admin,
        rewardType: 'PRODUCT_PERCENT_DISCOUNT',
        campaignId: CAMPAIGN_ID,
        targetUpsellId: UPSELL_ID,
      }),
    ).resolves.toBeUndefined()
  })

  it('throws TargetUpsellNotReachableError when the campaign has no linked events', async () => {
    const admin = buildAdmin({ campaignEventIds: [], reachableUpsell: true })

    await expect(
      assertTargetUpsellReachableForCampaign({
        admin,
        rewardType: 'PRODUCT_FIXED_DISCOUNT',
        campaignId: CAMPAIGN_ID,
        targetUpsellId: UPSELL_ID,
      }),
    ).rejects.toBeInstanceOf(TargetUpsellNotReachableError)
  })

  it('throws TargetUpsellNotReachableError when the upsell is not active on any linked event', async () => {
    const admin = buildAdmin({ campaignEventIds: ['event-1'], reachableUpsell: false })

    await expect(
      assertTargetUpsellReachableForCampaign({
        admin,
        rewardType: 'PHOTO_FIXED_DISCOUNT',
        campaignId: CAMPAIGN_ID,
        targetUpsellId: UPSELL_ID,
      }),
    ).rejects.toBeInstanceOf(TargetUpsellNotReachableError)
  })
})
