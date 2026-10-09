import type { GroupMember } from '@/types/Group'

export const memberDisplayName = (member: GroupMember) =>
  member.full_name || member.email?.split('@')[0] || 'Membre'

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Captain first, then the current user, then alphabetical: the people you look for come first in a long list. */
export const sortMembers = (members: GroupMember[], currentUserId: string): GroupMember[] => {
  const rank = (member: GroupMember) => (member.role === 'captain' ? 0 : member.profile_id === currentUserId ? 1 : 2)
  return [...members].sort(
    (a, b) => rank(a) - rank(b) || memberDisplayName(a).localeCompare(memberDisplayName(b), 'fr', { sensitivity: 'base' }),
  )
}

/** Accent- and case-insensitive match on the name or email. */
export const filterMembers = (members: GroupMember[], query: string): GroupMember[] => {
  const needle = normalize(query)
  if (!needle) return members
  return members.filter((member) => normalize(`${memberDisplayName(member)} ${member.email ?? ''}`).includes(needle))
}
