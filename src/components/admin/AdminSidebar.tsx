'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ADMIN_NAV_ITEMS } from './adminNavItems'
import { useAdminDashboardStore } from '@/store/useAdminDashboardStore'
import type { AdminTabValue } from '@/store/useAdminDashboardStore'

interface AdminSidebarProps {
  profileRole: 'admin' | 'volunteer'
  fullName?: string | null
}

export function AdminSidebar({ profileRole, fullName }: AdminSidebarProps) {
  const { activeTab, setActiveTab } = useAdminDashboardStore()

  const handleSelect = (value: AdminTabValue) => {
    setActiveTab(value)
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="p-6 border-b">
        <p className="text-sm font-medium text-muted-foreground">Connecté en tant que</p>
        <p className="text-lg font-semibold">{fullName || 'Administrateur'}</p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mt-1">
          {profileRole === 'admin' ? 'Administrateur' : 'Bénévole'}
        </p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {ADMIN_NAV_ITEMS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => handleSelect(item.value)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              activeTab === item.value
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Retour au site
        </Link>
      </div>
    </aside>
  )
}
