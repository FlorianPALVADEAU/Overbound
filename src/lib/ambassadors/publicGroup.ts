import type { SupabaseClient } from '@supabase/supabase-js'

type Admin = Pick<SupabaseClient, 'from'>

export interface PublicGroup {
  name: string
  invite_code: string
}

/**
 * Group each profile captains (a profile belongs to at most one group), keyed by profile id.
 * A member who is not the captain is absent: the invite code is the captain's to publish, not a member's.
 */
export async function loadGroupsByProfile(admin: Admin, profileIds: string[]): Promise<Map<string, PublicGroup>> {
  const result = new Map<string, PublicGroup>()
  if (profileIds.length === 0) return result

  const members = await admin.from('group_members').select('profile_id, group_id').in('profile_id', profileIds)
  if (members.error) throw new Error(`[public group] members: ${members.error.message}`)
  const memberRows = (members.data ?? []) as { profile_id: string; group_id: string }[]
  if (memberRows.length === 0) return result

  const groups = await admin.from('groups').select('id, name, invite_code, captain_id').in('id', [...new Set(memberRows.map((row) => row.group_id))])
  if (groups.error) throw new Error(`[public group] groups: ${groups.error.message}`)
  const groupById = new Map((groups.data as { id: string; name: string; invite_code: string; captain_id: string | null }[]).map((row) => [row.id, row]))

  for (const member of memberRows) {
    const group = groupById.get(member.group_id)
    if (group && group.captain_id === member.profile_id) result.set(member.profile_id, { name: group.name, invite_code: group.invite_code })
  }
  return result
}
