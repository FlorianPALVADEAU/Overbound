import { describe, expect, it } from 'vitest'
import type { AdminAmbassadorPointsRow, AdminAmbassadorReward } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import { filterAmbassadorRows, filterRewards } from './ambassadorFilters'

const row = (name: string, code: string | null): AdminAmbassadorPointsRow => ({
  ambassador_id: name,
  profile_id: name,
  ambassador_name: name,
  ambassador_code: code,
  is_active: true,
  total_points: 0,
  recruits_open: 0,
  recruits_ranked: 0,
})

const reward = (id: string, name: string, status: AdminAmbassadorReward['status']): AdminAmbassadorReward => ({
  id,
  ambassador_id: name,
  ambassador_name: name,
  ambassador_code: 'CODE',
  profile_id: null,
  reward_level: 1,
  reward_name: 'T-shirt',
  status,
  program_year: 2027,
  earned_at: '2026-11-03T10:00:00.000Z',
  expires_at: null,
  claimed_at: null,
  fulfilled_at: null,
  cancelled_at: null,
  cancellation_reason: null,
})

describe('filterAmbassadorRows', () => {
  const rows = [row('Hélène Martin', 'HELENE10'), row('Paul Durand', null)]

  it('ignores accents and case, and searches the code', () => {
    expect(filterAmbassadorRows(rows, 'helene')).toHaveLength(1)
    expect(filterAmbassadorRows(rows, 'helene10')).toHaveLength(1)
  })

  it('returns everything for an empty search and nothing for a miss', () => {
    expect(filterAmbassadorRows(rows, '  ')).toHaveLength(2)
    expect(filterAmbassadorRows(rows, 'zzz')).toHaveLength(0)
  })
})

describe('filterRewards', () => {
  const rewards = [reward('1', 'Paul', 'earned'), reward('2', 'Paul', 'cancelled'), reward('3', 'Léa', 'earned')]

  it('combines the status and the search', () => {
    expect(filterRewards(rewards, '', 'earned').map((item) => item.id)).toEqual(['1', '3'])
    expect(filterRewards(rewards, 'paul', 'earned').map((item) => item.id)).toEqual(['1'])
    expect(filterRewards(rewards, 'lea', null).map((item) => item.id)).toEqual(['3'])
  })

  it('finds cancelled rewards when asked', () => {
    expect(filterRewards(rewards, '', 'cancelled').map((item) => item.id)).toEqual(['2'])
  })
})
