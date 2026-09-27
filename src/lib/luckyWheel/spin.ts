// FDR-0014 §3/§12.1: server-side spin. The result is always determined by
// the lucky_wheel_spin RPC (row-locked draw + inventory decrement +
// allocation creation in one transaction) -- never computed here.

import { mintLuckyWheelPromoCode } from './redemption'

type AdminClient = any

export type SpinResult =
  | {
      success: true
      allocationId: string
      rewardId: string
      rewardName: string
      rewardType: string
      // The real, manually-enterable promo code for discount-type rewards
      // (minted synchronously right below, in this same call) -- null for
      // reward types with no checkout-side effect (FREE_PRODUCT, etc.).
      promoCode: string | null
      wonAt: string
      expiresAt: string
    }
  | {
      success: false
      error: 'NO_REWARD_AVAILABLE'
    }

// FDR-0014 addendum (product-line discounts) §3.3, corrected 2026-09-27:
// PRODUCT_PERCENT_DISCOUNT/PRODUCT_FIXED_DISCOUNT/PHOTO_PERCENT_DISCOUNT/
// PHOTO_FIXED_DISCOUNT joined the mint path (replacing the unsuffixed,
// unit-ambiguous PRODUCT_DISCOUNT/PHOTO_DISCOUNT). FREE_TICKET/
// FREE_PRODUCT/FREE_PHOTO_PACK joined too (2026-09-27, same day): these
// were always meant to be a 100%-off code (FDR-0014 §7 original decision
// for FREE_TICKET) but were never actually wired in, so winners got no
// code at all -- reported for FREE_PRODUCT (a physical patch). Must match
// redemption.ts's set exactly (that file is the one that actually knows
// how to price each type; this set only decides whether to attempt a mint
// at all).
const DISCOUNT_REWARD_TYPES = new Set([
  'TICKET_PERCENT_DISCOUNT',
  'TICKET_FIXED_DISCOUNT',
  'PRODUCT_PERCENT_DISCOUNT',
  'PRODUCT_FIXED_DISCOUNT',
  'PHOTO_PERCENT_DISCOUNT',
  'PHOTO_FIXED_DISCOUNT',
  'FREE_TICKET',
  'FREE_PRODUCT',
  'FREE_PHOTO_PACK',
])

export class WheelEntryNotFoundError extends Error {
  constructor(wheelEntryId: string) {
    super(`WHEEL_ENTRY_NOT_FOUND: entry ${wheelEntryId} not found`)
    this.name = 'WheelEntryNotFoundError'
  }
}

export class AlreadySpunError extends Error {
  constructor(wheelEntryId: string) {
    super(`ALREADY_SPUN: entry ${wheelEntryId} already spun`)
    this.name = 'AlreadySpunError'
  }
}

export class CampaignUnavailableError extends Error {
  constructor(campaignId: string) {
    super(`CAMPAIGN_UNAVAILABLE: campaign ${campaignId} is disabled, paused, or outside its window`)
    this.name = 'CampaignUnavailableError'
  }
}

const isErrorCode = (error: unknown, code: string) => {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes(code)
}

/**
 * Calls lucky_wheel_spin. The frontend must animate toward the returned
 * result, never determine it (spec §3.3, FDR-0014 §2). Throws typed errors
 * for entry/campaign-level failures; a "no reward available" outcome is not
 * an error -- it's a valid terminal draw result (success: false in the
 * returned SpinResult), because the entry is still marked spun server-side
 * to prevent a retry (refresh must not allow a reroll).
 */
export const spinLuckyWheel = async ({
  admin,
  wheelEntryId,
}: {
  admin: AdminClient
  wheelEntryId: string
}): Promise<SpinResult> => {
  const { data, error } = await admin.rpc('lucky_wheel_spin', {
    p_wheel_entry_id: wheelEntryId,
  })

  if (error) {
    if (isErrorCode(error, 'WHEEL_ENTRY_NOT_FOUND')) {
      throw new WheelEntryNotFoundError(wheelEntryId)
    }
    if (isErrorCode(error, 'ALREADY_SPUN')) {
      throw new AlreadySpunError(wheelEntryId)
    }
    if (isErrorCode(error, 'CAMPAIGN_UNAVAILABLE')) {
      throw new CampaignUnavailableError(wheelEntryId)
    }
    throw error
  }

  if (data.success === false) {
    return { success: false, error: 'NO_REWARD_AVAILABLE' }
  }

  let promoCode: string | null = null
  if (DISCOUNT_REWARD_TYPES.has(data.reward_type)) {
    // Minted synchronously, in the same request, not lazily at checkout --
    // see redemption.ts header for why (device-memory checkout auto-apply
    // was reported broken end to end). A failure here must still surface
    // the win itself; the participant can be pointed at support with the
    // allocation id if the code truly never got minted.
    const minted = await mintLuckyWheelPromoCode({ admin, allocationId: data.allocation_id })
    promoCode = minted.code
  }

  return {
    success: true,
    allocationId: data.allocation_id,
    rewardId: data.reward_id,
    rewardName: data.reward_name,
    rewardType: data.reward_type,
    promoCode,
    wonAt: data.won_at,
    expiresAt: data.expires_at,
  }
}
