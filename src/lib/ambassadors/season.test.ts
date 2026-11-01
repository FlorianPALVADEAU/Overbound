import { describe, expect, it } from 'vitest'
import { loadCurrentSeason } from './season'

const adminReturning = (result: { data: unknown; error: unknown }) =>
  ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => result }) }) }),
  }) as never

describe('loadCurrentSeason', () => {
  it('returns the running season and its start', async () => {
    const admin = adminReturning({ data: { current_season: 2027, started_at: '2026-11-02T10:00:00Z', ends_at: '2027-12-31T22:59:59Z' }, error: null })
    expect(await loadCurrentSeason(admin)).toEqual({ season: 2027, startedAt: '2026-11-02T10:00:00Z', endsAt: '2027-12-31T22:59:59Z' })
  })

  it('has no end date until the team sets one', async () => {
    const admin = adminReturning({ data: { current_season: 2027, started_at: '2026-11-02T10:00:00Z', ends_at: null }, error: null })
    expect((await loadCurrentSeason(admin)).endsAt).toBeNull()
  })

  it('fails loudly when the migration is not applied', async () => {
    await expect(loadCurrentSeason(adminReturning({ data: null, error: null }))).rejects.toThrow(/apply the season migration/)
  })

  it('propagates a database error', async () => {
    const error = new Error('boom')
    await expect(loadCurrentSeason(adminReturning({ data: null, error }))).rejects.toBe(error)
  })
})
