import type { Group } from '@/types/Group'

export const FAKE_MY_GROUP: Group = {
  id: 'fake-group-001',
  name: 'Entreprise XYZ',
  captain_id: 'fake-user-captain',
  invite_code: 'XYZ12345',
  anchor_event_id: 'fake-event-001',
  anchor_wave_index: 3,
  anchor_start_time: '2026-06-15T06:20:00.000Z', // 08:20 Paris
  created_at: '2026-04-01T10:00:00.000Z',
  members: [
    {
      id: 'fake-member-1',
      profile_id: 'fake-user-captain',
      role: 'captain',
      joined_at: '2026-04-01T10:00:00.000Z',
      full_name: 'Alice Martin',
      email: 'alice.martin@xyz.com',
    },
    {
      id: 'fake-member-2',
      profile_id: 'fake-user-2',
      role: 'member',
      joined_at: '2026-04-02T09:00:00.000Z',
      full_name: 'Bob Dupont',
      email: 'bob.dupont@xyz.com',
    },
    {
      id: 'fake-member-3',
      profile_id: 'fake-user-3',
      role: 'member',
      joined_at: '2026-04-03T14:30:00.000Z',
      full_name: null,
      email: 'charlie.leblanc@xyz.com',
    },
    {
      id: 'fake-member-4',
      profile_id: 'fake-user-4',
      role: 'member',
      joined_at: '2026-04-04T08:15:00.000Z',
      full_name: 'Diana Petit',
      email: 'diana@xyz.com',
    },
  ],
}

// Simulates "user is not in any group yet"
export const FAKE_NO_GROUP: null = null
