import { describe, expect, it } from 'vitest'
import { buildQuantityOptions, groupTierHints, QUANTITY_DROPDOWN_MAX, quantityOption } from './quantityOptions'

const open = { unitCents: 5999, isOpenFormat: true, otherOpenCount: 0 }

describe('buildQuantityOptions', () => {
  it('lists 1 to the dropdown maximum', () => {
    const options = buildQuantityOptions(open)
    expect(options).toHaveLength(QUANTITY_DROPDOWN_MAX)
    expect(options.map((o) => o.quantity)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('applies the group tiers to OPEN prices', () => {
    const [one, two, three, , , six] = buildQuantityOptions(open)
    expect([one.percent, two.percent, three.percent, six.percent]).toEqual([0, 10, 15, 20])
    expect(two.unitCents).toBe(5399)
    expect(two.totalCents).toBe(2 * 5399)
  })

  it('gives RANKED no group discount', () => {
    const options = buildQuantityOptions({ unitCents: 6999, isOpenFormat: false, otherOpenCount: 5 })
    expect(options.every((o) => o.percent === 0 && o.unitCents === 6999)).toBe(true)
  })

  it('counts OPEN bibs of other tickets in the order', () => {
    expect(quantityOption({ ...open, otherOpenCount: 1 }, 1).percent).toBe(10)
  })
})

describe('groupTierHints', () => {
  it('describes the tiers in reading order', () => {
    expect(groupTierHints().map((h) => [h.label, h.percent])).toEqual([
      ['2', 10],
      ['3 à 5', 15],
      ['6 et +', 20],
    ])
  })
})
