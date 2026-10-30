'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { containerClass } from '@/components/ds'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MenuIcon,
  XIcon,
  UserIcon,
  LogOutIcon,
  SettingsIcon,
  CreditCardIcon,
  MedalIcon,
  ChevronDownIcon,
  UsersIcon,
  CameraIcon,
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { usePathname, useRouter } from 'next/navigation'
import { isActiveNavHref } from '@/lib/navigation/activeLink'
import { SessionProfile, SessionResponse, SessionUser, SESSION_QUERY_KEY } from '@/app/api/session/sessionQueries'
import { useQueryClient } from '@tanstack/react-query'
import { hasAmbassadorAccess } from '@/lib/ambassadors/access'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'

interface HeaderProps {
  user?: SessionUser | null
  profile?: SessionProfile | null
  isLoading?: boolean
  alerts?: SessionResponse['alerts'] | null
}

type NavigationItemType = {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

type NavLeaf = {
  name: string
  href: string
  /** Opens in a new tab (off-site link). */
  external?: boolean
}

type NavGroup = {
  name: string
  items: NavLeaf[]
}

type NavItem = (NavLeaf & { type: 'link' }) | (NavGroup & { type: 'dropdown' })

function NavSubLink({
  item,
  current,
  className,
  onNavigate,
}: {
  item: NavLeaf
  current?: 'page'
  className: string
  onNavigate?: () => void
}) {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={className}
        onClick={onNavigate}
      >
        <CameraIcon className="h-4 w-4" aria-hidden="true" />
        {item.name}
      </a>
    )
  }
  return (
    <Link href={item.href} aria-current={current} className={className} onClick={onNavigate}>
      {item.name}
    </Link>
  )
}



export function Header({ user, profile, alerts, isLoading }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<string | null>(null)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const router = useRouter()
  const pathname = usePathname()
  const currentFor = (href: string) => (isActiveNavHref(pathname, href) ? ('page' as const) : undefined)
  const supabase = createSupabaseBrowser()
  const queryClient = useQueryClient()
  const { data: featuredEventData } = useFeaturedEvent()
  const featuredEvent = featuredEventData?.event
  const featuredEventHref = featuredEvent ? `/events/${featuredEvent.slug}` : '/events'
  const featuredEventRegisterHref = featuredEvent
    ? `/events/${featuredEvent.slug}/register`
    : '/events'

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    setMobileDropdownOpen(null)
  }

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
        setMobileDropdownOpen(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    queryClient.setQueryData(SESSION_QUERY_KEY, {
      user: null,
      profile: null,
      alerts: null,
    } as SessionResponse)
    await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    router.push('/')
    router.refresh()
  }

  const navItems: NavItem[] = [
    { type: 'link', name: 'Événement', href: featuredEventHref },
    { type: 'link', name: 'Devenir bénévole', href: '/volunteers' },
    { type: 'link', name: 'Entreprises', href: '/entreprises' },
    {
      type: 'dropdown',
      name: 'La course',
      items: [
        { name: 'Formats', href: '/events/formats' },
        { name: 'Obstacles', href: '/obstacles' },
        { name: 'Bootcamps', href: '/bootcamps' },
        ...(featuredEvent?.photos_url
          ? [{ name: 'Photos de l\u2019édition', href: featuredEvent.photos_url, external: true }]
          : []),
      ],
    },
    {
      type: 'dropdown',
      name: 'À propos',
      items: [
        { name: 'Notre histoire', href: '/about/our-story' },
        { name: 'Blog', href: '/blog' },
        { name: 'Partenaires & presse', href: '/about/partners' },
        { name: 'FAQ', href: '/about/faq' },
        { name: 'Contact', href: '/contact' },
      ],
    },
  ]

  const isGroupActive = (group: NavGroup) =>
    group.items.some((subItem) => !subItem.external && isActiveNavHref(pathname, subItem.href))

  const rawRoleCandidates = [
    profile?.role,
    (user?.user_metadata as Record<string, any> | undefined)?.role,
    (user?.user_metadata as Record<string, any> | undefined)?.roles,
    (user as Record<string, any> | undefined)?.app_metadata?.role,
    (user as Record<string, any> | undefined)?.app_metadata?.roles,
  ]

  const normalizedRoles = rawRoleCandidates.flatMap((value) => {
    if (!value) {
      return []
    }

    const toArray = Array.isArray(value) ? value : String(value).split(',')

    return toArray
      .map((role) => String(role).trim().toLowerCase())
      .filter(Boolean)
  })

  const isAdmin = normalizedRoles.some((role) => role.includes('admin'))
  const isVolunteer = normalizedRoles.some((role) => role === 'volunteer')
  const isAmbassadorRole = normalizedRoles.some((role) => role === 'ambassador')
  const hasDashboardAccess = isAdmin || isVolunteer || normalizedRoles.some((role) => role === 'staff')
  const canAccessAmbassadorDashboard = hasAmbassadorAccess({
    role: isAmbassadorRole ? 'ambassador' : null,
    email: user?.email ?? null,
  })
  const needsProfileCompletion = Boolean(
    user && (!profile?.full_name || !profile?.phone || !profile?.date_of_birth),
  )
  const attentionNeeded = needsProfileCompletion

  const userNavigation: NavigationItemType[] = user ? [
    { name: 'Mon compte', href: '/account', icon: UserIcon },
    { name: 'Mon groupe', href: '/account/group', icon: UsersIcon },
    { name: 'Mes billets', href: '/account/tickets', icon: CreditCardIcon },
    ...(hasDashboardAccess ? [
      { name: isVolunteer && !isAdmin ? 'Espace bénévole' : 'Administration', href: '/dashboard', icon: SettingsIcon },
    ] : canAccessAmbassadorDashboard ? [
      { name: 'Espace ambassadeur', href: '/ambassadors/dashboard', icon: MedalIcon },
    ] : []),
  ] : []

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY <= 0) {
        setIsHeaderVisible(true)
        lastScrollY.current = 0
        return
      }

      if (mobileMenuOpen) {
        setIsHeaderVisible(true)
        lastScrollY.current = currentScrollY
        return
      }

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsHeaderVisible(false)
      } else if (currentScrollY < lastScrollY.current) {
        setIsHeaderVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mobileMenuOpen])

  const guestActions = (
    <div className="flex items-center space-x-2 z-10">
      <Button variant="ghost" size="sm" className="hidden min-h-11 sm:inline-flex" asChild>
        <Link href="/auth/login">Se connecter</Link>
      </Button>
      <Button
        size="sm"
        variant="signal"
        className="hidden min-h-11 lg:inline-flex whitespace-nowrap rounded-xl"
        asChild
      >
        <Link href={featuredEventRegisterHref}>Je m'inscris</Link>
      </Button>
    </div>
  )

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 will-change-transform ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Same content width and gutters as every page section (design system) */}
      <div className={containerClass()}>
        <div className="w-full relative grid h-14 sm:h-16 grid-cols-[1fr_auto_1fr] grid-rows-1 items-stretch">
          
          {/* Logo - responsive text visibility */}
          <div className="flex items-center justify-self-start z-10 py-2 pr-2">
            {/* py-2 pr-2 on the wrapping div above (not negative-margined,
                since the logo sits flush against the header's left edge
                and can't grow further left) plus p-2 here grows the tap
                target toward 44px on every remaining side without
                overflowing the row (FDR-0015 §10). */}
            <Link href="/" className="flex items-center space-x-2 p-2">
              <Image
                src="/images/brand/totem_logo_white.png"
                alt="Overbound, accueil"
                width={64}
                height={64}
                priority
                className="w-8 md:w-10 lg:w-12 h-auto"
              />
            </Link>
          </div>

          {/* In the flex flow (not absolute) so the nav can never slide under the logo or the actions */}
          <div className="flex h-full min-w-0 items-center justify-center">
            {/* Navigation Desktop - hidden sur mobile/tablet */}
            <nav aria-label="Navigation principale" className="hidden h-full items-center space-x-4 whitespace-nowrap align-center xl:space-x-8 lg:flex">
              {navItems.map((item) =>
                item.type === 'dropdown' ? (
                  <div
                    key={item.name}
                    className="flex h-full items-center hover:text-primary cursor-pointer"
                    onMouseEnter={() => setOpenDropdown(item.name)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <DropdownMenu
                      open={openDropdown === item.name}
                      onOpenChange={(open) => setOpenDropdown(open ? item.name : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={`cursor-pointer outline-none flex h-full items-center uppercase text-sm font-medium hover:text-primary xl:text-base group ${
                            isGroupActive(item) ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {item.name}
                          <ChevronDownIcon className="ml-1 h-3 w-3 transition-transform group-hover:rotate-180" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="p-0 min-w-[220px] -mt-1 -ml-1 border-t-0 rounded-t-none bg-background" forceMount>
                        <div className="py-2">
                          {item.items.map((subItem) => (
                            <DropdownMenuItem key={subItem.name} asChild>
                              <NavSubLink
                                item={subItem}
                                current={currentFor(subItem.href)}
                                className="flex items-center gap-3 rounded-md px-4 pr-6 py-2 text-sm font-medium transition-colors outline-none cursor-pointer text-muted-foreground hover:text-foreground aria-[current=page]:text-primary"
                              />
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={currentFor(item.href)}
                    className="cursor-pointer flex h-full items-center text-sm uppercase font-medium text-foreground transition-colors hover:text-primary aria-[current=page]:text-primary xl:text-base"
                  >
                    {item.name}
                  </Link>
                ),
              )}
            </nav>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-self-end space-x-2 sm:space-x-4">
            {isLoading ? (
              // The centred nav depends on this width: while the session loads,
              // the guest buttons hold their place, hidden and out of the tab
              // order, so the header does not shift for most visitors (CLS).
              <div className="invisible" aria-hidden="true">{guestActions}</div>
            ) : user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative size-11 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={profile?.avatar_url || user.user_metadata?.avatar_url}
                          alt={profile?.full_name || user.email || 'User'}
                        />
                        <AvatarFallback>
                          {profile?.full_name
                            ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                            : user.email?.[0].toUpperCase() || 'U'
                          }
                        </AvatarFallback>
                      </Avatar>
                      {attentionNeeded ? (
                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background bg-destructive text-label font-bold leading-none tracking-normal text-foreground">
                          !
                        </span>
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">
                          {profile?.full_name || 'Utilisateur'}
                        </p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {userNavigation.map((item) => {
                      const showIndicator = needsProfileCompletion && item.href === '/account'

                      return (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link href={item.href} className="flex w-full items-center justify-between gap-3">
                            <span className="flex items-center">
                              <item.icon className="mr-2 h-4 w-4" />
                              {item.name}
                            </span>
                            {showIndicator ? (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-label font-bold leading-none tracking-normal text-foreground">
                                !
                              </span>
                            ) : null}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              guestActions
            )}

            {/* Mobile menu button - affiché seulement sur mobile/tablet */}
            <div className="lg:hidden z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                className="h-11 w-11 p-0"
              >
                {mobileMenuOpen ? (
                  <XIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <MenuIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Mobile - améliorée avec animations */}
        {mobileMenuOpen && (
          <nav id="mobile-menu" aria-label="Menu principal" className="absolute left-0 z-10 w-full border-t border-border bg-background pb-4 pt-4 backdrop-blur lg:hidden">
            <div className="space-y-1">
              {navItems.map((item) =>
                item.type === 'dropdown' ? (
                  <div key={item.name}>
                    <button
                      type="button"
                      aria-expanded={mobileDropdownOpen === item.name}
                      onClick={() =>
                        setMobileDropdownOpen((current) => (current === item.name ? null : item.name))
                      }
                      className="flex min-h-11 w-full items-center justify-between px-6 py-3 text-left text-base font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      <span className={isGroupActive(item) ? 'text-primary' : undefined}>{item.name}</span>
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform ${
                          mobileDropdownOpen === item.name ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {mobileDropdownOpen === item.name ? (
                      <div className="space-y-1 px-6 pb-3 pt-1">
                        {item.items.map((subItem) => (
                          <NavSubLink
                            key={subItem.name}
                            item={subItem}
                            current={currentFor(subItem.href)}
                            onNavigate={closeMobileMenu}
                            className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground aria-[current=page]:text-primary"
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={currentFor(item.href)}
                    className="flex min-h-11 w-full items-center px-6 py-3 text-base font-semibold text-foreground transition-colors hover:text-primary aria-[current=page]:text-primary"
                    onClick={closeMobileMenu}
                  >
                    {item.name}
                  </Link>
                ),
              )}
            </div>

            {/* Boutons CTA sur mobile */}
            <div className="mt-5 border-t border-border/60 pt-4">
              <div className="flex flex-col space-y-3 px-6">
                {!user && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-11 rounded-xl border-primary text-primary hover:bg-primary/10"
                  >
                    <Link href="/auth/login" onClick={closeMobileMenu}>Se connecter</Link>
                  </Button>
                )}
                {!user ? (
                  <Button
                    size="sm"
                    variant="signal"
                    asChild
                    className="h-11 rounded-xl"
                  >
                    <Link href={featuredEventRegisterHref} onClick={closeMobileMenu}>
                      Je m&apos;inscris
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild className="h-11 rounded-xl">
                      <Link href="/account" onClick={closeMobileMenu}>Mon compte</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-11 rounded-xl"
                      onClick={() => {
                        closeMobileMenu()
                        void handleSignOut()
                      }}
                    >
                      Déconnexion
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
