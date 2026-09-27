import { describe, expect, it } from 'vitest'
import { hydrateAdminGroups } from './groups'

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
