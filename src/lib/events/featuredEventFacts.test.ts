import { describe, expect, it } from 'vitest'
import { getFeaturedEventFacts } from './featuredEventFacts'

describe('getFeaturedEventFacts', () => {
  it('returns date, place and a "from" price label', () => {
    const facts = getFeaturedEventFacts({
      date: '2027-02-07T08:00:00Z',
      location: 'Saint-Quentin',
      tickets: [
        { id: 't1', final_price_cents: 4500, currency: 'eur' },
        { id: 't2', final_price_cents: 3000, currency: 'eur' },
      ] as never,
      price_tiers: [],
    })
    expect(facts.location).toBe('Saint-Quentin')
    expect(facts.dateLabel).toContain('2027')
    expect(facts.lowestPriceCents).toBe(3000)
    expect(facts.priceLabel).toMatch(/^Dès 30,00/)
  })

  it('has no price label when no ticket is priced', () => {
    const facts = getFeaturedEventFacts({ date: '2027-02-07T08:00:00Z', location: 'X', tickets: [] })
    expect(facts.lowestPriceCents).toBeNull()
    expect(facts.priceLabel).toBeNull()
  })
})
