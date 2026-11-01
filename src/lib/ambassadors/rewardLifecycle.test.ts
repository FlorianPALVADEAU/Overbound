import { describe, expect, it } from 'vitest'
import { isAmbassadorRewardExpired } from './rewardLifecycle'

describe('isAmbassadorRewardExpired', () => {
  it('never expires a reward without a date', () => {
    expect(isAmbassadorRewardExpired(null)).toBe(false)
    expect(isAmbassadorRewardExpired(undefined)).toBe(false)
  })

  it('still reads a legacy date', () => {
    expect(isAmbassadorRewardExpired('2026-12-31T22:59:59.000Z', new Date('2026-12-31T23:00:00.000Z'))).toBe(true)
    expect(isAmbassadorRewardExpired('2026-12-31T22:59:59.000Z', new Date('2026-12-31T22:00:00.000Z'))).toBe(false)
  })
})
