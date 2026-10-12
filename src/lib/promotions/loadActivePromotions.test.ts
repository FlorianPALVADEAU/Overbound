import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))

import { loadActivePromotions } from './loadActivePromotions'

function mockQueryResult(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
  }
  supabaseAdminMock.mockReturnValue({ from: vi.fn(() => query) })
  return query
}

describe('loadActivePromotions', () => {
  beforeEach(() => {
    supabaseAdminMock.mockReset()
  })

  it('returns the active promotions running now', async () => {
    const promotion = { id: 'promo-1', type: 'banner', title: 'Palier 1' }
    const query = mockQueryResult({ data: [promotion], error: null })

    await expect(loadActivePromotions()).resolves.toEqual([promotion])
    expect(query.eq).toHaveBeenCalledWith('is_active', true)
    expect(query.lte).toHaveBeenCalledWith('starts_at', expect.any(String))
    expect(query.gte).toHaveBeenCalledWith('ends_at', expect.any(String))
  })

  it('returns an empty list when the table has no row', async () => {
    mockQueryResult({ data: null, error: null })

    await expect(loadActivePromotions()).resolves.toEqual([])
  })

  it('throws on a database error', async () => {
    const dbError = new Error('connection refused')
    mockQueryResult({ data: null, error: dbError })

    await expect(loadActivePromotions()).rejects.toBe(dbError)
  })
})
