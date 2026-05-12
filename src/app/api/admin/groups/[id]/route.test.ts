import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createSupabaseServerMock,
  supabaseAdminMock,
  syncOpenRegistrationsToWaveMock,
} = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  syncOpenRegistrationsToWaveMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/groups/syncOpenGroupWave', () => ({
  syncOpenRegistrationsToWave: syncOpenRegistrationsToWaveMock,
}))

vi.mock('@/app/api/admin/groups/promoGroupUtils', () => ({
  resolvePromoCode: vi.fn(),
  getUserIdsFromPromoRegistrations: vi.fn(),
}))

import { PATCH } from './route'

function createPatchAdmin() {
  const state = {
    groupsUpdatePayload: null as Record<string, unknown> | null,
  }

  const admin = {
    from(table: string) {
      if (table === 'event_waves') {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: async () => ({ data: { start_time: '2026-06-01T08:40:00.000Z' }, error: null }),
                    }
                  },
                }
              },
            }
          },
        }
      }

      if (table === 'groups') {
        return {
          update(payload: Record<string, unknown>) {
            state.groupsUpdatePayload = payload
            return {
              eq: async () => ({ error: null }),
            }
          },
        }
      }

      if (table === 'group_members') {
        return {
          select() {
            return {
              eq: async () => ({
                data: [{ profile_id: 'm1' }, { profile_id: 'm2' }],
                error: null,
              }),
            }
          },
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  }

  return { admin, state }
}

describe('PATCH /api/admin/groups/[id]', () => {
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
    syncOpenRegistrationsToWaveMock.mockResolvedValue({ moved: 2 })
  })

  it('updates anchor, records admin source and syncs all current members', async () => {
    const { admin, state } = createPatchAdmin()
    supabaseAdminMock.mockReturnValue(admin)

    const request = new Request('http://localhost/api/admin/groups/g1', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Team Updated',
        anchor_event_id: 'event-1',
        anchor_wave_index: 4,
      }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'g1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(state.groupsUpdatePayload).toMatchObject({
      name: 'Team Updated',
      anchor_event_id: 'event-1',
      anchor_wave_index: 4,
      anchor_start_time: '2026-06-01T08:40:00.000Z',
      anchor_initialized_by: 'admin_manual',
      anchor_initialized_from_profile_id: null,
    })
    expect(syncOpenRegistrationsToWaveMock).toHaveBeenCalledWith(expect.objectContaining({
      admin,
      eventId: 'event-1',
      waveIndex: 4,
      startTime: '2026-06-01T08:40:00.000Z',
      profileIds: ['m1', 'm2'],
    }))
    expect(body.members_moved_to_group_wave).toBe(2)
  })
})
