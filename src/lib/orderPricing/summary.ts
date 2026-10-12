import type { OrderPricing, PricedParticipant } from './types'

/** Bibs bought on the same ticket at the same price, shown as one line. */
export interface PricingSummaryTicketLine {
  ticketId: string
  tierId: string | null
  quantity: number
  /** Positions of these bibs in the order, to name their participants. */
  participantIndexes: number[]
  amountCents: number
  /** Price before the tier discount; equal to `amountCents` without a tier. */
  fullPriceCents: number
}

export interface PricingSummaryDiscount {
  code: string
  amountCents: number
  /** Null when the code discounts tickets. */
  upsellId: string | null
}

/** What the checkout shows and stores in the draft: totals of one priced order. */
export interface PricingSummary {
  ticketTotal: number
  /** Absent in drafts saved before ticket lines were itemised. */
  ticketLines?: PricingSummaryTicketLine[]
  upsellTotal: number
  /** Absent in drafts saved before the flexible option existed. */
  flexibleTotal?: number
  discountAmount: number
  /** Absent in drafts saved before discounts were itemised. */
  discounts?: PricingSummaryDiscount[]
  totalDue: number
  currency: string
}

export const groupTicketLines = (participants: readonly PricedParticipant[]): PricingSummaryTicketLine[] => {
  const lines = new Map<string, PricingSummaryTicketLine>()
  participants.forEach((participant, index) => {
    const key = `${participant.ticketId}|${participant.tierId ?? ''}|${participant.unitPriceCents}`
    const line = lines.get(key) ?? {
      ticketId: participant.ticketId,
      tierId: participant.tierId,
      quantity: 0,
      participantIndexes: [],
      amountCents: 0,
      fullPriceCents: 0,
    }
    line.quantity += 1
    line.participantIndexes.push(index)
    line.amountCents += participant.unitPriceCents
    line.fullPriceCents += participant.basePriceCents
    lines.set(key, line)
  })
  return [...lines.values()]
}

export const toPricingSummary = (pricing: OrderPricing, currency: string): PricingSummary => ({
  ticketTotal: pricing.ticketSubtotal,
  ticketLines: groupTicketLines(pricing.participants),
  upsellTotal: pricing.upsellSubtotal,
  flexibleTotal: pricing.flexibleTotal,
  discountAmount: pricing.discountAmount,
  discounts: pricing.discounts.map((discount) => ({
    code: discount.code,
    amountCents: discount.amountCents,
    upsellId: discount.target.kind === 'upsell' ? discount.target.upsellId : null,
  })),
  totalDue: pricing.totalDue,
  currency,
})

export const emptyPricingSummary = (currency: string): PricingSummary => ({
  ticketTotal: 0,
  ticketLines: [],
  upsellTotal: 0,
  flexibleTotal: 0,
  discountAmount: 0,
  discounts: [],
  totalDue: 0,
  currency,
})
