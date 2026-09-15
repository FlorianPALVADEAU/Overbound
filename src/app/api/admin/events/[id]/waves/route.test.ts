import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/logging/adminRequestLogger', () => ({
  withRequestLogging: <T>(handler: T) => handler,
}))

import { GET } from './route'

function createAdmin({ wavesError = null }: { wavesError?: { message: string } | null } = {}) {
  const upsert = vi.fn(() => {
    throw new Error('GET must not initialize waves')
  })

  return {
    admin: {
      from(table: string) {
        if (table === 'events') {
          return {
            select() {
              return {
                eq() {
                  return {
                    single: async () => ({ data: { id: 'event-1', date: '2026-09-12T08:00:00.000Z' }, error: null }),
                  }
                },
              }
            },
          }
        }

        if (table === 'event_waves') {
          return {
            select() {
              return {
                eq() {
                  return {
                    order: async () => ({
                      data: wavesError ? null : [{
                        wave_index: 1,
                        start_time: '2026-09-12T10:00:00.000Z',
                        capacity: 50,
                        assigned_count: 2,
                        is_closed: false,
                      }],
                      error: wavesError,
                    }),
                  }
                },
              }
            },
            upsert,
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      },
    },
    upsert,
  }
}

describe('GET /api/admin/events/[id]/waves', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSupabaseServerMock.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'admin-1' } } }),
      },
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({ data: { role: 'admin' } }),
                }
              },
            }
          },
        }
      },
    })
  })

  it('returns existing waves without creating or updating rows', async () => {
    const { admin, upsert } = createAdmin()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await GET(
      new Request('http://localhost/api/admin/events/event-1/waves'),
      { params: Promise.resolve({ id: 'event-1' }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      waves: [expect.objectContaining({ wave_index: 1, assigned_count: 2 })],
    })
    expect(upsert).not.toHaveBeenCalled()
  })

  it('returns an error without creating waves when the read fails', async () => {
    const { admin, upsert } = createAdmin({ wavesError: { message: 'database unavailable' } })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await GET(
      new Request('http://localhost/api/admin/events/event-1/waves'),
      { params: Promise.resolve({ id: 'event-1' }) },
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Impossible de récupérer les SAS' })
    expect(upsert).not.toHaveBeenCalled()
  })
})
