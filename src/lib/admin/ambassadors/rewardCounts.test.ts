import { describe, expect, it } from 'vitest'
import { countRewardsToHandle } from './rewardCounts'

describe('countRewardsToHandle', () => {
  it('counts earned rewards to claim and claimed rewards to fulfil, per ambassador', () => {
    const counts = countRewardsToHandle([
      { ambassador_id: 'a', status: 'earned' },
      { ambassador_id: 'a', status: 'earned' },
      { ambassador_id: 'a', status: 'claimed' },
      { ambassador_id: 'b', status: 'fulfilled' },
    ])
    expect(counts.get('a')).toEqual({ toClaim: 2, toFulfil: 1 })
    expect(counts.get('b')).toBeUndefined()
  })

  it('ignores cancelled and fulfilled rewards', () => {
    const counts = countRewardsToHandle([
      { ambassador_id: 'a', status: 'cancelled' },
      { ambassador_id: 'a', status: 'fulfilled' },
    ])
    expect(counts.size).toBe(0)
  })

  it('returns an empty map when nothing waits', () => {
    expect(countRewardsToHandle([]).size).toBe(0)
  })
})
