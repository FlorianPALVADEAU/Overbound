import type { PricingSummary, PricingSummaryDiscount } from '@/lib/orderPricing'
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
  /** Shown under the ticket it belongs to (an option taken by one of its participants). */
  nested?: boolean
}

export interface OrderLineNames {
  ticket: (ticketId: string) => string
  tier: (tierId: string) => string | null
  participant: (index: number) => string
  upsell: (upsellId: string) => string
  /** Ticket and name of the participant holding an option; absent when unknown. */
  assignee?: (participantId: string) => { ticketId: string; name: string } | null
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

const plainUpsellLine = (item: UpsellSummaryItem): OrderLine => ({
  key: `upsell-${item.id}`,
  kind: 'upsell',
  label: quantityLabel(item.quantity, item.label),
  details: item.details,
  amountCents: item.amount,
})

/** Options split by the ticket of whoever takes them; the rest stays as plain lines. */
const upsellLines = (items: readonly UpsellSummaryItem[], names: OrderLineNames) => {
  const byTicket = new Map<string, OrderLine[]>()
  const loose: OrderLine[] = []
  for (const item of items) {
    const assigned = item.assignments.reduce((total, assignment) => total + assignment.quantity, 0)
    const holders = names.assignee ? item.assignments.map((a) => ({ a, who: names.assignee?.(a.participantId) ?? null })) : []
    if (holders.length === 0 || assigned !== item.quantity || holders.some((holder) => !holder.who)) {
      loose.push(plainUpsellLine(item))
      continue
    }
    const perTicket = new Map<string, typeof holders>()
    for (const holder of holders) {
      const ticketId = holder.who?.ticketId ?? ''
      perTicket.set(ticketId, [...(perTicket.get(ticketId) ?? []), holder])
    }
    for (const [ticketId, group] of perTicket) {
      const quantity = group.reduce((total, holder) => total + holder.a.quantity, 0)
      const people = group
        .map(({ a, who }) => `${who?.name ?? ''}${a.size ? ` (${a.size})` : ''}`.trim())
        .filter((entry) => entry.length > 0)
      byTicket.set(ticketId, [
        ...(byTicket.get(ticketId) ?? []),
        {
          key: `upsell-${item.id}-${ticketId}`,
          kind: 'upsell',
          nested: true,
          label: quantityLabel(quantity, item.label),
          details: people.length > 0 ? [listNames(people)] : [],
          amountCents: item.unitCents * quantity,
        },
      ])
    }
  }
  return { byTicket, loose }
}

const flexibleLine = (summary: PricingSummary): OrderLine[] =>
  summary.flexibleTotal ? [{ key: 'flexible', kind: 'flexible', label: 'Billet flexible', details: [], amountCents: summary.flexibleTotal }] : []

const GROUP_BEATS_CODE = 'Non cumulable : la remise groupe est plus avantageuse'
const CODE_BEATS_GROUP = 'Non cumulable : plus avantageux que la remise groupe'

const discountLines = (summary: PricingSummary, names: OrderLineNames): OrderLine[] => {
  const discounts = summary.discounts ?? []
  // Drafts saved before discounts were itemised only know the total.
  if (discounts.length === 0 && summary.discountAmount > 0 && !summary.groupDiscount) {
    return [{ key: 'discount', kind: 'discount', label: 'Réduction', details: [], amountCents: -summary.discountAmount }]
  }
  const group = summary.groupDiscount
  const groupLine: OrderLine[] =
    group?.applied
      ? [{ key: 'group-discount', kind: 'discount', label: `Remise groupe −${group.percent} %`, details: [], amountCents: -group.amountCents }]
      : []
  const codeNote = (discount: PricingSummaryDiscount) => {
    if (discount.upsellId || !group || group.amountCents === 0) return []
    return [group.applied ? GROUP_BEATS_CODE : CODE_BEATS_GROUP]
  }
  return [
    ...groupLine,
    ...discounts.map((discount) => ({
      key: `discount-${discount.code}`,
      kind: 'discount' as const,
      label: `Code ${discount.code}`,
      details: [...(discount.upsellId ? [`Sur ${names.upsell(discount.upsellId)}`] : []), ...codeNote(discount)],
      amountCents: -discount.amountCents,
    })),
  ]
}

/**
 * Every line of an order, in reading order. The lines always add up to
 * `summary.totalDue`, because they all come from the same priced order.
 */
export const buildOrderLines = (
  summary: PricingSummary,
  upsellItems: readonly UpsellSummaryItem[],
  names: OrderLineNames,
): OrderLine[] => {
  const { byTicket, loose } = upsellLines(upsellItems, names)
  const tickets = ticketLines(summary, names)
  const placed = new Set<string>()
  const grouped = (summary.ticketLines ?? []).flatMap((line, index) => {
    const own = tickets[index]
    if (!own) return []
    if (placed.has(line.ticketId)) return [own]
    placed.add(line.ticketId)
    return [own, ...(byTicket.get(line.ticketId) ?? [])]
  })
  const orphans = [...byTicket].filter(([ticketId]) => !placed.has(ticketId)).flatMap(([, lines]) => lines.map((l) => ({ ...l, nested: false })))
  return [
    ...(summary.ticketLines ? grouped : tickets),
    ...orphans,
    ...loose,
    ...flexibleLine(summary),
    ...discountLines(summary, names),
  ]
}
