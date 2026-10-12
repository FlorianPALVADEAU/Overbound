import {
  appliedPromoToPricingPromo,
  toPricingTicket,
  toPricingTier,
  type AppliedPromoLike,
  type OrderPricingInput,
  type TicketPriceRow,
  type TierRow,
} from '@/lib/orderPricing'
import { FLEXIBLE_TICKET_FEE_CENTS } from '@/lib/tickets/flexibleTicket'

export interface CheckoutPricingState {
  /** One ticket id per bib, in participant order. */
  ticketSlots: string[]
  /** Participants filled so far; a slot without one yet is not flexible. */
  flexibleBySlot: boolean[]
  tickets: TicketPriceRow[]
  tiers: TierRow[]
  tierRegistrationCounts: Record<string, number>
  upsells: Array<{ id: string; price_cents: number }>
  selectedUpsells: Record<string, { quantity: number }>
  appliedPromos: AppliedPromoLike[]
  now: Date
}

/** The checkout state as the pricing engine reads it: the same input shape the payment API builds. */
export const buildCheckoutPricingInput = (state: CheckoutPricingState): OrderPricingInput => ({
  participants: state.ticketSlots.map((ticketId, index) => ({
    ticketId,
    flexible: state.flexibleBySlot[index] === true,
  })),
  tickets: state.tickets.map(toPricingTicket),
  tiers: state.tiers.map(toPricingTier),
  tierRegistrationCounts: state.tierRegistrationCounts,
  upsells: state.upsells.map((upsell) => ({ id: upsell.id, priceCents: upsell.price_cents })),
  upsellLines: Object.entries(state.selectedUpsells).map(([upsellId, selection]) => ({
    upsellId,
    quantity: selection.quantity,
  })),
  promos: state.appliedPromos.map(appliedPromoToPricingPromo),
  flexibleFeeCents: FLEXIBLE_TICKET_FEE_CENTS,
  now: state.now,
})
