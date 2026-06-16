'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
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
  InfoIcon,
  CreditCardIcon,
  MedalIcon,
  ChevronDownIcon,
  MapPinIcon,
  UsersIcon,
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SessionProfile, SessionResponse, SessionUser, SESSION_QUERY_KEY } from '@/app/api/session/sessionQueries'
import { useQueryClient } from '@tanstack/react-query'
import { hasAmbassadorAccess } from '@/lib/ambassadors/access'

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

type DropdownItemType = {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  highlight?: boolean
}

type NavLinkItem = NavigationItemType & { type: 'link' }
type NavDropdownItem = {
  type: 'dropdown'
  name: string
  href?: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  items: DropdownItemType[]
}

type NavItem = NavLinkItem | NavDropdownItem



export function Header({ user, profile, alerts, isLoading }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<string | null>(null)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const router = useRouter()
  const supabase = createSupabaseBrowser()
  const queryClient = useQueryClient()

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    setMobileDropdownOpen(null)
  }

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

  const aboutDropdownItems: DropdownItemType[] = [
    { name: 'Le concept', href: '/about/concept', icon: MedalIcon },
    { name: 'Notre histoire', href: '/about/our-story', icon: MedalIcon },
    { name: 'FAQ', href: '/about/faq', icon: MapPinIcon },
    { name: 'Presse', href: '/about/press', icon: MapPinIcon },
    { name: 'Contact', href: '/contact', icon: MapPinIcon },
  ]

  const navItems: NavItem[] = [
    { type: 'dropdown', name: 'À propos', icon: InfoIcon, items: aboutDropdownItems },
  ]

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
    { name: 'Mon groupe', href: '/account?tab=group', icon: UsersIcon },
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

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 will-change-transform ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Container responsive avec max-width et padding adaptatifs */}
      <div className="w-full mx-auto px-4 lg:px-32">
        <div className="w-full relative flex h-14 sm:h-16 items-center justify-between">
          
          {/* Logo - responsive text visibility */}
          <div className="flex items-between z-10">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/brand/totem_logo_white.png"
                alt="OverBound Logo"
                width={64}
                height={64}
                className="w-8 md:w-10 lg:w-12 h-auto"
              />
            </Link>
          </div>

          <div className="absolute flex w-full h-full items-center justify-center">
            {/* Navigation Desktop - hidden sur mobile/tablet */}
            <nav className="hidden h-full items-center space-x-6 align-center xl:space-x-8 lg:flex">
              <Link href="/events/ultra-arena-2026" className="cursor-pointer text-amber-500 underline underline-offset-5 flex items-center text-sm uppercase font-medium transition-colors hover:text-primary xl:text-base">
                inscriptions paris 2026
              </Link>

              <Link
                href="/volunteers"
                className="cursor-pointer flex h-full items-center text-sm uppercase font-medium text-foreground transition-colors hover:text-primary xl:text-base"
              >
                Devenir bénévole
              </Link>

              <Link
                href="/bootcamps"
                className="cursor-pointer flex h-full items-center text-sm uppercase font-medium text-foreground transition-colors hover:text-primary xl:text-base"
              >
                Bootcamps
              </Link>

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
                          className="cursor-pointer outline-none flex h-full items-center uppercase text-sm font-medium text-foreground hover:text-primary xl:text-base group"
                        >
                          {item.name}
                          <ChevronDownIcon className="ml-1 h-3 w-3 transition-transform group-hover:rotate-180" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="p-0 min-w-[220px] -mt-1 -ml-1 border-t-0 rounded-t-none bg-background" forceMount>
                        <div className="py-2">
                          {item.items.map((subItem) => (
                            <DropdownMenuItem key={subItem.name} asChild>
                              <Link
                                href={subItem.href}
                                className="flex items-center gap-3 rounded-md px-4 pr-6 py-2 text-sm transition-colors outline-none cursor-pointer text-muted-foreground hover:text-foreground"
                              >
                                <span className="font-medium">{subItem.name}</span>
                              </Link>
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
                    className="cursor-pointer flex h-full items-center text-sm uppercase font-medium text-foreground transition-colors hover:text-primary xl:text-base"
                  >
                    {item.name}
                  </Link>
                ),
              )}
            </nav>

          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background bg-destructive text-[9px] font-bold leading-none text-white">
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
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold leading-none text-white">
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
              <div className="flex items-center space-x-2 z-10">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
                  {!user && (
                    <Button
                      size="sm"
                      className="hidden lg:inline-flex whitespace-nowrap text-xs sm:text-sm bg-red-600 hover:bg-red-700"
                      asChild
                    >
                      <Link href="/auth/register">S'inscrire</Link>
                    </Button>
                  )}
              </div>
            )}

            {/* Mobile menu button - affiché seulement sur mobile/tablet */}
            <div className="lg:hidden z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-8 w-8 p-0"
              >
                {mobileMenuOpen ? (
                  <XIcon className="h-5 w-5" />
                ) : (
                  <MenuIcon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Mobile - améliorée avec animations */}
        {mobileMenuOpen && (
          <div className="absolute left-0 z-10 w-full border-t border-border bg-background pb-4 pt-4 backdrop-blur lg:hidden">
            <div className="space-y-1">
              {/* Lien Inscriptions 2026 mobile */}
              <Link
                href="/events/ultra-arena-2026"
                className="block w-full px-6 py-3 text-base font-semibold text-amber-500 underline underline-offset-4 transition-colors hover:text-primary"
                onClick={closeMobileMenu}
              >
                Inscriptions 2026
              </Link>

              {navItems.map((item) =>
                item.type === 'dropdown' ? (
                  <div key={item.name}>
                    <button
                      onClick={() =>
                        setMobileDropdownOpen((current) => (current === item.name ? null : item.name))
                      }
                      className="flex w-full items-center justify-between px-6 py-3 text-left text-base font-semibold text-foreground transition-colors hover:text-[#26AA26]"
                    >
                      <span>{item.name}</span>
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform ${
                          mobileDropdownOpen === item.name ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {mobileDropdownOpen === item.name ? (
                      <div className="space-y-1 px-6 pb-3 pt-1">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="block w-full px-4 py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                            onClick={closeMobileMenu}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block w-full px-6 py-3 text-base font-semibold text-white transition-colors hover:text-[#26AA26]"
                    onClick={closeMobileMenu}
                  >
                    {item.name}
                  </Link>
                ),
              )}

              {/* Lien Devenir bénévole mobile */}
              <Link
                href="/volunteers"
                className="block w-full px-6 py-3 text-base font-semibold text-white transition-colors hover:text-[#26AA26]"
                onClick={closeMobileMenu}
              >
                Devenir bénévole
              </Link>

              {/* Lien Bootcamps mobile */}
              <Link
                href="/bootcamps"
                className="block w-full px-6 py-3 text-base font-semibold text-white transition-colors hover:text-[#26AA26]"
                onClick={closeMobileMenu}
              >
                Bootcamps
              </Link>
            </div>

            {/* Boutons CTA sur mobile */}
            <div className="mt-5 border-t border-border/60 pt-4">
              <div className="flex flex-col space-y-3 px-6">
                {!user && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-11 rounded-full border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10"
                  >
                    <Link href="/auth/login" onClick={closeMobileMenu}>Se connecter</Link>
                  </Button>
                )}
                {!user ? (
                  <Button
                    size="sm"
                    asChild
                    className="h-11 rounded-full bg-red-600 text-white hover:bg-red-700"
                  >
                    <Link href="/auth/register" onClick={closeMobileMenu}>S&apos;inscrire</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild className="h-11 rounded-full">
                      <Link href="/account" onClick={closeMobileMenu}>Mon compte</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-11 rounded-full"
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
          </div>
        )}
      </div>
    </header>
  )
}
