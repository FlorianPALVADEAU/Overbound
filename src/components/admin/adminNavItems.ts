'use client'

import {
  BarChart3,
  Calendar,
  Trophy,
  Zap,
  Ticket,
  Percent,
  Package,
  Users,
  UserCheck,
  ScrollText,
  Mail,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AdminTabValue } from '@/store/useAdminDashboardStore'

interface AdminNavItem {
  value: AdminTabValue
  label: string
  icon: LucideIcon
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { value: 'overview', label: 'Tableau de bord', icon: BarChart3 },
  { value: 'events', label: 'Événements', icon: Calendar },
  { value: 'races', label: 'Courses', icon: Trophy },
  { value: 'obstacles', label: 'Obstacles', icon: Zap },
  { value: 'tickets', label: 'Tickets', icon: Ticket },
  { value: 'promocodes', label: 'Codes promo', icon: Percent },
  { value: 'upsells', label: 'Upsells', icon: Package },
  { value: 'members', label: 'Membres', icon: Users },
  { value: 'checkin', label: 'Check-in', icon: UserCheck },
  { value: 'logs', label: 'Logs', icon: ScrollText },
  { value: 'emails', label: 'Emails', icon: Mail },
]
