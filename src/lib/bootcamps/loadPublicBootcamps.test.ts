import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))

import { loadPublicBootcamps } from './loadPublicBootcamps'

function mockQuery(result: { data: unknown; error: unknown }) {
  const query = { select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue(result) }
  supabaseAdminMock.mockReturnValue({ from: vi.fn(() => query) })
}

describe('loadPublicBootcamps', () => {
  beforeEach(() => {
    supabaseAdminMock.mockReset()
  })

  it('flattens the registration count and marks nothing as registered', async () => {
    mockQuery({ data: [{ id: 'b1', title: 'Grip', bootcamp_registrations: [{ count: '7' }] }], error: null })

    await expect(loadPublicBootcamps()).resolves.toEqual([
      { id: 'b1', title: 'Grip', registration_count: 7, is_registered: false },
    ])
  })

  it('counts zero when the relation is empty', async () => {
    mockQuery({ data: [{ id: 'b1', bootcamp_registrations: [] }], error: null })

    await expect(loadPublicBootcamps()).resolves.toMatchObject([{ registration_count: 0 }])
  })

  it('throws on a database error', async () => {
    const dbError = new Error('connection refused')
    mockQuery({ data: null, error: dbError })

    await expect(loadPublicBootcamps()).rejects.toBe(dbError)
  })
})
