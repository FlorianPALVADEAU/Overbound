export type GroupRole = 'captain' | 'member'

export interface GroupMember {
  id: string
  profile_id: string
  role: GroupRole
  joined_at: string
  full_name: string | null
  email: string | null
}

export interface Group {
  id: string
  name: string
  captain_id: string
  invite_code: string
  anchor_event_id: string | null
  anchor_wave_index: number | null
  anchor_start_time: string | null
  created_at: string
  members: GroupMember[]
}
