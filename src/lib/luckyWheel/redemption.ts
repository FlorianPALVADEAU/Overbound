// FDR-0014 §7 (revised 2026-09-21): applies a discount-type reward
// allocation via a plain, manually-enterable promotional_codes row --
// reuses the existing promo code mechanism (src/lib/registration.ts,
// src/lib/pricing.ts, /api/promotions/validate, the Stripe webhook's
// promo_code lookup) instead of a second parallel system.
//
// DECISION (2026-09-21, supersedes the original auto-apply-at-checkout
// design): the original flow minted the code lazily at checkout, scoped to
// one event, and relied on a localStorage pointer written by the browser
// that won the spin to find it again. That breaks the instant the
// participant checks out on a different device/browser/session than the
// one that spun the wheel -- which is common (spin on phone via an ad,
// buy on desktop later) and was reported as "rewards don't work at all"
// in testing. The code is now minted synchronously at spin time, emailed
// and shown on-screen immediately, and typed manually by the participant
// like any other promo code. No device-memory, no auth/account requirement.
//
// DECISION (Q-1): the generated code is deliberately left unscoped to any
// single event (no promotional_code_events row) -- it is valid on every
// event linked to the campaign, matching the multi-event campaign design.
// /api/promotions/validate already treats a code with zero linked events as
// valid everywhere (empty allowedEvents = no restriction).
//
// Q-2 still holds: this is the *only* redemption path; there is no
// standalone reward withdrawal outside a purchase.

type AdminClient = any

// FDR-0014 addendum (product-line discounts) §3.2/§6, corrected 2026-09-27:
// PRODUCT_DISCOUNT/PHOTO_DISCOUNT were first shipped as percent-only, but
// real usage proved that wrong -- a "-5€ sur pack photo" reward was
// silently read as 5%, applying 0,90€ off a 17,99€ pack instead of 5,00€.
// Split into 4 explicit types, mirroring TICKET_PERCENT_DISCOUNT /
// TICKET_FIXED_DISCOUNT, so the unit is never inferred from the reward
// type's name alone -- it IS the reward type. PRODUCT_DISCOUNT/
// PHOTO_DISCOUNT (unsuffixed) are no longer mintable going forward (the
// admin form stopped offering them, RewardFormDialog.tsx) but are kept out
// of DISCOUNT_REWARD_TYPES entirely here: a reward still saved under the
// old unsuffixed type must be re-edited to the correct *_PERCENT_/
// *_FIXED_ variant before it can mint a code again -- silently guessing
// its unit a second time is exactly the bug being fixed.
const PERCENT_DISCOUNT_REWARD_TYPES = new Set([
  'TICKET_PERCENT_DISCOUNT',
  'PRODUCT_PERCENT_DISCOUNT',
  'PHOTO_PERCENT_DISCOUNT',
])
const FIXED_DISCOUNT_REWARD_TYPES = new Set([
  'TICKET_FIXED_DISCOUNT',
  'PRODUCT_FIXED_DISCOUNT',
  'PHOTO_FIXED_DISCOUNT',
])

// FDR-0014 §7 always intended FREE_TICKET as "a 100%-off discount, capped
// at the ticket price" (see original file header decision) -- never
// actually wired into DISCOUNT_REWARD_TYPES, so it silently minted nothing
// since the mint path was introduced. FREE_PRODUCT/FREE_PHOTO_PACK had the
// same gap for the exact same reason, confirmed 2026-09-27 (a participant
// won a physical patch and got no code) -- product decision that day:
// these are always a 100%-off code on their target_upsell_id, exactly like
// PRODUCT_PERCENT_DISCOUNT/PHOTO_PERCENT_DISCOUNT but the percentage is
// fixed at 100 rather than admin-configured (public_value is ignored for
// these three types, the code is always fully free).
const FULLY_FREE_REWARD_TYPES = new Set(['FREE_TICKET', 'FREE_PRODUCT', 'FREE_PHOTO_PACK'])
const PRODUCT_SCOPED_FREE_REWARD_TYPES = new Set(['FREE_PRODUCT', 'FREE_PHOTO_PACK'])

const DISCOUNT_REWARD_TYPES = new Set([
  ...PERCENT_DISCOUNT_REWARD_TYPES,
  ...FIXED_DISCOUNT_REWARD_TYPES,
  ...FULLY_FREE_REWARD_TYPES,
])

export class AllocationNotFoundError extends Error {
  constructor(allocationId: string) {
    super(`ALLOCATION_NOT_FOUND: allocation ${allocationId} not found`)
    this.name = 'AllocationNotFoundError'
  }
}

export class AllocationExpiredError extends Error {
  constructor(allocationId: string) {
    super(`ALLOCATION_EXPIRED: allocation ${allocationId} has expired`)
    this.name = 'AllocationExpiredError'
  }
}

export class AllocationAlreadyRedeemedError extends Error {
  constructor(allocationId: string) {
    super(`ALLOCATION_ALREADY_REDEEMED: allocation ${allocationId} was already redeemed`)
    this.name = 'AllocationAlreadyRedeemedError'
  }
}

export class RewardNotRedeemableForDiscountError extends Error {
  constructor(rewardType: string) {
    super(`REWARD_NOT_DISCOUNT_TYPE: reward type ${rewardType} does not generate a checkout promo code`)
    this.name = 'RewardNotRedeemableForDiscountError'
  }
}

/**
 * Mints (or reuses) a dedicated, single-use, manually-enterable promo code
 * for a discount allocation (TICKET_PERCENT_DISCOUNT / TICKET_FIXED_DISCOUNT).
 * Called synchronously right after a winning spin -- not lazily at
 * checkout -- so the code exists and can be shown/emailed immediately,
 * independent of whichever device the participant later buys from.
 * Idempotent: a retry (e.g. the spin route's background email job re-reading
 * the allocation) reuses the code already minted rather than creating a
 * second promotional_codes row.
 */
export const mintLuckyWheelPromoCode = async ({
  admin,
  allocationId,
}: {
  admin: AdminClient
  allocationId: string
}): Promise<{ code: string; promotionalCodeId: string }> => {
  const { data: allocation, error: allocationError } = await admin
    .from('lucky_wheel_reward_allocations')
    .select(
      `id, redemption_code, redeemed_at, expires_at,
       reward:lucky_wheel_rewards(id, type, name, campaign_id, public_value, target_upsell_id)`,
    )
    .eq('id', allocationId)
    .maybeSingle()

  if (allocationError) throw allocationError
  if (!allocation) throw new AllocationNotFoundError(allocationId)

  if (allocation.redeemed_at) {
    throw new AllocationAlreadyRedeemedError(allocationId)
  }

  if (new Date(allocation.expires_at) < new Date()) {
    throw new AllocationExpiredError(allocationId)
  }

  const reward = Array.isArray(allocation.reward) ? allocation.reward[0] : allocation.reward
  if (!reward || !DISCOUNT_REWARD_TYPES.has(reward.type)) {
    throw new RewardNotRedeemableForDiscountError(reward?.type ?? 'unknown')
  }

  // Already minted (e.g. called twice) -- reuse it instead of a second code.
  // A code minted by this function always starts with LWHEEL-; the RPC's
  // own opaque token (base64, no fixed prefix) never collides with this
  // check, so a non-discount reward's token is never mistaken for one.
  if (allocation.redemption_code?.startsWith('LWHEEL-')) {
    const { data: existingCode, error: existingCodeError } = await admin
      .from('promotional_codes')
      .select('id, code')
      .eq('code', allocation.redemption_code)
      .maybeSingle()
    if (existingCodeError) throw existingCodeError
    if (existingCode) {
      return { code: existingCode.code, promotionalCodeId: existingCode.id }
    }
  }

  const code = `LWHEEL-${allocation.id.slice(0, 8).toUpperCase()}`
  const isFullyFree = FULLY_FREE_REWARD_TYPES.has(reward.type)
  const isPercent = isFullyFree || PERCENT_DISCOUNT_REWARD_TYPES.has(reward.type)

  const { data: promotionalCode, error: insertError } = await admin
    .from('promotional_codes')
    .insert({
      code,
      name: `Lucky Wheel — ${reward.name}`,
      description: 'Récompense Lucky Wheel, code à usage unique.',
      // FREE_TICKET/FREE_PRODUCT/FREE_PHOTO_PACK are always 100% off,
      // regardless of whatever public_value the reward happens to carry --
      // there is no "how much free" to configure, only "free or not".
      discount_percent: isPercent ? (isFullyFree ? 100 : Math.min(100, Math.max(0, reward.public_value ?? 0))) : null,
      discount_amount: isPercent ? null : Math.max(0, reward.public_value ?? 0),
      currency: 'eur',
      valid_from: new Date().toISOString(),
      valid_until: allocation.expires_at,
      usage_limit: 1,
      is_active: true,
      // FDR-0014 addendum §3.2: carries the reward's configured target
      // upsell straight through to the minted code -- null for
      // TICKET_PERCENT_DISCOUNT/TICKET_FIXED_DISCOUNT/FREE_TICKET
      // (ticket-scoped, nothing to target), set for
      // PRODUCT_*_DISCOUNT/PHOTO_*_DISCOUNT/FREE_PRODUCT/FREE_PHOTO_PACK.
      target_upsell_id: reward.target_upsell_id ?? null,
      // No promotional_code_events row is inserted -- deliberately
      // unscoped so the code is valid on every event linked to the
      // campaign (Q-1), see file header decision. Same for
      // target_upsell_id: no event-scoping needed here, the "is this
      // upsell even sold on the event being purchased" check happens at
      // /api/promotions/validate time (FDR-0014 addendum §6), not at mint
      // time -- a campaign event where the upsell isn't sold rejects the
      // code explicitly there, rather than never letting the code exist.
    })
    .select('id, code')
    .single()

  if (insertError) throw insertError

  // Overwrite the RPC's opaque token with the real, human-typeable code --
  // this column is the lookup key markLuckyWheelAllocationRedeemed uses at
  // order-confirmation time, so it must hold the code that was actually
  // entered/validated at checkout.
  const { error: updateAllocationError } = await admin
    .from('lucky_wheel_reward_allocations')
    .update({ redemption_code: promotionalCode.code })
    .eq('id', allocationId)
  if (updateAllocationError) throw updateAllocationError

  return { code: promotionalCode.code, promotionalCodeId: promotionalCode.id }
}

/**
 * Marks an allocation as redeemed once its order is confirmed (called from
 * the Stripe webhook, mirroring the existing increment_promo_code_usage
 * hook point). No-op if promotionalCodeId doesn't match any Lucky Wheel
 * allocation -- most orders don't involve one.
 */
export const markLuckyWheelAllocationRedeemed = async ({
  admin,
  promotionalCodeId,
  orderId,
}: {
  admin: AdminClient
  promotionalCodeId: string
  orderId: string
}): Promise<void> => {
  const { data: promotionalCode, error: codeError } = await admin
    .from('promotional_codes')
    .select('code')
    .eq('id', promotionalCodeId)
    .maybeSingle()

  if (codeError) throw codeError
  if (!promotionalCode) return

  const { error: updateError } = await admin
    .from('lucky_wheel_reward_allocations')
    .update({ redeemed_at: new Date().toISOString(), order_id: orderId })
    .eq('redemption_code', promotionalCode.code)
    .is('redeemed_at', null)

  if (updateError) throw updateError
}
