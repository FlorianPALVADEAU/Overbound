import type { PricingSummary } from '@/lib/orderPricing'
import type { UpsellSummaryItem } from '@/lib/upsells/summary'

/** One line of an order summary, ready to render. Amounts in cents. */
export interface OrderLine {
  key: string
  kind: 'ticket' | 'upsell' | 'flexible' | 'discount'
  label: string
  details: string[]
  amountCents: number
  /** Crossed-out price when a tier lowered it. */
  fullAmountCents?: number
}

export interface OrderLineNames {
  ticket: (ticketId: string) => string
  tier: (tierId: string) => string | null
  participant: (index: number) => string
  upsell: (upsellId: string) => string
}

const NAMES_SHOWN = 3

const listNames = (names: string[]) => {
  const hidden = names.length - NAMES_SHOWN
  return `${names.slice(0, NAMES_SHOWN).join(', ')}${hidden > 0 ? ` et ${hidden} autre${hidden > 1 ? 's' : ''}` : ''}`
}

const quantityLabel = (quantity: number, label: string) => (quantity > 1 ? `${quantity} × ${label}` : label)

const ticketLines = (summary: PricingSummary, names: OrderLineNames): OrderLine[] => {
  // Drafts saved before ticket lines were itemised only know the ticket total.
  if (!summary.ticketLines) {
    return summary.ticketTotal > 0
      ? [{ key: 'tickets', kind: 'ticket', label: 'Billets', details: [], amountCents: summary.ticketTotal }]
      : []
  }
  return summary.ticketLines.map((line) => {
    const tier = line.tierId ? names.tier(line.tierId) : null
    const people = line.participantIndexes.map(names.participant).filter((name) => name.length > 0)
    return {
      key: `ticket-${line.ticketId}-${line.tierId ?? 'none'}-${line.amountCents}`,
      kind: 'ticket',
      label: quantityLabel(line.quantity, names.ticket(line.ticketId)),
      details: [...(people.length > 0 ? [listNames(people)] : []), ...(tier ? [`Tarif ${tier}`] : [])],
      amountCents: line.amountCents,
      ...(line.fullPriceCents > line.amountCents ? { fullAmountCents: line.fullPriceCents } : {}),
    }
  })
}

const upsellLines = (items: readonly UpsellSummaryItem[]): OrderLine[] =>
  items.map((item) => ({
    key: `upsell-${item.id}`,
    kind: 'upsell',
    label: quantityLabel(item.quantity, item.label),
    details: item.details,
    amountCents: item.amount,
  }))

const flexibleLine = (summary: PricingSummary): OrderLine[] =>
  summary.flexibleTotal ? [{ key: 'flexible', kind: 'flexible', label: 'Billet flexible', details: [], amountCents: summary.flexibleTotal }] : []

const discountLines = (summary: PricingSummary, names: OrderLineNames): OrderLine[] => {
  const discounts = summary.discounts ?? []
  // Drafts saved before discounts were itemised only know the total.
  if (discounts.length === 0 && summary.discountAmount > 0) {
    return [{ key: 'discount', kind: 'discount', label: 'Réduction', details: [], amountCents: -summary.discountAmount }]
  }
  return discounts.map((discount) => ({
    key: `discount-${discount.code}`,
    kind: 'discount',
    label: `Code ${discount.code}`,
    details: discount.upsellId ? [`Sur ${names.upsell(discount.upsellId)}`] : [],
    amountCents: -discount.amountCents,
  }))
}

/**
 * Every line of an order, in reading order. The lines always add up to
 * `summary.totalDue`, because they all come from the same priced order.
 */
export const buildOrderLines = (
  summary: PricingSummary,
  upsellItems: readonly UpsellSummaryItem[],
  names: OrderLineNames,
): OrderLine[] => [
  ...ticketLines(summary, names),
  ...upsellLines(upsellItems),
  ...flexibleLine(summary),
  ...discountLines(summary, names),
]
