import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createSupabaseServerMock,
  supabaseAdminMock,
  resolveGroupAnchorFromProfileMock,
  syncOpenRegistrationsToWaveMock,
} = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  resolveGroupAnchorFromProfileMock: vi.fn(),
  syncOpenRegistrationsToWaveMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/groups/resolveGroupAnchor', () => ({
  resolveGroupAnchorFromProfile: resolveGroupAnchorFromProfileMock,
}))

vi.mock('@/lib/groups/syncOpenGroupWave', () => ({
  syncOpenRegistrationsToWave: syncOpenRegistrationsToWaveMock,
}))

import { POST } from './route'

function createJoinAdmin(anchorMissing: boolean) {
  const state = {
    groupUpdatePayload: null as Record<string, unknown> | null,
    insertedMember: null as Record<string, unknown> | null,
  }

  const group = anchorMissing
    ? { id: 'g1', name: 'Team', anchor_event_id: null, anchor_wave_index: null, anchor_start_time: null }
    : { id: 'g1', name: 'Team', anchor_event_id: 'event-1', anchor_wave_index: 2, anchor_start_time: '2026-06-01T08:00:00.000Z' }

  const admin = {
    from(table: string) {
      if (table === 'group_members') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: null }),
                }
              },
            }
          },
          insert(payload: Record<string, unknown>) {
            state.insertedMember = payload
            return Promise.resolve({ error: null })
          },
        }
      }

      if (table === 'groups') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: group, error: null }),
                }
              },
            }
          },
          update(payload: Record<string, unknown>) {
            state.groupUpdatePayload = payload
            return {
              eq: async () => ({ error: null }),
            }
          },
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  }

  return { admin, state }
}

describe('POST /api/groups/join', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSupabaseServerMock.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    })
    syncOpenRegistrationsToWaveMock.mockResolvedValue({ moved: 1 })
  })

  it('initializes missing anchor from joining member and syncs open registration', async () => {
    const { admin, state } = createJoinAdmin(true)
    supabaseAdminMock.mockReturnValue(admin)
    resolveGroupAnchorFromProfileMock.mockResolvedValue({
      eventId: 'event-1',
      waveIndex: 3,
      startTime: '2026-06-01T08:20:00.000Z',
    })

    const request = new Request('http://localhost/api/groups/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: 'abcd1234' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(state.insertedMember).toEqual({ group_id: 'g1', profile_id: 'user-1', role: 'member' })
    expect(resolveGroupAnchorFromProfileMock).toHaveBeenCalledWith(admin, 'user-1')
    expect(state.groupUpdatePayload).toMatchObject({
      anchor_event_id: 'event-1',
      anchor_wave_index: 3,
      anchor_start_time: '2026-06-01T08:20:00.000Z',
      anchor_initialized_by: 'member_join',
      anchor_initialized_from_profile_id: 'user-1',
    })
    expect(syncOpenRegistrationsToWaveMock).toHaveBeenCalledWith(expect.objectContaining({
      admin,
      eventId: 'event-1',
      waveIndex: 3,
      startTime: '2026-06-01T08:20:00.000Z',
      profileIds: ['user-1'],
    }))
    expect(body.wave_reassigned).toBe(true)
  })

  it('reuses existing anchor and skips anchor initialization lookup', async () => {
    const { admin, state } = createJoinAdmin(false)
    supabaseAdminMock.mockReturnValue(admin)

    const request = new Request('http://localhost/api/groups/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: 'ABCD1234' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(resolveGroupAnchorFromProfileMock).not.toHaveBeenCalled()
    expect(state.groupUpdatePayload).toBeNull()
    expect(syncOpenRegistrationsToWaveMock).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'event-1',
      waveIndex: 2,
      startTime: '2026-06-01T08:00:00.000Z',
      profileIds: ['user-1'],
    }))
  })
})
