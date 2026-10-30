import { GROUP_DISCOUNT_TIERS, groupDiscountPercent } from '@/lib/orderPricing/groupDiscount'
import { applyTierDiscount } from '@/lib/orderPricing/participantPricing'

/**
 * What the /entreprises page shows. The discount grid is read from the checkout engine
 * (FDR-0019) so the page can never promise a rate the checkout does not apply.
 * Display only: the amount charged always comes from the database prices and computeOrderPricing.
 */
export const B2B_REFERENCE_PRICES_CENTS = { open: 5999, ranked: 6999 } as const

export const B2B_ADD_ONS = {
  tshirtCents: 1200,
  photoPackPresaleCents: 1875,
  photoPackAfterEventCents: 2500,
} as const

export const formatEuros = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export interface DiscountRow {
  minTickets: number
  /** Null for the last row: no upper bound. */
  maxTickets: number | null
  percent: number
  openUnitCents: number
  rankedUnitCents: number
}

/** Rows by increasing quantity, from the first discounted quantity up. Every format gets the same percentage. */
export const buildDiscountLadder = (prices: { open: number; ranked: number } = B2B_REFERENCE_PRICES_CENTS): DiscountRow[] => {
  const ascending = [...GROUP_DISCOUNT_TIERS].sort((a, b) => a.minTickets - b.minTickets)
  return ascending.map((tier, index) => {
    const next = ascending[index + 1]
    return {
      minTickets: tier.minTickets,
      maxTickets: next ? next.minTickets - 1 : null,
      percent: tier.percent,
      openUnitCents: applyTierDiscount(prices.open, tier.percent),
      rankedUnitCents: applyTierDiscount(prices.ranked, tier.percent),
    }
  })
}

export const describeTicketRange = ({ minTickets, maxTickets }: Pick<DiscountRow, 'minTickets' | 'maxTickets'>) => {
  if (maxTickets === null) return `${minTickets} et plus`
  if (maxTickets === minTickets) return `${minTickets}`
  return `${minTickets} à ${maxTickets}`
}

export interface TeamQuote {
  tickets: number
  percent: number
  totalCents: number
  fullPriceCents: number
}

/** Total of an order of `tickets` identical bibs, with the group discount the checkout applies to it. */
export const quoteTeam = (tickets: number, baseUnitCents: number = B2B_REFERENCE_PRICES_CENTS.open): TeamQuote => {
  const percent = groupDiscountPercent(tickets)
  return {
    tickets,
    percent,
    totalCents: applyTierDiscount(baseUnitCents, percent) * tickets,
    fullPriceCents: baseUnitCents * tickets,
  }
}
