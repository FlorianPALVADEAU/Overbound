import { describe, expect, it } from 'vitest'
import { checkoutNudges } from './checkoutNudges'

describe('checkoutNudges', () => {
  it('invites to add a bib to reach the next group tier of a format already in the order', () => {
    expect(checkoutNudges({ formatCounts: { open: 1, ranked: 0 } })).toEqual([
      'Ajoute 1 billet OPEN : −10 % sur chacun des 2 billets OPEN.',
    ])
    expect(checkoutNudges({ formatCounts: { open: 3, ranked: 0 } })[0]).toContain('Ajoute 3 billets OPEN : −20 %')
  })

  it('counts each format apart', () => {
    expect(checkoutNudges({ formatCounts: { open: 2, ranked: 1 } })).toHaveLength(2)
  })

  it('says nothing at the top group tier or for a format not ordered', () => {
    expect(checkoutNudges({ formatCounts: { open: 6, ranked: 0 } })).toEqual([])
  })
})
