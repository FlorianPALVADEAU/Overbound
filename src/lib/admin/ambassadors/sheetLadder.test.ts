import { describe, expect, it } from 'vitest'
import type { AmbassadorProgramRules, AmbassadorRewardLevel } from '@/types/Ambassador'
import { buildAdminLadder, buildBonusSummary, type AdminSheetReward } from './sheetLadder'

const level = (reward_level: number, points_required: number, reward_name = `Palier ${reward_level}`): AmbassadorRewardLevel => ({
  reward_level,
  reward_name,
  points_required,
  description: '',
  badge_label: '',
  kind: 'perk',
})

const program: AmbassadorProgramRules = {
  levels: [level(1, 1), level(2, 3), level(3, 5)],
  bonus: { base_points: 30, interval_points: 5, reward_name: 'Dossard offert' },
}

const reward = (reward_level: number, status: AdminSheetReward['status'], overrides: Partial<AdminSheetReward> = {}): AdminSheetReward => ({
  id: `r${reward_level}`,
  reward_level,
  reward_name: `Palier ${reward_level}`,
  points_required: reward_level,
  status,
  program_year: 2027,
  earned_at: '2027-02-01T10:00:00.000Z',
  expires_at: null,
  claimed_at: null,
  fulfilled_at: null,
  cancellation_reason: null,
  is_expired: false,
  ...overrides,
})

describe('buildAdminLadder', () => {
  it('marks reached steps, the next step and the locked ones', () => {
    const { steps } = buildAdminLadder(program, 1, [])
    expect(steps.map((step) => step.state)).toEqual(['reached', 'next', 'locked'])
  })

  it('attaches the reward row of a step, and null when the step has none', () => {
    const { steps } = buildAdminLadder(program, 3, [reward(2, 'claimed')])
    expect(steps[0].reward).toBeNull()
    expect(steps[1].reward?.status).toBe('claimed')
  })

  it('keeps a cancelled reward attached to its reached step', () => {
    const { steps } = buildAdminLadder(program, 5, [reward(3, 'cancelled', { cancellation_reason: 'Remboursement' })])
    expect(steps[2].state).toBe('reached')
    expect(steps[2].reward).toMatchObject({ status: 'cancelled', cancellation_reason: 'Remboursement' })
  })

  it('lists the rewards numbered after the ladder as bonus rewards, in order', () => {
    const { bonusRewards } = buildAdminLadder(program, 40, [reward(5, 'earned'), reward(4, 'fulfilled'), reward(2, 'claimed')])
    expect(bonusRewards.map((item) => item.reward_level)).toEqual([4, 5])
  })

  it('has no next step once every level is reached', () => {
    const { steps } = buildAdminLadder(program, 10, [])
    expect(steps.every((step) => step.state === 'reached')).toBe(true)
  })
})

describe('buildBonusSummary', () => {
  it('returns null when the program has no bonus rule', () => {
    expect(buildBonusSummary(null, 40)).toBeNull()
  })

  it('counts the bonus bibs earned and the points left for the next one', () => {
    expect(buildBonusSummary(program.bonus, 34)).toEqual({ reward_name: 'Dossard offert', earned: 0, next_points_required: 35 })
    expect(buildBonusSummary(program.bonus, 40)).toEqual({ reward_name: 'Dossard offert', earned: 2, next_points_required: 45 })
  })
})
