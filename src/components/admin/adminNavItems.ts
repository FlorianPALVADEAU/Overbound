'use client'

import {
  BarChart3,
  Calendar,
  Trophy,
  Zap,
  Medal,
  Ticket,
  Percent,
  Package,
  Users,
  UserCog,
  UserCheck,
  UsersRound,
  ScrollText,
  Mail,
  Megaphone,
  List,
  ShoppingCart,
  MessageSquare,
  Settings2,
  Dumbbell,
  Sparkles,
  ClipboardList,
  Construction,
  Building2,
  Receipt,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  value: string
  label: string
  icon: LucideIcon
  href: string
}

export interface AdminNavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: AdminNavItem[]
}

// Flat list: mobile select, active-page lookup.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { value: 'overview', label: 'Tableau de bord', icon: BarChart3, href: '/dashboard' },
  { value: 'events', label: 'Événements', icon: Calendar, href: '/dashboard/events' },
  { value: 'races', label: 'Courses', icon: Trophy, href: '/dashboard/races' },
  { value: 'obstacles', label: 'Obstacles', icon: Zap, href: '/dashboard/obstacles' },
  { value: 'participants', label: 'Participants', icon: UsersRound, href: '/dashboard/participants' },
  { value: 'orders', label: 'Commandes', icon: Receipt, href: '/dashboard/orders' },
  { value: 'tickets', label: 'Billets', icon: Ticket, href: '/dashboard/tickets' },
  { value: 'promocodes', label: 'Codes promo', icon: Percent, href: '/dashboard/promocodes' },
  { value: 'promotions', label: 'Promotions', icon: Megaphone, href: '/dashboard/promotions' },
  { value: 'upsells', label: 'Upsells', icon: Package, href: '/dashboard/upsells' },
  { value: 'b2b-quotes', label: 'Devis entreprises', icon: Building2, href: '/dashboard/b2b-quotes' },
  { value: 'ambassadors', label: 'Ambassadeurs', icon: Medal, href: '/dashboard/ambassadors' },
  { value: 'groups', label: 'Groupes', icon: Users, href: '/dashboard/groups' },
  { value: 'bootcamps', label: 'Bootcamps', icon: Dumbbell, href: '/dashboard/bootcamps' },
  { value: 'users', label: 'Comptes utilisateurs', icon: UserCog, href: '/dashboard/users' },
  { value: 'checkin', label: 'Check-in', icon: UserCheck, href: '/dashboard/checkin' },
  { value: 'volunteers', label: 'Bénévoles', icon: ClipboardList, href: '/dashboard/volunteers' },
  { value: 'emails', label: 'Emails', icon: Mail, href: '/dashboard/emails' },
  { value: 'distribution-lists', label: 'Listes de diffusion', icon: List, href: '/dashboard/distribution-lists' },
  { value: 'lucky-wheel', label: 'Lucky Wheel', icon: Sparkles, href: '/dashboard/lucky-wheel' },
  { value: 'logs', label: 'Logs', icon: ScrollText, href: '/dashboard/logs' },
  { value: 'maintenance', label: 'Maintenance', icon: Construction, href: '/dashboard/maintenance' },
]

const pick = (...values: string[]): AdminNavItem[] =>
  values.map((value) => {
    const item = ADMIN_NAV_ITEMS.find((candidate) => candidate.value === value)
    if (!item) throw new Error(`Unknown admin navigation item: ${value}`)
    return item
  })

// Grouped navigation: sidebar. The most used pages come first in each group.
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { id: 'events', label: 'Événements', icon: Calendar, items: pick('events', 'races', 'obstacles') },
  {
    id: 'commerce',
    label: 'Billetterie',
    icon: ShoppingCart,
    items: pick('participants', 'orders', 'tickets', 'promocodes', 'promotions', 'upsells', 'b2b-quotes'),
  },
  {
    id: 'community',
    label: 'Communauté',
    icon: Users,
    items: pick('ambassadors', 'groups', 'bootcamps', 'users', 'checkin', 'volunteers'),
  },
  { id: 'communication', label: 'Communication', icon: MessageSquare, items: pick('emails', 'distribution-lists', 'lucky-wheel') },
  { id: 'system', label: 'Système', icon: Settings2, items: pick('logs', 'maintenance') },
]

/**
 * The page a pathname belongs to. Event sub-pages belong to their own entry (participants, tickets),
 * not to "Événements", so the sidebar highlights where the admin actually is.
 */
export function resolveActiveNavValue(pathname: string): string | undefined {
  if (pathname === '/dashboard') return 'overview'
  if (/^\/dashboard\/events\/[^/]+\/participants/.test(pathname)) return 'participants'
  if (/^\/dashboard\/events\/[^/]+\/tickets/.test(pathname)) return 'tickets'
  return ADMIN_NAV_ITEMS.filter((item) => item.href !== '/dashboard')
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.value
}

