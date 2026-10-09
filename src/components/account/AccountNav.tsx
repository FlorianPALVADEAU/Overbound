'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3Icon, TicketIcon, UserIcon, UsersIcon } from 'lucide-react'
import { useAccountRegistrations } from '@/app/api/account/registrations/accountRegistrationsQueries'
import { getProfileCompletion } from '@/lib/account/profile'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/account', label: 'Billets', icon: TicketIcon, isActive: (path: string) => path === '/account' || path.startsWith('/account/tickets') },
  { href: '/account/group', label: 'Groupe', icon: UsersIcon, isActive: (path: string) => path.startsWith('/account/group') },
  { href: '/account/stats', label: 'Stats', icon: BarChart3Icon, isActive: (path: string) => path.startsWith('/account/stats') },
  { href: '/account/profile', label: 'Compte', icon: UserIcon, isActive: (path: string) => path.startsWith('/account/profile') },
] as const

function useNavState() {
  const pathname = usePathname() ?? ''
  const { data } = useAccountRegistrations()
  // Only flag once data is known and the visitor is signed in.
  const profileNeedsAttention = Boolean(data?.user) && !getProfileCompletion(data?.profile).isComplete
  return { pathname, profileNeedsAttention }
}

/** Mobile: thumb-reachable bar fixed to the bottom edge. */
function MobileNav() {
  const { pathname, profileNeedsAttention } = useNavState()

  return (
    <nav
      aria-label="Navigation du compte"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                  {href === '/account/profile' && profileNeedsAttention ? (
                    <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-destructive" aria-label="Profil incomplet" />
                  ) : null}
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Tablet and desktop: tabs under the site header, aligned with the page canvas. */
function DesktopNav() {
  const { pathname, profileNeedsAttention } = useNavState()

  return (
    <nav aria-label="Navigation du compte" className="hidden border-b border-border md:block">
      <ul className="mx-auto flex max-w-5xl gap-1 px-8 xl:max-w-6xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-14 items-center gap-2 px-4 text-sm font-semibold transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('size-4', active && 'text-primary')} />
                {label}
                {href === '/account/profile' && profileNeedsAttention ? (
                  <span className="size-2 rounded-full bg-destructive" aria-label="Profil incomplet" />
                ) : null}
                {active ? <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden /> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AccountNav() {
  return (
    <>
      <DesktopNav />
      <MobileNav />
    </>
  )
}
