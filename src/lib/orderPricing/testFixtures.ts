import type { OrderPricingInput, PricingPromo, PricingTicket, PricingTier } from './types'

/** Builders for pricing tests. Defaults describe a plain order: no tier, no code, no option. */

export const NOW = new Date('2026-06-01T12:00:00Z')

export const openTicket = (overrides: Partial<PricingTicket> = {}): PricingTicket => ({
  id: 'open',
  name: 'Ultra Arena OPEN',
  finalPriceCents: 5000,
  isOpenFormat: true,
  ...overrides,
})

export const rankedTicket = (overrides: Partial<PricingTicket> = {}): PricingTicket => ({
  id: 'ranked',
  name: 'Ultra Arena RANKED',
  finalPriceCents: 7000,
  isOpenFormat: false,
  ...overrides,
})

export const tier = (overrides: Partial<PricingTier> = {}): PricingTier => ({
  id: 'early',
  discountPercentage: 20,
  availableFrom: '2026-01-01T00:00:00Z',
  availableUntil: '2026-12-31T00:00:00Z',
  displayOrder: 1,
  maxRegistrations: null,
  ...overrides,
})

export const promo = (code: string, overrides: Partial<PricingPromo> = {}): PricingPromo => ({
  code,
  discountPercent: null,
  discountAmountCents: null,
  targetUpsellId: null,
  isAmbassador: false,
  ...overrides,
})

export const percentCode = (code: string, percent: number, overrides: Partial<PricingPromo> = {}) =>
  promo(code, { discountPercent: percent, ...overrides })

export const amountCode = (code: string, cents: number, overrides: Partial<PricingPromo> = {}) =>
  promo(code, { discountAmountCents: cents, ...overrides })

export const TSHIRT = { id: 'tshirt', priceCents: 2000 }
export const MEDAL = { id: 'medal', priceCents: 800 }
export const FLEXIBLE_FEE = 890

export const order = (overrides: Partial<OrderPricingInput> = {}): OrderPricingInput => ({
  participants: [{ ticketId: 'open', flexible: false }],
  tickets: [openTicket(), rankedTicket()],
  tiers: [],
  tierRegistrationCounts: {},
  upsells: [TSHIRT, MEDAL],
  upsellLines: [],
  promos: [],
  flexibleFeeCents: FLEXIBLE_FEE,
  now: NOW,
  ...overrides,
})

export const participantsOn = (...ticketIds: string[]) => ticketIds.map((ticketId) => ({ ticketId, flexible: false }))
