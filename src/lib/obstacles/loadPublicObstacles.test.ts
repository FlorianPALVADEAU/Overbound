import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, isVisibleMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  isVisibleMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/obstaclesVisibility', () => ({ isPublicObstacleVisible: isVisibleMock }))

import { loadPublicObstacles } from './loadPublicObstacles'

function mockSelect(result: { data: unknown; error: unknown }) {
  supabaseAdminMock.mockReturnValue({
    from: vi.fn(() => ({ select: vi.fn().mockResolvedValue(result) })),
  })
}

describe('loadPublicObstacles', () => {
  beforeEach(() => {
    supabaseAdminMock.mockReset()
    isVisibleMock.mockReset()
  })

  it('returns only the publicly visible obstacles', async () => {
    mockSelect({ data: [{ id: '1', name: 'Mur' }, { id: '2', name: 'Secret' }], error: null })
    isVisibleMock.mockImplementation((name: string) => name !== 'Secret')

    await expect(loadPublicObstacles()).resolves.toEqual([{ id: '1', name: 'Mur' }])
  })

  it('throws on a database error', async () => {
    const dbError = new Error('connection refused')
    mockSelect({ data: null, error: dbError })

    await expect(loadPublicObstacles()).rejects.toBe(dbError)
  })
})
