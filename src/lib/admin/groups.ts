export interface AdminGroupRow {
  id: string
  name: string
  captain_id: string
  invite_code: string
  anchor_event_id: string | null
  anchor_wave_index: number | null
  anchor_start_time: string | null
  anchor_initialized_by: 'creator' | 'member_join' | 'admin_manual' | null
  anchor_initialized_from_profile_id: string | null
  anchor_initialized_at: string | null
  created_at: string
}

export interface AdminGroupMemberRow {
  id: string
  group_id: string
  profile_id: string
  role: 'captain' | 'member'
  joined_at: string
}

export interface HydratedAdminGroup extends AdminGroupRow {
  anchor_initialized_from_profile_name: string | null
  members: Array<
    AdminGroupMemberRow & {
      full_name: string | null
      email: string | null
      avatar_url: string | null
    }
  >
}

export interface AdminAuthUserLike {
  id: string
  email?: string | null
}

export function hydrateAdminGroups(
  groupsRows: readonly AdminGroupRow[] = [],
  membersRows: readonly AdminGroupMemberRow[] = [],
  profilesRows: ReadonlyArray<{ id: string; full_name: string | null; avatar_url?: string | null }> = [],
  authUsers: readonly AdminAuthUserLike[] = [],
): { groups: HydratedAdminGroup[]; memberProfileIds: string[] } {
  const profileMap = new Map(profilesRows.map((profile) => [profile.id, profile.full_name ?? null]))
  const avatarMap = new Map(profilesRows.map((profile) => [profile.id, profile.avatar_url ?? null]))
  const emailMap = new Map(authUsers.map((user) => [user.id, user.email ?? null]))
  const membersByGroup = new Map<string, HydratedAdminGroup['members']>()

  for (const member of membersRows) {
    const groupMembers = membersByGroup.get(member.group_id) ?? []
    groupMembers.push({
      ...member,
      full_name: profileMap.get(member.profile_id) ?? null,
      email: emailMap.get(member.profile_id) ?? null,
      avatar_url: avatarMap.get(member.profile_id) ?? null,
    })
    membersByGroup.set(member.group_id, groupMembers)
  }

  const memberProfileIds = [...new Set(membersRows.map((member) => member.profile_id))]
  const groups = groupsRows.map((group) => ({
    ...group,
    anchor_initialized_from_profile_name: group.anchor_initialized_from_profile_id
      ? profileMap.get(group.anchor_initialized_from_profile_id) ?? null
      : null,
    members: membersByGroup.get(group.id) ?? [],
  }))

  return { groups, memberProfileIds }
}
