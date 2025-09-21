'use client'
import { useState } from 'react'
import Link from 'next/link'
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
  HomeIcon,
  InfoIcon,
  CreditCardIcon,
  MedalIcon,
  BrickWallIcon,
  DumbbellIcon,
  ShoppingBagIcon,
  BookOpenTextIcon,
  ChevronDownIcon,
  MapPinIcon,
  ClockIcon,
  TrophyIcon
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  } | null
  profile?: {
    full_name?: string
    avatar_url?: string
    role?: string
  } | null
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



export function Header({ user, profile }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(false)
  const [mobileEventsOpen, setMobileEventsOpen] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navigation: NavigationItemType[] = [
    { name: 'Obstacles', href: '/obstacles', icon: BrickWallIcon },
    { name: 'Entrainements', href: '/trainings', icon: DumbbellIcon },
    // { name: 'Shop', href: '/shop', icon: ShoppingBagIcon },
    { name: 'Blog', href: '/blog', icon: BookOpenTextIcon },
    { name: 'À propos', href: '/about', icon: InfoIcon },
  ]

  const eventsDropdownItems: DropdownItemType[] = [
    { name: 'Toutes les courses', href: '/events', icon: MedalIcon },
    { name: 'Le rite du guerrier', href: '/events/rite-du-guerrier', icon: CalendarIcon },
    { name: 'La voie du héros', href: '/events/voie-du-heros', icon: MapPinIcon },
    { name: 'Tribal Royale', href: '/events/tribal-royale', icon: MapPinIcon },
    { name: 'Tribal Kids', href: '/events/tribal-kids', icon: MapPinIcon },
    { name: 'Volunteers', href: '/events/results', icon: TrophyIcon, highlight: true },
    { name: 'Archives', href: '/events/archives', icon: ClockIcon },
  ]

  const userNavigation: NavigationItemType[] = user ? [
    { name: 'Mon compte', href: '/account', icon: UserIcon },
    { name: 'Mes billets', href: '/account/tickets', icon: CreditCardIcon },
    ...(profile?.role === 'admin' || profile?.role === 'volunteer' ? [
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <span className="hidden text-lg font-bold sm:inline-block lg:text-xl">
                OverBound
              </span>
            </Link>
          </div>

          <div className="absolute flex w-full h-full items-center justify-center">
            {/* Navigation Desktop - hidden sur mobile/tablet */}
            <nav className="h-full hidden lg:flex items-center align-center space-x-6 xl:space-x-8">
              {/* Dropdown Courses */}
              <DropdownMenu 
                open={eventsDropdownOpen} 
                onOpenChange={setEventsDropdownOpen}
              >
                <DropdownMenuTrigger asChild className='h-full cursor-pointer outline-none'>
                  <Link 
                    href="/events"
                    className="h-full flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground xl:text-base group"
                    onMouseEnter={() => setEventsDropdownOpen(true)}
                    onMouseLeave={() => setEventsDropdownOpen(false)}
                  >
                    Courses
                    <ChevronDownIcon className="ml-1 h-3 w-3 transition-transform group-hover:rotate-180" />
                  </Link>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-full 5 p-2 ml-12 -mt-1" 
                  align="center"
                  onMouseEnter={() => setEventsDropdownOpen(true)}
                  onMouseLeave={() => setEventsDropdownOpen(false)}
                >
                  {eventsDropdownItems.map((item, index) => (
                    <DropdownMenuItem key={item.name + index} asChild>
                      <Link 
                        href={item.href} 
                        className="cursor-pointer rounded-md p-5 hover:bg-accent/80 transition-colors group"
                      >
                        <p className="text-sm font-medium">{item.name}</p>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Autres liens de navigation */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="h-full flex align-center items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground xl:text-base"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
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
                  {userNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
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
          <div className="absolute border-t pb-3 pt-4 z-10 lg:hidden bg-secondary w-full left-0">
            <div className="space-y-1">
              {/* Dropdown Courses pour mobile */}
              <div className="space-y-1">
                <button
                  onClick={() => setMobileEventsOpen(!mobileEventsOpen)}
                  className="w-full flex items-center justify-between rounded-md px-3 py-3 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <div className="flex items-center">
                    <MedalIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                    Courses
                  </div>
                  <ChevronDownIcon 
                    className={`h-4 w-4 transition-transform ${mobileEventsOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {mobileEventsOpen && (
                  <div className="ml-6 space-y-1 border-l-2 border-border pl-4">
                    {eventsDropdownItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          setMobileEventsOpen(false)
                        }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary mr-3">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Autres liens de navigation */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center rounded-md px-3 py-3 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </div>
            
            {/* Boutons auth sur mobile si pas connecté */}
            {!user && (
              <div className="mt-4 pt-4 border-t">
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