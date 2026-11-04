import { describe, expect, it } from 'vitest'
import type { AdminAmbassadorRow } from '@/lib/admin/ambassadors/types'
import { filterAmbassadorRows, isAmbassadorHandling } from './ambassadorFilters'

const row = (name: string, code: string | null, overrides: Partial<AdminAmbassadorRow> = {}): AdminAmbassadorRow => ({
  ambassador_id: name,
  profile_id: name,
  ambassador_name: name,
  ambassador_code: code,
  is_active: true,
  total_points: 0,
  recruits_open: 0,
  recruits_ranked: 0,
  rewards_to_claim: 0,
  rewards_to_fulfil: 0,
  ...overrides,
})

const rows = [
  row('Hélène Martin', 'HELENE10', { rewards_to_fulfil: 1 }),
  row('Paul Durand', null, { rewards_to_claim: 2 }),
  row('Léa Roux', 'LEA', { is_active: false }),
]

describe('filterAmbassadorRows', () => {
  it('ignores accents and case, and searches the promo code', () => {
    expect(filterAmbassadorRows(rows, 'helene', 'all')).toHaveLength(1)
    expect(filterAmbassadorRows(rows, 'helene10', 'all')).toHaveLength(1)
  })

  it('returns everything for an empty search and nothing for a miss', () => {
    expect(filterAmbassadorRows(rows, '  ', 'all')).toHaveLength(3)
    expect(filterAmbassadorRows(rows, 'zzz', 'all')).toHaveLength(0)
  })

  it('keeps only the ambassadors with rewards to send', () => {
    expect(filterAmbassadorRows(rows, '', 'to_fulfil').map((item) => item.ambassador_name)).toEqual(['Hélène Martin'])
  })

  it('keeps only the ambassadors with rewards to claim', () => {
    expect(filterAmbassadorRows(rows, '', 'to_claim').map((item) => item.ambassador_name)).toEqual(['Paul Durand'])
  })

  it('keeps only the inactive accounts, and combines with the search', () => {
    expect(filterAmbassadorRows(rows, '', 'inactive').map((item) => item.ambassador_name)).toEqual(['Léa Roux'])
    expect(filterAmbassadorRows(rows, 'paul', 'inactive')).toHaveLength(0)
  })
})

describe('isAmbassadorHandling', () => {
  it('accepts the known filters only', () => {
    expect(isAmbassadorHandling('to_fulfil')).toBe(true)
    expect(isAmbassadorHandling('all')).toBe(true)
    expect(isAmbassadorHandling('unknown')).toBe(false)
  })
})
