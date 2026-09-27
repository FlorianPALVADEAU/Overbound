import { describe, expect, it } from 'vitest'
import { canClaimAmbassadorReward, getCurrentProgramYear, isAmbassadorRewardExpired } from './rewardLifecycle'

describe('ambassador reward lifecycle', () => {
  it('expires rewards after the Paris program year closes', () => {
    expect(isAmbassadorRewardExpired('2026-12-31T22:59:59.000Z', new Date('2026-12-31T23:00:00.000Z'))).toBe(true)
    expect(canClaimAmbassadorReward('earned', '2026-12-31T22:59:59.000Z', new Date('2026-12-31T23:00:00.000Z'))).toBe(false)
  })

  it('expires a reward exactly at its expiration instant', () => {
    const expiresAt = '2026-12-31T22:59:59.000Z'
    expect(isAmbassadorRewardExpired(expiresAt, new Date(expiresAt))).toBe(true)
    expect(canClaimAmbassadorReward('earned', expiresAt, new Date(expiresAt))).toBe(false)
  })

  it('uses the Paris calendar year at the UTC year boundary', () => {
    expect(getCurrentProgramYear(new Date('2026-12-31T23:30:00.000Z'))).toBe(2027)
  })
})
