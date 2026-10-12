import { describe, expect, it } from 'vitest'
import { NOW, tier } from './testFixtures'
import { assignParticipantsToTiers, sellingTierId, sortTiers } from './tierAllocation'

describe('assignParticipantsToTiers', () => {
  it('leaves everyone at full price when no tier exists', () => {
    const result = assignParticipantsToTiers([], {}, 2, NOW)
    expect(result).toEqual({ ok: true, value: { allocations: [], tierIdByParticipant: [null, null] } })
  })

  it('leaves everyone at full price when no tier is on sale today', () => {
    const past = tier({ availableUntil: '2026-02-01T00:00:00Z' })
    const result = assignParticipantsToTiers([past], {}, 1, NOW)
    expect(result.ok && result.value.tierIdByParticipant).toEqual([null])
  })

  it('seats the whole order on the active tier when it has room', () => {
    const result = assignParticipantsToTiers([tier({ maxRegistrations: 10 })], { early: 3 }, 4, NOW)
    expect(result.ok && result.value.allocations).toEqual([{ tierId: 'early', quantity: 4 }])
  })

  it('spills the participants that do not fit onto the next tier', () => {
    const early = tier({ maxRegistrations: 10 })
    const late = tier({ id: 'late', displayOrder: 2, discountPercentage: 0 })
    const result = assignParticipantsToTiers([late, early], { early: 8 }, 3, NOW)
    expect(result.ok && result.value.tierIdByParticipant).toEqual(['early', 'early', 'late'])
  })

  it('refuses the order when every tier from the active one is full', () => {
    const result = assignParticipantsToTiers([tier({ maxRegistrations: 5 })], { early: 5 }, 1, NOW)
    expect(result).toEqual({ ok: false, error: { kind: 'TIERS_SOLD_OUT' } })
  })

  it('treats a date-only end as local midnight', () => {
    const endsToday = tier({ availableUntil: '2026-06-01' })
    const result = assignParticipantsToTiers([endsToday], {}, 1, new Date(2026, 5, 1, 9))
    expect(result.ok && result.value.tierIdByParticipant).toEqual([null])
  })
})

describe('sortTiers', () => {
  it('orders by display order, then by start date', () => {
    const a = tier({ id: 'a', displayOrder: 2 })
    const b = tier({ id: 'b', displayOrder: 1, availableFrom: '2026-03-01T00:00:00Z' })
    const c = tier({ id: 'c', displayOrder: 1, availableFrom: '2026-02-01T00:00:00Z' })
    expect(sortTiers([a, b, c]).map((item) => item.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('sellingTierId', () => {
  it('names the next tier once the active one is full', () => {
    const early = tier({ maxRegistrations: 2 })
    const late = tier({ id: 'late', displayOrder: 2 })
    expect(sellingTierId([early, late], { early: 2 }, NOW)).toBe('late')
  })

  it('is null when no tier is on sale', () => {
    expect(sellingTierId([], {}, NOW)).toBeNull()
  })
})
