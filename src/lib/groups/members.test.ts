import { describe, expect, it } from 'vitest'
import type { GroupMember } from '@/types/Group'
import { filterMembers, memberDisplayName, sortMembers } from './members'

const member = (id: string, full_name: string | null, role: 'captain' | 'member' = 'member', email: string | null = null): GroupMember => ({
  id,
  profile_id: `p-${id}`,
  role,
  joined_at: '2026-01-01T00:00:00Z',
  full_name,
  email,
})

const members = [member('1', 'Zoé Martin'), member('2', 'Éloïse Durand', 'captain'), member('3', 'Alice Bernard'), member('4', null, 'member', 'sam.leroy@x.com')]

describe('sortMembers', () => {
  it('puts the captain first, then the current user, then alphabetical order', () => {
    expect(sortMembers(members, 'p-1').map((m) => m.id)).toEqual(['2', '1', '3', '4'])
  })

  it('does not mutate its input', () => {
    const before = members.map((m) => m.id)
    sortMembers(members, 'p-3')
    expect(members.map((m) => m.id)).toEqual(before)
  })
})

describe('filterMembers', () => {
  it('ignores case and accents, and also searches the email', () => {
    expect(filterMembers(members, 'eloise').map((m) => m.id)).toEqual(['2'])
    expect(filterMembers(members, 'LEROY').map((m) => m.id)).toEqual(['4'])
  })

  it('returns everyone for an empty query and nobody for no match', () => {
    expect(filterMembers(members, '  ')).toHaveLength(4)
    expect(filterMembers(members, 'xyz')).toEqual([])
  })
})

describe('memberDisplayName', () => {
  it('falls back to the email local part, then a generic label', () => {
    expect(memberDisplayName(members[3]!)).toBe('sam.leroy')
    expect(memberDisplayName(member('9', null))).toBe('Membre')
  })
})
