import { describe, expect, it } from 'vitest'
import { ADMIN_NAV_GROUPS, ADMIN_NAV_ITEMS, resolveActiveNavValue } from './adminNavItems'

const EVENT = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'
const item = (value: string) => ADMIN_NAV_ITEMS.find((candidate) => candidate.value === value)!

describe('admin navigation', () => {
  it('lists every page once, in exactly one sidebar group (the overview stands alone)', () => {
    const grouped = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((entry) => entry.value))
    expect(new Set(grouped).size).toBe(grouped.length)
    const outside = ADMIN_NAV_ITEMS.filter((entry) => !grouped.includes(entry.value)).map((entry) => entry.value)
    expect(outside).toEqual(['overview'])
  })

  it('replaces the old global members page with event participants', () => {
    expect(ADMIN_NAV_ITEMS.find((entry) => entry.value === 'members')).toBeUndefined()
    expect(item('participants')).toMatchObject({ href: '/dashboard/participants' })
  })

  it('keeps groups and bootcamps as separate admin domains', () => {
    expect(item('groups')).toMatchObject({ label: 'Groupes', href: '/dashboard/groups' })
    expect(item('bootcamps')).toMatchObject({ label: 'Bootcamps', href: '/dashboard/bootcamps' })
  })

  describe('resolveActiveNavValue', () => {
    it.each([
      ['/dashboard', 'overview'],
      ['/dashboard/events', 'events'],
      ['/dashboard/events/abc', 'events'],
      [`/dashboard/events/${EVENT}/participants`, 'participants'],
      [`/dashboard/events/${EVENT}/tickets`, 'tickets'],
      ['/dashboard/orders', 'orders'],
      ['/dashboard/lucky-wheel', 'lucky-wheel'],
    ])('%s highlights %s', (pathname, expected) => {
      expect(resolveActiveNavValue(pathname)).toBe(expected)
    })

    it('highlights nothing for an unknown page', () => {
      expect(resolveActiveNavValue('/dashboard/nope')).toBeUndefined()
    })
  })
})
