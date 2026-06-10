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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AdminTabValue } from '@/store/useAdminDashboardStore'

export interface AdminNavItem {
  value: AdminTabValue
  label: string
  icon: LucideIcon
}

export interface AdminNavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: AdminNavItem[]
}

// Flat list — used for mobile select, breadcrumbs, etc.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { value: 'overview', label: 'Tableau de bord', icon: BarChart3 },
  { value: 'events', label: 'Événements', icon: Calendar },
  { value: 'races', label: 'Courses', icon: Trophy },
  { value: 'obstacles', label: 'Obstacles', icon: Zap },
  { value: 'tickets', label: 'Tickets', icon: Ticket },
  { value: 'promocodes', label: 'Codes promo', icon: Percent },
  { value: 'promotions', label: 'Promotions', icon: Megaphone },
  { value: 'upsells', label: 'Upsells', icon: Package },
  { value: 'ambassadors', label: 'Ambassadeurs', icon: Medal },
  { value: 'groups', label: 'Groupes', icon: Users },
  { value: 'bootcamps', label: 'Bootcamps', icon: Dumbbell },
  { value: 'users', label: 'Utilisateurs', icon: UserCog },
  { value: 'members', label: 'Membres', icon: Users },
  { value: 'checkin', label: 'Check-in', icon: UserCheck },
  { value: 'logs', label: 'Logs', icon: ScrollText },
  { value: 'emails', label: 'Emails', icon: Mail },
  { value: 'distribution-lists', label: 'Listes de diffusion', icon: List },
]

// Grouped navigation — used for sidebar collapsible menus
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'events',
    label: 'Événements',
    icon: Calendar,
    items: [
      { value: 'events', label: 'Événements', icon: Calendar },
      { value: 'races', label: 'Courses', icon: Trophy },
      { value: 'obstacles', label: 'Obstacles', icon: Zap },
    ],
  },
  {
    id: 'commerce',
    label: 'Billetterie',
    icon: ShoppingCart,
    items: [
      { value: 'tickets', label: 'Tickets', icon: Ticket },
      { value: 'promocodes', label: 'Codes promo', icon: Percent },
      { value: 'promotions', label: 'Promotions', icon: Megaphone },
      { value: 'upsells', label: 'Upsells', icon: Package },
    ],
  },
  {
    id: 'community',
    label: 'Communauté',
    icon: Users,
    items: [
      { value: 'ambassadors', label: 'Ambassadeurs', icon: Medal },
      { value: 'groups', label: 'Groupes', icon: Users },
      { value: 'bootcamps', label: 'Bootcamps', icon: Dumbbell },
      { value: 'users', label: 'Utilisateurs', icon: UserCog },
      { value: 'members', label: 'Membres', icon: Users },
      { value: 'checkin', label: 'Check-in', icon: UserCheck },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    items: [
      { value: 'emails', label: 'Emails', icon: Mail },
      { value: 'distribution-lists', label: 'Listes de diffusion', icon: List },
    ],
  },
  {
    id: 'system',
    label: 'Système',
    icon: Settings2,
    items: [{ value: 'logs', label: 'Logs', icon: ScrollText }],
  },
]
