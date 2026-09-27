'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BarChart3, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ADMIN_NAV_GROUPS, ADMIN_NAV_ITEMS } from './adminNavItems'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AdminSidebarProps {
  profileRole: 'admin' | 'volunteer'
  fullName?: string | null
}

export function AdminSidebar({ profileRole, fullName }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event')
  const activeTab = ADMIN_NAV_GROUPS.flatMap((group) => group.items).find((item) =>
    item.href === '/dashboard'
      ? pathname === '/dashboard' && !searchParams.get('tab')
      : item.href.startsWith('/dashboard?tab=')
        ? searchParams.get('tab') === item.value
        : pathname === item.href ||
          (item.value === 'tickets' && pathname.endsWith('/tickets')) ||
          (item.requiresEventContext && pathname.includes(`/${item.value}`))
  )?.value

  const hrefFor = (item: (typeof ADMIN_NAV_GROUPS)[number]['items'][number]) => {
    if (item.requiresEventContext && eventId) {
      if (item.value === 'tickets') return `/dashboard/events/${eventId}/tickets`
    }
    if (!eventId) return item.href
    const separator = item.href.includes('?') ? '&' : '?'
    return `${item.href}${separator}event=${encodeURIComponent(eventId)}`
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const group of ADMIN_NAV_GROUPS) {
      initial[group.id] = group.items.some((item) => item.value === activeTab)
    }
    return initial
  })

  useEffect(() => {
    for (const group of ADMIN_NAV_GROUPS) {
      if (group.items.some((item) => item.value === activeTab)) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }))
        break
      }
    }
  }, [activeTab])

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background px-4 py-3 md:hidden">
        <BarChart3 className="size-4 shrink-0 text-primary" aria-hidden />
        <label htmlFor="admin-mobile-navigation" className="sr-only">Section d’administration</label>
        <Select
          value={activeTab ?? 'overview'}
          onValueChange={(value) => {
            const item = ADMIN_NAV_ITEMS.find((candidate) => candidate.value === value)
            if (!item) return
            router.push(hrefFor(item))
          }}
        >
          <SelectTrigger id="admin-mobile-navigation" className="min-w-0 flex-1 bg-background text-sm font-medium">
            <SelectValue placeholder="Choisir une section" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[min(70vh,20rem)]">
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
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      {/* User identity */}
      <div className="p-6 border-b">
        <p className="text-sm font-medium text-muted-foreground">Connecté en tant que</p>
        <p className="text-lg font-semibold truncate">{fullName || 'Administrateur'}</p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mt-1">
          {profileRole === 'admin' ? 'Administrateur' : 'Bénévole'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {/* Standalone: Tableau de bord */}
        <Link
          href="/dashboard"
          className={cn(
            'w-full flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <BarChart3 className="h-4 w-4 shrink-0" />
          <span>Tableau de bord</span>
        </Link>

        <div className="my-2 border-t border-border/40" />

        {/* Collapsible groups */}
        {ADMIN_NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.id] ?? false
          const hasActiveItem = group.items.some((item) => item.value === activeTab)

          return (
            <div key={group.id}>
              {/* Group header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  hasActiveItem
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <group.icon
                  className={cn('h-4 w-4 shrink-0', hasActiveItem && 'text-primary')}
                />
                <span className="flex-1 text-left">{group.label}</span>
                {hasActiveItem && !isOpen && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Items — collapsible */}
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200 ease-in-out',
                  isOpen ? 'max-h-64' : 'max-h-0'
                )}
              >
                <div className="ml-3 pl-3 border-l border-border/50">
                  {group.items.map((item) => (
                    <Link
                      key={item.value}
                      href={hrefFor(item)}
                      className={cn(
                        'w-full flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                        activeTab === item.value
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* Back to site */}
      <div className="p-4 border-t">
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Retour au site
        </Link>
      </div>
      </aside>
    </>
  )
}
