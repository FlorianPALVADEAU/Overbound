import { describe, expect, it } from 'vitest'
import type { AmbassadorProgramRules, AmbassadorReward } from '@/types/Ambassador'
import { buildBonusSummary, buildGoal } from './goal'
import { buildLadder, getClaimableRewards } from './ladder'

const level = (reward_level: number, points_required: number, kind: 'bib' | 'discount' = 'bib') => ({
  reward_level,
  reward_name: `Palier ${reward_level}`,
  points_required,
  description: `Description ${reward_level}`,
  badge_label: `Badge ${reward_level}`,
  kind,
})

const program: AmbassadorProgramRules = {
  levels: [level(1, 1), level(2, 5), level(3, 10)],
  bonus: { base_points: 10, interval_points: 5, reward_name: 'Dossard offert' },
}

describe('buildGoal', () => {
  it('aims at the first level for a new ambassador and counts friends', () => {
    expect(buildGoal(program, 0)).toMatchObject({
      name: 'Palier 1',
      pointsRemaining: 1,
      progressPercent: 0,
      friendsNeeded: { open: 1, ranked: 1 },
      isBonus: false,
    })
  })

  it('measures progress inside the current step', () => {
    expect(buildGoal(program, 3)).toMatchObject({ name: 'Palier 2', pointsRemaining: 2, progressPercent: 50 })
  })

  it('turns remaining points into ranked friends, rounded up', () => {
    expect(buildGoal(program, 6)?.friendsNeeded).toEqual({ open: 4, ranked: 2 })
  })

  it('moves to the bonus bib once the ladder is done', () => {
    expect(buildGoal(program, 10)).toMatchObject({ name: 'Dossard offert', pointsRequired: 15, pointsRemaining: 5, isBonus: true })
    expect(buildGoal(program, 12)).toMatchObject({ pointsRequired: 15, pointsRemaining: 3, progressPercent: 40 })
  })

  it('has no goal at the end of a ladder without bonus rule', () => {
    expect(buildGoal({ ...program, bonus: null }, 10)).toBeNull()
  })
})

describe('buildBonusSummary', () => {
  it('counts earned bonus bibs and the next threshold', () => {
    expect(buildBonusSummary(program, 20)).toMatchObject({ earned: 2, nextAt: 25 })
  })

  it('is null without a bonus rule', () => {
    expect(buildBonusSummary({ ...program, bonus: null }, 20)).toBeNull()
  })
})

const reward = (reward_level: number, status: AmbassadorReward['status']): AmbassadorReward => ({
  id: `r${reward_level}`,
  reward_level,
  reward_name: `Palier ${reward_level}`,
  kind: 'bib',
  points_required: 1,
  status,
  program_year: 2027,
  earned_at: '2026-11-03T10:00:00Z',
  expires_at: null,
  claimed_at: null,
  fulfilled_at: null,
})

describe('buildLadder', () => {
  it('marks reached, next and locked steps and carries the reward status', () => {
    const steps = buildLadder(program, 5, [reward(1, 'fulfilled'), reward(2, 'earned')])
    expect(steps.map((step) => step.state)).toEqual(['reached', 'reached', 'next'])
    expect(steps.map((step) => step.rewardStatus)).toEqual(['fulfilled', 'earned', null])
  })

  it('locks everything after the next step', () => {
    expect(buildLadder(program, 0, []).map((step) => step.state)).toEqual(['next', 'locked', 'locked'])
  })
})

describe('expired rewards', () => {
  const ended = { ...reward(2, 'earned'), expires_at: '2027-12-31T22:59:59Z' }
  const after = new Date('2028-01-01T10:00:00Z')

  it('cannot be claimed once the season ended', () => {
    expect(getClaimableRewards([ended], after)).toEqual([])
    expect(getClaimableRewards([ended], new Date('2027-06-01T10:00:00Z'))).toHaveLength(1)
  })

  it('shows as expired on the ladder', () => {
    expect(buildLadder(program, 5, [ended], after)[1].rewardExpired).toBe(true)
    expect(buildLadder(program, 5, [ended], new Date('2027-06-01T10:00:00Z'))[1].rewardExpired).toBe(false)
  })
})

describe('getClaimableRewards', () => {
  it('keeps only earned rewards, lowest level first', () => {
    const claimable = getClaimableRewards([reward(3, 'earned'), reward(1, 'claimed'), reward(2, 'earned'), reward(4, 'cancelled')])
    expect(claimable.map((item) => item.reward_level)).toEqual([2, 3])
  })
})
