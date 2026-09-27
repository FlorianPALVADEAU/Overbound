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
  ScrollText,
  Mail,
  Megaphone,
  List,
  ShoppingCart,
  MessageSquare,
  Settings2,
  Dumbbell,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
export interface AdminNavItem {
  /**
   * Kept while old `/dashboard?tab=` links are still accepted.  New navigation
   * must use `href`, never this value as client-side navigation state.
   */
  value: string
  label: string
  icon: LucideIcon
  href: string
  requiresEventContext?: boolean
}

export interface AdminNavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: AdminNavItem[]
}

// Flat list — used for mobile select, breadcrumbs, etc.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { value: 'overview', label: 'Tableau de bord', icon: BarChart3, href: '/dashboard' },
  { value: 'events', label: 'Événements', icon: Calendar, href: '/dashboard/events' },
  { value: 'races', label: 'Courses', icon: Trophy, href: '/dashboard/races' },
  { value: 'obstacles', label: 'Obstacles', icon: Zap, href: '/dashboard/obstacles' },
  { value: 'tickets', label: 'Tickets', icon: Ticket, href: '/dashboard/tickets' },
  { value: 'promocodes', label: 'Codes promo', icon: Percent, href: '/dashboard/promocodes' },
  { value: 'promotions', label: 'Promotions', icon: Megaphone, href: '/dashboard/promotions' },
  { value: 'upsells', label: 'Upsells', icon: Package, href: '/dashboard/upsells' },
  { value: 'ambassadors', label: 'Ambassadeurs', icon: Medal, href: '/dashboard/ambassadors' },
  { value: 'groups', label: 'Groupes', icon: Users, href: '/dashboard/groups' },
  { value: 'bootcamps', label: 'Bootcamps', icon: Dumbbell, href: '/dashboard/bootcamps' },
  { value: 'users', label: 'Utilisateurs', icon: UserCog, href: '/dashboard/users' },
  { value: 'members', label: 'Membres', icon: Users, href: '/dashboard/members' },
  { value: 'checkin', label: 'Check-in', icon: UserCheck, href: '/dashboard/checkin', requiresEventContext: true },
  { value: 'logs', label: 'Logs', icon: ScrollText, href: '/dashboard/logs' },
  { value: 'emails', label: 'Emails', icon: Mail, href: '/dashboard/emails' },
  { value: 'distribution-lists', label: 'Listes de diffusion', icon: List, href: '/dashboard/distribution-lists' },
  { value: 'lucky-wheel', label: 'Lucky Wheel', icon: Sparkles, href: '/dashboard/lucky-wheel' },
]

// Grouped navigation — used for sidebar collapsible menus
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'events',
    label: 'Événements',
    icon: Calendar,
    items: [
      ADMIN_NAV_ITEMS[1], ADMIN_NAV_ITEMS[2], ADMIN_NAV_ITEMS[3],
    ],
  },
  {
    id: 'commerce',
    label: 'Billetterie',
    icon: ShoppingCart,
    items: [
      ADMIN_NAV_ITEMS[4], ADMIN_NAV_ITEMS[5], ADMIN_NAV_ITEMS[6], ADMIN_NAV_ITEMS[7],
    ],
  },
  {
    id: 'community',
    label: 'Communauté',
    icon: Users,
    items: [
      ADMIN_NAV_ITEMS[8], ADMIN_NAV_ITEMS[9], ADMIN_NAV_ITEMS[10], ADMIN_NAV_ITEMS[11], ADMIN_NAV_ITEMS[12], ADMIN_NAV_ITEMS[13],
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    items: [
      ADMIN_NAV_ITEMS[15], ADMIN_NAV_ITEMS[16], ADMIN_NAV_ITEMS[17],
    ],
  },
  {
    id: 'system',
    label: 'Système',
    icon: Settings2,
    items: [ADMIN_NAV_ITEMS[14]],
  },
]
