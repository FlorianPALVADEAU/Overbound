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

import { GET, POST } from './route'

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

function createProvisioningAdmin(initialWaveIndexes: number[] = []) {
  const waveIndexes = [...initialWaveIndexes]
  const upsert = vi.fn(async (rows: Array<{ wave_index: number }>) => {
    for (const row of rows) {
      if (!waveIndexes.includes(row.wave_index)) {
        waveIndexes.push(row.wave_index)
      }
    }
    return { error: null }
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
                    single: async () => ({
                      data: { id: 'event-1', date: '2026-09-12T08:00:00.000Z' },
                      error: null,
                    }),
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
                eq: async () => ({
                  data: waveIndexes.map((wave_index) => ({ wave_index })),
                  error: null,
                }),
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

describe('POST /api/admin/events/[id]/waves', () => {
  it('explicitly provisions all OPEN waves once and verifies the resulting configuration', async () => {
    const { admin, upsert } = createProvisioningAdmin()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/admin/events/event-1/waves', { method: 'POST' }),
      { params: Promise.resolve({ id: 'event-1' }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      state: 'provisioned',
      created: true,
      wave_count: 24,
    })
    expect(upsert).toHaveBeenCalledOnce()
    expect(upsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ event_id: 'event-1', wave_index: 1 })]),
      { onConflict: 'event_id,wave_index', ignoreDuplicates: true },
    )
  })

  it('is an idempotent no-op for a complete configuration', async () => {
    const { admin, upsert } = createProvisioningAdmin(
      Array.from({ length: 24 }, (_, index) => index + 1),
    )
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/admin/events/event-1/waves', { method: 'POST' }),
      { params: Promise.resolve({ id: 'event-1' }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ state: 'provisioned', created: false })
    expect(upsert).not.toHaveBeenCalled()
  })

  it('refuses a partial configuration instead of silently repairing it', async () => {
    const { admin, upsert } = createProvisioningAdmin([1, 2, 3])
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost/api/admin/events/event-1/waves', { method: 'POST' }),
      { params: Promise.resolve({ id: 'event-1' }) },
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'Configuration SAS incomplète : aucune correction automatique n’a été appliquée.',
    })
    expect(upsert).not.toHaveBeenCalled()
  })

  it('rejects an authenticated user without admin permissions', async () => {
    createSupabaseServerMock.mockResolvedValueOnce({
      auth: {
        getUser: async () => ({ data: { user: { id: 'volunteer-1' } } }),
      },
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({ data: { role: 'volunteer' } }),
                }
              },
            }
          },
        }
      },
    })

    const response = await POST(
      new Request('http://localhost/api/admin/events/event-1/waves', { method: 'POST' }),
      { params: Promise.resolve({ id: 'event-1' }) },
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Accès refusé' })
  })
})
