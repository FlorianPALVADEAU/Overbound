'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BarChart3, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DISPLAY_TITLE } from '@/components/ds'
import { ADMIN_NAV_GROUPS, ADMIN_NAV_ITEMS, hrefForNavItem, resolveActiveNavValue } from './adminNavItems'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AdminSidebarProps {
  profileRole: 'admin' | 'volunteer'
  fullName?: string | null
  /** Event selected in the top bar (from the URL), carried to the pages that work on one event. */
  eventId?: string | null
}

export function AdminSidebar({ profileRole, fullName, eventId: contextEventId }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = contextEventId ?? searchParams.get('event')
  const activeTab = resolveActiveNavValue(pathname)

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ADMIN_NAV_GROUPS.map((group) => [group.id, group.items.some((item) => item.value === activeTab)])),
  )

  useEffect(() => {
    const group = ADMIN_NAV_GROUPS.find((candidate) => candidate.items.some((item) => item.value === activeTab))
    if (group) setOpenGroups((previous) => ({ ...previous, [group.id]: true }))
  }, [activeTab])

  const toggleGroup = (groupId: string) => {
    setOpenGroups((previous) => ({ ...previous, [groupId]: !previous[groupId] }))
  }

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface-deep px-4 py-3 md:hidden">
        <BarChart3 className="size-4 shrink-0 text-primary" aria-hidden />
        <label htmlFor="admin-mobile-navigation" className="sr-only">Section d’administration</label>
        <Select
          value={activeTab ?? 'overview'}
          onValueChange={(value) => {
            const item = ADMIN_NAV_ITEMS.find((candidate) => candidate.value === value)
            if (item) router.push(hrefForNavItem(item, eventId))
          }}
        >
          <SelectTrigger id="admin-mobile-navigation" className="min-w-0 flex-1 text-sm font-medium">
            <SelectValue placeholder="Choisir une section" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[min(70vh,24rem)]">
            <SelectGroup>
              <SelectLabel>Général</SelectLabel>
              <SelectItem value="overview">Tableau de bord</SelectItem>
            </SelectGroup>
            {ADMIN_NAV_GROUPS.map((group) => (
              <SelectGroup key={group.id}>
                <SelectSeparator />
                <SelectLabel>{group.label}</SelectLabel>
                {group.items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface-deep md:flex">
        <div className="border-b border-border p-6">
          <p className="text-label font-semibold uppercase text-subtle">
            {profileRole === 'admin' ? 'Administrateur' : 'Bénévole'}
          </p>
          <p className={cn(DISPLAY_TITLE, 'mt-2 truncate text-title')}>{fullName || 'Administrateur'}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Administration">
          <Link
            href="/dashboard"
            aria-current={activeTab === 'overview' ? 'page' : undefined}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span>Tableau de bord</span>
          </Link>

          <div className="my-2 border-t border-border" />

          {ADMIN_NAV_GROUPS.map((group) => {
            const isOpen = openGroups[group.id] ?? false
            const hasActiveItem = group.items.some((item) => item.value === activeTab)

            return (
              <div key={group.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    hasActiveItem ? 'text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <group.icon className={cn('h-4 w-4 shrink-0', hasActiveItem && 'text-primary')} />
                  <span className="flex-1 text-left">{group.label}</span>
                  {hasActiveItem && !isOpen && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-standard',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>

                {/* grid-rows animates to the real content height: no fixed max-height that could clip a long group */}
                <div className={cn('grid transition-[grid-template-rows] duration-200 ease-standard', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                  <div className="overflow-hidden">
                    <div className="ml-3 border-l border-border pl-3">
                      {group.items.map((item) => (
                        <Link
                          key={item.value}
                          href={hrefForNavItem(item, eventId)}
                          tabIndex={isOpen ? undefined : -1}
                          aria-current={activeTab === item.value ? 'page' : undefined}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                            activeTab === item.value
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            href="/"
            className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Retour au site
          </Link>
        </div>
      </aside>
    </>
  )
}
