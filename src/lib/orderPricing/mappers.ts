import { isOpenFormatTicket } from '@/lib/openSas'
import type { PricingPromo, PricingTicket, PricingTier } from './types'

/** Database rows to pricing engine input. The only place that knows both shapes. */

export interface TicketPriceRow {
  id: string
  name: string
  final_price_cents: number | null
  race?: { name?: string | null } | null
}

export interface TierRow {
  id: string
  discount_percentage: number
  available_from: string | null
  available_until: string | null
  display_order?: number | null
  max_registrations?: number | null
}

export interface PromoPriceRow {
  code: string
  discount_percent: number | null
  discount_amount: number | null
  target_upsell_id?: string | null
  ambassadors?: unknown
}

export const hasAmbassadorLink = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value && typeof value === 'object')

export const toPricingTicket = (row: TicketPriceRow): PricingTicket => ({
  id: row.id,
  name: row.name,
  finalPriceCents: row.final_price_cents,
  isOpenFormat: isOpenFormatTicket(row.name, row.race?.name),
})

export const toPricingTier = (row: TierRow): PricingTier => ({
  id: row.id,
  discountPercentage: Number(row.discount_percentage) || 0,
  availableFrom: row.available_from,
  availableUntil: row.available_until,
  displayOrder: row.display_order ?? null,
  maxRegistrations: row.max_registrations ?? null,
})

export const toPricingPromo = (row: PromoPriceRow): PricingPromo => ({
  code: row.code,
  discountPercent: row.discount_percent,
  discountAmountCents: row.discount_amount,
  targetUpsellId: row.target_upsell_id ?? null,
  isAmbassador: hasAmbassadorLink(row.ambassadors),
})

/** A code already validated in the browser, as the checkout keeps it in state. */
export interface AppliedPromoLike {
  code: string
  discount_percent?: number | null
  discount_amount?: number | null
  target_upsell_id?: string | null
  is_ambassador?: boolean | null
}

export const appliedPromoToPricingPromo = (promo: AppliedPromoLike): PricingPromo => ({
  code: promo.code,
  discountPercent: promo.discount_percent ?? null,
  discountAmountCents: promo.discount_amount ?? null,
  targetUpsellId: promo.target_upsell_id ?? null,
  isAmbassador: promo.is_ambassador === true,
})
