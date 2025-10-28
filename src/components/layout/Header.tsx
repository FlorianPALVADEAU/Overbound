'use client'
import { useState } from 'react'
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
  CalendarIcon,
  InfoIcon,
  CreditCardIcon,
  MedalIcon,
  BrickWallIcon,
  DumbbellIcon,
  BookOpenTextIcon,
  ChevronDownIcon,
  MapPinIcon,
  TrophyIcon
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SessionProfile, SessionResponse, SessionUser } from '@/app/api/session/sessionQueries'

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
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navigation: NavigationItemType[] = [
    { name: 'Obstacles', href: '/obstacles', icon: BrickWallIcon },
    // { name: 'Entrainements', href: '/trainings', icon: DumbbellIcon },
    // { name: 'Shop', href: '/shop', icon: ShoppingBagIcon },
    { name: 'Blog', href: '/blog', icon: BookOpenTextIcon },
    // { name: 'À propos', href: '/about', icon: InfoIcon },
  ]

  const eventsDropdownItems: DropdownItemType[] = [
    // { name: 'Toutes les courses', href: '/events', icon: MedalIcon },
    { name: 'Le rite du guerrier', href: '/races/rite-du-guerrier', icon: CalendarIcon },
    { name: 'La voie du héros', href: '/races/voie-du-heros', icon: MapPinIcon },
    { name: 'Tribal Royale', href: '/races/tribale-royale', icon: MapPinIcon },
    { name: 'Tribal Kids', href: '/races/tribale-kids', icon: MapPinIcon },
    { name: 'Devenir bénévole', href: '/volunteers', icon: TrophyIcon, highlight: true },
  ]

  const trainingsDropdownItems: DropdownItemType[] = [
    { name: 'Plans d\'entraînement', href: '/trainings/plans', icon: MedalIcon },
    { name: 'Test de fitness', href: '/trainings/fitness-test', icon: CalendarIcon },
    { name: 'Nutrition', href: '/trainings/nutrition', icon: MapPinIcon },
    { name: 'Quelle course est faite pour moi ?', href: '/trainings/what-race-for-me', icon: MapPinIcon },
  ]

  const aboutDropdownItems: DropdownItemType[] = [
    { name: 'Le concept', href: '/about/concept', icon: MedalIcon },
    { name: 'Notre histoire', href: '/about/our-story', icon: MedalIcon },
    { name: 'Équipe', href: '/about/team', icon: CalendarIcon },
    { name: 'FAQ', href: '/about/faq', icon: MapPinIcon },
    { name: 'Devenir bénévole', href: '/volunteers', icon: TrophyIcon, highlight: true },
  ]

  const navItems: NavItem[] = [
    { type: 'dropdown', name: 'Courses', href: '/events', icon: MedalIcon, items: eventsDropdownItems },
    { type: 'dropdown', name: 'Entrainements', icon: DumbbellIcon, items: trainingsDropdownItems },
    ...navigation.map((item) => ({ ...item, type: 'link' as const })),
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

  const hasDashboardAccess = normalizedRoles.some((role) => role.includes('admin') || role === 'volunteer' || role === 'staff')
  const needsDocumentAttention = Boolean(alerts?.needs_document_action)
  const needsProfileCompletion = Boolean(
    user && (!profile?.full_name || !profile?.phone || !profile?.date_of_birth),
  )
  const attentionNeeded = needsDocumentAttention || needsProfileCompletion

  const userNavigation: NavigationItemType[] = user ? [
    { name: 'Mon compte', href: '/account', icon: UserIcon },
    { name: 'Mes billets', href: '/account/tickets', icon: CreditCardIcon },
    ...(hasDashboardAccess ? [
      { name: 'Administration', href: '/dashboard', icon: SettingsIcon },
    ] : []),
  ] : []

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Container responsive avec max-width et padding adaptatifs */}
      <div className="w-full mx-auto px-4 lg:px-32">
        <div className="w-full relative flex h-14 sm:h-16 items-center justify-between">
          
          {/* Logo - responsive text visibility */}
          <div className="flex items-between z-10">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/totem_logo_white.png"
                alt="OverBound Logo"
                width={64}
                height={64}
                className="w-8 md:w-10 lg:w-12 h-auto"
              />
            </Link>
          </div>

          <div className="absolute flex w-full h-full items-center justify-center">
            {/* Navigation Desktop - hidden sur mobile/tablet */}
            <nav className="hidden h-full items-center space-x-6 align-center xl:space-x-8 lg:flex ">
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
                      <DropdownMenuContent align="start" className="min-w-[220px] -mt-1 -ml-1 border-t-0 rounded-t-none bg-background" forceMount>
                        {item.href ? (
                          <>
                            <DropdownMenuItem asChild>
                              <Link
                                href={item.href}
                                // no border radius on bottom to connect with dropdown items
                                className=" outline-none flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                Voir toutes les {item.name.toLowerCase()}
                                <ChevronDownIcon className="h-4 w-4 rotate-[-90deg]" />
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        ) : null}
                        {item.items.map((subItem) => (
                          <DropdownMenuItem key={subItem.name} asChild>
                            <Link
                              href={subItem.href}
                              className={`flex items-center gap-3 rounded-md px-3 pr-6 py-2 text-sm transition-colors outline-none cursor-pointer ${
                                subItem.highlight
                                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {/* <subItem.icon className="h-4 w-4" /> */}
                              <span className="font-medium">{subItem.name}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
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
                    const showIndicator =
                      (needsDocumentAttention &&
                        (item.href === '/account' || item.href === '/account/tickets')) ||
                      (needsProfileCompletion && item.href === '/account')

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
            ) : (
              <div className="flex items-center space-x-2 z-10">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
                <Button size="sm" className="text-xs sm:text-sm" asChild>
                  <Link href="/auth/login">S'inscrire</Link>
                </Button>
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
          <div className="absolute left-0 z-10 w-full border-t bg-secondary pb-3 pt-4 lg:hidden">
            <div className="space-y-1">
              {navItems.map((item) =>
                item.type === 'dropdown' ? (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() =>
                        setMobileDropdownOpen((current) => (current === item.name ? null : item.name))
                      }
                      className="flex w-full items-center justify-between rounded-md px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {/* <div className="flex items-center">
                        {item.icon ? <item.icon className="mr-3 h-5 w-5 flex-shrink-0" /> : null}
                        {item.name}
                      </div> */}
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform ${
                          mobileDropdownOpen === item.name ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {mobileDropdownOpen === item.name ? (
                      <div className="ml-6 space-y-1 border-l-2 border-border pl-4">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                              subItem.highlight
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            }`}
                            onClick={() => {
                              setMobileMenuOpen(false)
                              setMobileDropdownOpen(null)
                            }}
                          >
                            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <subItem.icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center rounded-md px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                ),
              )}
            </div>

            {/* Boutons auth sur mobile si pas connecté */}
            {!user && (
              <div className="mt-4 border-t pt-4">
                <div className="flex flex-col space-y-2 px-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth/login">Se connecter</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/auth/login">S'inscrire</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
