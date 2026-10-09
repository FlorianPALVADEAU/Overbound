/**
 * "Billet flexible": a fixed-price option, chosen per participant at checkout,
 * that lets the original buyer cancel that bib and get its ticket price back,
 * without any justification, until 7 days before the event. No condition is
 * tied to a random event, so this is a fare option, not an insurance contract.
 * The option fee itself and other options (t-shirt…) are never refunded.
 */
export const FLEXIBLE_TICKET_FEE_CENTS = 890
export const FLEXIBLE_REFUND_DEADLINE_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

export const getFlexibleRefundDeadline = (eventDateIso: string | null | undefined): Date | null => {
  if (!eventDateIso) return null
  const eventDate = new Date(eventDateIso)
  if (Number.isNaN(eventDate.getTime())) return null
  return new Date(eventDate.getTime() - FLEXIBLE_REFUND_DEADLINE_DAYS * DAY_MS)
}

/**
 * Splits the ticket-scoped discount of an order over its tickets, in proportion
 * to each ticket's price, so every bib knows what was really paid for it. The
 * parts always add up to the amount paid for the tickets.
 */
export const allocatePaidTicketPrices = (unitPrices: number[], ticketDiscountCents: number): number[] => {
  const subtotal = unitPrices.reduce((sum, price) => sum + price, 0)
  const discount = Math.min(Math.max(0, ticketDiscountCents), subtotal)
  if (subtotal === 0 || discount === 0) return [...unitPrices]

  const shares = unitPrices.map((price) => Math.floor((price * discount) / subtotal))
  let remainder = discount - shares.reduce((sum, share) => sum + share, 0)
  // Rounding leftovers go to the most expensive tickets first, never below zero.
  const order = unitPrices.map((price, index) => ({ price, index })).sort((a, b) => b.price - a.price)
  for (const { index } of order) {
    if (remainder === 0) break
    if (unitPrices[index]! - shares[index]! > 0) {
      shares[index]! += 1
      remainder -= 1
    }
  }
  return unitPrices.map((price, index) => price - shares[index]!)
}

/** Stripe metadata values are strings: index lists and price lists travel as CSV. */
export const serializeNumberList = (values: number[]) => values.join(',')

export const parseNumberList = (value: string | null | undefined): number[] =>
  (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map(Number)
    .filter((number) => Number.isInteger(number) && number >= 0)

export interface FlexibleRefundSubject {
  flexible_refund: boolean | null
  paid_ticket_cents: number | null
  cancelled_at: string | null
  checked_in: boolean | null
  user_id: string | null
  guarantor_user_id: string | null
  order_user_id: string | null
  event_date: string | null
}

export type FlexibleRefundBlock =
  | 'NOT_FLEXIBLE'
  | 'ALREADY_CANCELLED'
  | 'CHECKED_IN'
  | 'NOT_BUYER'
  | 'TRANSFERRED'
  | 'DEADLINE_PASSED'
  | 'NOTHING_PAID'

export type FlexibleRefundEligibility =
  | { eligible: true; amountCents: number; deadline: Date }
  | { eligible: false; reason: FlexibleRefundBlock }

export const FLEXIBLE_REFUND_MESSAGES: Record<FlexibleRefundBlock, string> = {
  NOT_FLEXIBLE: 'Ce billet n’a pas l’option billet flexible.',
  ALREADY_CANCELLED: 'Ce billet est déjà annulé.',
  CHECKED_IN: 'Ce billet a déjà été validé.',
  NOT_BUYER: 'Seule la personne qui a acheté ce billet peut l’annuler.',
  TRANSFERRED: 'Un billet transféré n’est plus remboursable.',
  DEADLINE_PASSED: 'Le délai d’annulation (7 jours avant l’événement) est dépassé.',
  NOTHING_PAID: 'Aucun montant à rembourser pour ce billet.',
}

/** Who may cancel a flexible bib, and for how much. The original buyer only, while they still hold it. */
export const getFlexibleRefundEligibility = (
  subject: FlexibleRefundSubject,
  userId: string,
  now: Date,
): FlexibleRefundEligibility => {
  if (!subject.flexible_refund) return { eligible: false, reason: 'NOT_FLEXIBLE' }
  if (subject.cancelled_at) return { eligible: false, reason: 'ALREADY_CANCELLED' }
  if (subject.checked_in) return { eligible: false, reason: 'CHECKED_IN' }
  if (subject.guarantor_user_id) return { eligible: false, reason: 'TRANSFERRED' }
  if (subject.order_user_id !== userId || subject.user_id !== userId) return { eligible: false, reason: 'NOT_BUYER' }
  const deadline = getFlexibleRefundDeadline(subject.event_date)
  if (!deadline || now.getTime() > deadline.getTime()) return { eligible: false, reason: 'DEADLINE_PASSED' }
  if (!subject.paid_ticket_cents || subject.paid_ticket_cents <= 0) return { eligible: false, reason: 'NOTHING_PAID' }
  return { eligible: true, amountCents: subject.paid_ticket_cents, deadline }
}
