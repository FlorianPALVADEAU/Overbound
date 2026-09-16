import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, resolveRequestUserMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  resolveRequestUserMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
}))

vi.mock('@/lib/auth/resolveRequestUser', () => ({
  resolveRequestUser: resolveRequestUserMock,
}))

import { requireAdmin } from './requireAdmin'

function mockProfileRole(role: string | null) {
  createSupabaseServerMock.mockResolvedValue({
    from: (table: string) => {
      if (table !== 'profiles') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: role ? { role } : null, error: null }),
          }),
        }),
      }
    },
  })
}

describe('requireAdmin', () => {
  beforeEach(() => {
    createSupabaseServerMock.mockReset()
    resolveRequestUserMock.mockReset()
  })

  it('returns ok with user when authenticated and role is admin', async () => {
    resolveRequestUserMock.mockResolvedValue({ id: 'user-1' })
    mockProfileRole('admin')

    const result = await requireAdmin()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.user.id).toBe('user-1')
    }
  })

  it('returns 401 when no authenticated user', async () => {
    resolveRequestUserMock.mockResolvedValue(null)

    const result = await requireAdmin()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })

  it('returns 403 when authenticated but role is not admin', async () => {
    resolveRequestUserMock.mockResolvedValue({ id: 'user-2' })
    mockProfileRole('member')

    const result = await requireAdmin()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(403)
    }
  })

  it('returns 403 when profile row does not exist', async () => {
    resolveRequestUserMock.mockResolvedValue({ id: 'user-3' })
    mockProfileRole(null)

    const result = await requireAdmin()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(403)
    }
  })
})
