import { FLEXIBLE_TICKET_FEE_CENTS } from '@/lib/tickets/flexibleTicket'
import type { OrderPricingInput, PricingParticipantInput, UpsellLineInput } from '../types'
import { toPricingPromo, toPricingTicket, toPricingTier, type PromoPriceRow, type TicketPriceRow, type TierRow } from '../mappers'

export interface PricingRows {
  tickets: TicketPriceRow[]
  tiers: TierRow[]
  tierRegistrationCounts: Record<string, number>
  upsells: Array<{ id: string; price_cents: number }>
  promos: PromoPriceRow[]
}

export interface PricingRequest {
  participants: PricingParticipantInput[]
  upsellLines: UpsellLineInput[]
  now: Date
}

/** Database rows plus the order request, as the pricing engine reads them. */
export const buildPricingInput = (rows: PricingRows, request: PricingRequest): OrderPricingInput => ({
  participants: request.participants,
  tickets: rows.tickets.map(toPricingTicket),
  tiers: rows.tiers.map(toPricingTier),
  tierRegistrationCounts: rows.tierRegistrationCounts,
  upsells: rows.upsells.map((upsell) => ({ id: upsell.id, priceCents: upsell.price_cents })),
  upsellLines: request.upsellLines,
  promos: rows.promos.map(toPricingPromo),
  flexibleFeeCents: FLEXIBLE_TICKET_FEE_CENTS,
  now: request.now,
})
