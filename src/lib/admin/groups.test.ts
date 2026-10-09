import { describe, expect, it } from 'vitest'
import { hydrateAdminGroups, memberRefundedAt } from './groups'

const GROUP_ID = '56e08f7d-24c3-44be-b123-4f034c669909'
const PROFILE_ID = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'

describe('hydrateAdminGroups', () => {
  it('hydrates members, captain source and global profile ids', () => {
    const result = hydrateAdminGroups(
      [{
        id: GROUP_ID,
        name: 'Les loups',
        captain_id: PROFILE_ID,
        invite_code: 'LOUPS',
        anchor_event_id: null,
        anchor_wave_index: null,
        anchor_start_time: null,
        anchor_initialized_by: 'creator',
        anchor_initialized_from_profile_id: PROFILE_ID,
        anchor_initialized_at: null,
        created_at: '2026-09-01T00:00:00Z',
      }],
      [{ id: 'member-1', group_id: GROUP_ID, profile_id: PROFILE_ID, role: 'captain', joined_at: '2026-09-01T00:00:00Z' }],
      [{ id: PROFILE_ID, full_name: 'Camille Martin' }],
      [{ id: PROFILE_ID, email: 'camille@example.com' }],
    )

    expect(result.memberProfileIds).toEqual([PROFILE_ID])
    expect(result.groups[0]).toMatchObject({
      anchor_initialized_from_profile_name: 'Camille Martin',
      members: [{ profile_id: PROFILE_ID, full_name: 'Camille Martin', email: 'camille@example.com' }],
    })
  })

  it('returns a safe empty result when optional source rows are absent', () => {
    expect(hydrateAdminGroups()).toEqual({ groups: [], memberProfileIds: [] })
  })
})

describe('memberRefundedAt', () => {
  const EVENT_ID = 'event-1'
  const row = (patch: Partial<{ user_id: string; event_id: string; cancelled_at: string | null }>) => ({
    user_id: PROFILE_ID,
    event_id: EVENT_ID,
    cancelled_at: null,
    ...patch,
  })

  it('returns the latest refund date when every bib on the anchor event was refunded', () => {
    const rows = [
      row({ cancelled_at: '2026-10-01T10:00:00Z' }),
      row({ cancelled_at: '2026-10-03T10:00:00Z' }),
      row({ event_id: 'other-event' }),
    ]
    expect(memberRefundedAt(rows, PROFILE_ID, EVENT_ID)).toBe('2026-10-03T10:00:00Z')
  })

  it('returns null while the member still holds an active bib', () => {
    const rows = [row({ cancelled_at: '2026-10-01T10:00:00Z' }), row({})]
    expect(memberRefundedAt(rows, PROFILE_ID, null)).toBeNull()
  })

  it('returns null for a member without any bib', () => {
    expect(memberRefundedAt([row({ user_id: 'someone-else', cancelled_at: '2026-10-01T10:00:00Z' })], PROFILE_ID, null)).toBeNull()
  })
})
