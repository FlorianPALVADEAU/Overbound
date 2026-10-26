/**
 * Contract of the order pricing engine. Everything here is plain data: the
 * engine never reads a database, never calls Stripe and never touches React,
 * so the browser preview and the amount charged come from the same code.
 * All amounts are integer cents.
 */

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const fail = <E>(error: E): Result<never, E> => ({ ok: false, error })

export interface PricingTicket {
  id: string
  name: string
  /** Full price, before any tier. Null or 0 means the ticket has no price yet. */
  finalPriceCents: number | null
  /** Resolved by the caller with `isOpenFormatTicket`, never guessed here. */
  isOpenFormat: boolean
}

export interface PricingTier {
  id: string
  discountPercentage: number
  availableFrom: string | null
  availableUntil: string | null
  displayOrder: number | null
  maxRegistrations: number | null
}

export interface PricingUpsell {
  id: string
  priceCents: number
}

export interface PricingPromo {
  code: string
  discountPercent: number | null
  discountAmountCents: number | null
  /** Set: the code discounts this upsell only. Null: the code discounts tickets. */
  targetUpsellId: string | null
  isAmbassador: boolean
}

export interface PricingParticipantInput {
  ticketId: string
  flexible: boolean
}

export interface UpsellLineInput {
  upsellId: string
  quantity: number
}

export interface OrderPricingInput {
  participants: PricingParticipantInput[]
  tickets: PricingTicket[]
  tiers: PricingTier[]
  /** Active registrations already counted on each tier, by tier id. */
  tierRegistrationCounts: Record<string, number>
  upsells: PricingUpsell[]
  upsellLines: UpsellLineInput[]
  promos: PricingPromo[]
  flexibleFeeCents: number
  now: Date
}

export interface PricedParticipant {
  ticketId: string
  tierId: string | null
  /** Full ticket price, before tier. */
  basePriceCents: number
  /** Ticket price with the tier applied, before promo codes. */
  unitPriceCents: number
  /** What this bib really costs once ticket promo codes are spread over the order. */
  paidPriceCents: number
  flexible: boolean
}

export type DiscountTarget = { kind: 'tickets' } | { kind: 'upsell'; upsellId: string }

export interface AppliedDiscount {
  code: string
  target: DiscountTarget
  amountCents: number
  isAmbassador: boolean
}

export type PromoRejectionReason =
  | 'TOO_MANY_CODES'
  | 'DUPLICATE_CODE'
  | 'ONE_AMBASSADOR_CODE'
  | 'ONE_TICKET_CODE'
  | 'ONE_PRODUCT_CODE'
  | 'OPEN_TICKET_CODE_WITHOUT_OPEN_TICKET'

export interface PromoRejection {
  code: string
  reason: PromoRejectionReason
}

export interface TierAllocation {
  tierId: string
  quantity: number
}

/** The group discount of an order (FDR-0019). It never adds to a code: the better of the two applies. */
export interface GroupDiscountResult {
  percent: number
  /** Worth of the discount on the order, applied or not. */
  amountCents: number
  /** False when a code gave more, or when the order has no group discount. */
  applied: boolean
}

export interface OrderPricing {
  participants: PricedParticipant[]
  tierAllocations: TierAllocation[]
  baseTicketSubtotal: number
  ticketSubtotal: number
  tierDiscountAmount: number
  groupDiscount: GroupDiscountResult
  upsellSubtotal: number
  upsellSubtotalsById: Record<string, number>
  flexibleTotal: number
  discounts: AppliedDiscount[]
  ticketDiscountAmount: number
  upsellDiscountAmount: number
  discountAmount: number
  totalDue: number
  /** Codes that were not applied, and why. The server refuses an order that has any. */
  rejections: PromoRejection[]
}

export type PricingError =
  | { kind: 'UNKNOWN_TICKET'; ticketId: string }
  | { kind: 'TICKET_PRICE_MISSING'; ticketId: string; ticketName: string }
  | { kind: 'TIERS_SOLD_OUT' }
