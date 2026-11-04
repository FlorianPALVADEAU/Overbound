import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminMock, supabaseAdminMock, resolvePromoCodeMock, getUserIdsMock, anchorMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  resolvePromoCodeMock: vi.fn(),
  getUserIdsMock: vi.fn(),
  anchorMock: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/app/api/admin/groups/promoGroupUtils', () => ({
  resolvePromoCode: resolvePromoCodeMock,
  getUserIdsFromPromoRegistrations: getUserIdsMock,
}))
vi.mock('@/lib/groups/resolveGroupAnchor', () => ({ resolveGroupAnchorFromProfile: anchorMock }))

import { POST } from './route'

const CAPTAIN_ID = '11111111-1111-4111-8111-111111111111'
const MEMBER_ID = '22222222-2222-4222-8222-222222222222'

const request = (body: string) =>
  new Request('http://localhost/api/admin/groups/from-promocode', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })

const validBody = JSON.stringify({ name: 'Équipe', promotional_code: 'ACME', captain_profile_id: CAPTAIN_ID })

function buildAdmin({
  memberInsertError = null,
  rollbackError = null,
}: {
  memberInsertError?: { message: string } | null
  rollbackError?: { message: string } | null
}) {
  const groupInsert = vi.fn()
  const groupDeleteEq = vi.fn()
  const memberInsert = vi.fn()

  const admin = {
    from: vi.fn((table: string) => {
      if (table === 'groups') {
        return {
          insert: (payload: unknown) => {
            groupInsert(payload)
            return { select: () => ({ single: async () => ({ data: { id: 'group-1', invite_code: 'ABC12345' }, error: null }) }) }
          },
          delete: () => ({
            eq: (column: string, value: string) => {
              groupDeleteEq(column, value)
              return Promise.resolve({ error: rollbackError })
            },
          }),
        }
      }
      if (table === 'group_members') {
        return {
          select: () => ({ in: async () => ({ data: [], error: null }) }),
          insert: (payload: unknown) => {
            memberInsert(payload)
            return Promise.resolve({ error: memberInsertError })
          },
        }
      }
      throw new Error(`table inattendue: ${table}`)
    }),
  }

  supabaseAdminMock.mockReturnValue(admin)
  return { groupInsert, groupDeleteEq, memberInsert }
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
  resolvePromoCodeMock.mockResolvedValue({ id: 'promo-1', code: 'ACME' })
  getUserIdsMock.mockResolvedValue([CAPTAIN_ID, MEMBER_ID])
  anchorMock.mockResolvedValue(null)
})

describe('POST /api/admin/groups/from-promocode', () => {
  it('answers 400 and creates nothing when the body is not JSON', async () => {
    const response = await POST(request('{pas du json') as never)

    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('answers 400 when the captain id is missing', async () => {
    const response = await POST(request(JSON.stringify({ name: 'Équipe', promotional_code: 'ACME' })) as never)

    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('writes the captain anchor in the same insert as the group', async () => {
    anchorMock.mockResolvedValue({ eventId: 'event-1', waveIndex: 3, startTime: '2026-09-12T12:20:00+02:00' })
    const { groupInsert, memberInsert } = buildAdmin({})

    const response = await POST(request(validBody) as never)

    expect(response.status).toBe(201)
    expect(groupInsert).toHaveBeenCalledWith(expect.objectContaining({
      captain_id: CAPTAIN_ID,
      anchor_event_id: 'event-1',
      anchor_wave_index: 3,
      anchor_initialized_by: 'creator',
      anchor_initialized_from_profile_id: CAPTAIN_ID,
    }))
    expect(memberInsert).toHaveBeenCalledWith([
      { group_id: 'group-1', profile_id: CAPTAIN_ID, role: 'captain' },
      { group_id: 'group-1', profile_id: MEMBER_ID, role: 'member' },
    ])
    expect(await response.json()).toEqual({ id: 'group-1', invite_code: 'ABC12345', members_added: 2, members_skipped_already_in_group: 0 })
  })

  it('creates a group without anchor when the captain has no wave registration', async () => {
    const { groupInsert } = buildAdmin({})

    const response = await POST(request(validBody) as never)

    expect(response.status).toBe(201)
    expect(groupInsert.mock.calls[0][0]).not.toHaveProperty('anchor_wave_index')
  })

  it('deletes the group when the members insert fails', async () => {
    const { groupDeleteEq } = buildAdmin({ memberInsertError: { message: 'boom' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await POST(request(validBody) as never)

    expect(response.status).toBe(500)
    expect(groupDeleteEq).toHaveBeenCalledWith('id', 'group-1')
    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('orphan'), expect.anything())
    errorSpy.mockRestore()
  })

  it('reports an orphan group when the rollback itself fails', async () => {
    buildAdmin({ memberInsertError: { message: 'boom' }, rollbackError: { message: 'rollback refused' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await POST(request(validBody) as never)

    expect(response.status).toBe(500)
    expect(errorSpy).toHaveBeenCalledWith(
      '[admin groups from-promocode] rollback failed, orphan group',
      expect.objectContaining({ groupId: 'group-1' }),
    )
    errorSpy.mockRestore()
  })
})
