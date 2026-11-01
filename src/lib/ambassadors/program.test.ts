import { describe, expect, it } from 'vitest'
import {
  buildProgramRules,
  getCurrentRewardLevel,
  getExtraTicketsEarned,
  getFirstBonusLevel,
  getNextExtraTicketPointsRequired,
  getNextReward,
  getRewardKind,
  pickEffectiveRows,
  resolvePaymentStatus,
  resolveRaceFormat,
  type ProgramRulesRow,
  type RewardLevelRow,
} from './program'

const level = (effective_year: number, reward_level: number, points_required: number, kind: RewardLevelRow['kind'] = 'perk'): RewardLevelRow => ({
  effective_year,
  reward_level,
  points_required,
  reward_name: `Palier ${reward_level}`,
  description: '',
  badge_label: `Badge ${reward_level}`,
  kind,
})

const LADDER = [level(2026, 1, 1, 'recognition'), level(2026, 2, 3), level(2026, 3, 10, 'bib')]
const RULES: ProgramRulesRow[] = [
  { effective_year: 2026, base_points: 30, interval_points: 3, reward_name: 'Dossard offert' },
  { effective_year: 2027, base_points: 30, interval_points: 5, reward_name: 'Dossard offert' },
]

describe('resolveRaceFormat', () => {
  it('reads ranked case-insensitively and defaults to open', () => {
    expect(resolveRaceFormat('RANKED')).toBe('ranked')
    expect(resolveRaceFormat('open')).toBe('open')
    expect(resolveRaceFormat(null)).toBe('open')
    expect(resolveRaceFormat('unknown')).toBe('open')
  })
})

describe('resolvePaymentStatus', () => {
  it('maps known statuses and falls back to pending', () => {
    expect(resolvePaymentStatus('PAID')).toBe('paid')
    expect(resolvePaymentStatus('refunded')).toBe('refunded')
    expect(resolvePaymentStatus('cancelled')).toBe('cancelled')
    expect(resolvePaymentStatus(undefined)).toBe('pending')
  })
})

describe('pickEffectiveRows', () => {
  it('uses the latest effective year not after the program year', () => {
    expect(pickEffectiveRows(RULES, 2026).map((r) => r.interval_points)).toEqual([3])
    expect(pickEffectiveRows(RULES, 2027).map((r) => r.interval_points)).toEqual([5])
    expect(pickEffectiveRows(RULES, 2031).map((r) => r.interval_points)).toEqual([5])
  })

  it('returns nothing for a year before every rule', () => {
    expect(pickEffectiveRows(RULES, 2025)).toEqual([])
  })
})

describe('buildProgramRules', () => {
  it('keeps the past year on its own rule when a new rule starts later', () => {
    expect(buildProgramRules(LADDER, RULES, 2026).bonus?.interval_points).toBe(3)
    expect(buildProgramRules(LADDER, RULES, 2027).bonus?.interval_points).toBe(5)
  })

  it('inherits the ladder of the latest earlier year and sorts it by threshold', () => {
    const rules = buildProgramRules([...LADDER].reverse(), RULES, 2027)
    expect(rules.levels.map((l) => l.points_required)).toEqual([1, 3, 10])
    expect(rules.levels[0]).not.toHaveProperty('effective_year')
  })

  it('has no bonus and no level before the first rule', () => {
    expect(buildProgramRules(LADDER, RULES, 2025)).toEqual({ levels: [], bonus: null })
  })
})

describe('reward ladder', () => {
  const { levels } = buildProgramRules(LADDER, RULES, 2026)

  it('returns the next reward and the remaining points', () => {
    expect(getNextReward(levels, 0)).toMatchObject({ reward_level: 1, points_remaining: 1 })
    expect(getNextReward(levels, 3)).toMatchObject({ reward_level: 3, points_remaining: 7 })
  })

  it('returns null once the ladder is complete', () => {
    expect(getNextReward(levels, 10)).toBeNull()
  })

  it('returns the highest unlocked level', () => {
    expect(getCurrentRewardLevel(levels, 0)).toBe(0)
    expect(getCurrentRewardLevel(levels, 3)).toBe(2)
    expect(getCurrentRewardLevel(levels, 99)).toBe(3)
  })

  it('numbers bonus rewards after the last level', () => {
    expect(getFirstBonusLevel(levels)).toBe(4)
    expect(getFirstBonusLevel([])).toBe(1)
  })

  it('treats a bonus level as a bib', () => {
    expect(getRewardKind(levels, 1)).toBe('recognition')
    expect(getRewardKind(levels, 12)).toBe('bib')
  })
})

describe('bonus rewards', () => {
  const every3 = { base_points: 30, interval_points: 3, reward_name: 'Dossard offert' }
  const every5 = { base_points: 30, interval_points: 5, reward_name: 'Dossard offert' }

  it('earns nothing up to the first interval above the base', () => {
    expect(getExtraTicketsEarned(every3, 30)).toBe(0)
    expect(getExtraTicketsEarned(every3, 32)).toBe(0)
    expect(getExtraTicketsEarned(every5, 34)).toBe(0)
  })

  it('earns one per interval', () => {
    expect(getExtraTicketsEarned(every3, 33)).toBe(1)
    expect(getExtraTicketsEarned(every3, 72)).toBe(14)
    expect(getExtraTicketsEarned(every5, 35)).toBe(1)
    expect(getExtraTicketsEarned(every5, 72)).toBe(8)
  })

  it('earns nothing without a rule', () => {
    expect(getExtraTicketsEarned(null, 100)).toBe(0)
  })

  it('gives the points needed for the next bonus', () => {
    expect(getNextExtraTicketPointsRequired(every5, 30)).toBe(35)
    expect(getNextExtraTicketPointsRequired(every5, 35)).toBe(40)
    expect(getNextExtraTicketPointsRequired(every3, 33)).toBe(36)
  })
})
