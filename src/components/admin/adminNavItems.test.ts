import { describe, expect, it } from 'vitest'
import { ADMIN_NAV_ITEMS } from './adminNavItems'
import { ADMIN_TAB_VALUES } from '@/store/useAdminDashboardStore'

describe('admin navigation', () => {
  it('keeps the global members page separate from event participants', () => {
    const members = ADMIN_NAV_ITEMS.find((item) => item.value === 'members')

    expect(members).toMatchObject({ href: '/dashboard/members' })
    expect(members?.requiresEventContext).toBeUndefined()
  })

  it('keeps groups and bootcamps as separate admin domains', () => {
    const groups = ADMIN_NAV_ITEMS.find((item) => item.value === 'groups')
    const bootcamps = ADMIN_NAV_ITEMS.find((item) => item.value === 'bootcamps')

    expect(groups).toMatchObject({ label: 'Groupes', href: '/dashboard/groups' })
    expect(bootcamps).toMatchObject({ label: 'Bootcamps', href: '/dashboard/bootcamps' })
    expect(groups?.href).not.toBe(bootcamps?.href)
  })

  it('keeps Lucky Wheel available in both route and legacy dashboard tabs', () => {
    const luckyWheel = ADMIN_NAV_ITEMS.find((item) => item.value === 'lucky-wheel')

    expect(luckyWheel).toMatchObject({ href: '/dashboard/lucky-wheel' })
    expect(ADMIN_TAB_VALUES).toContain('lucky-wheel')
  })
})
