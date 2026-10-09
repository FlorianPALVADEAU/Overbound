'use client'

import Link from 'next/link'
import { TriangleAlertIcon } from 'lucide-react'
import { useAdminMaintenance } from '@/app/api/admin/maintenance/maintenanceQueries'

/** Shown to admins only while maintenance is on, so they never mistake the open site for the public one. */
export function MaintenanceBanner({ isAdmin }: { isAdmin: boolean }) {
  const { data } = useAdminMaintenance({ enabled: isAdmin })
  if (!isAdmin || !data?.enabled) return null

  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-red-600 px-4 py-2 text-center text-sm font-bold text-white">
      <TriangleAlertIcon className="size-4 shrink-0" />
      <span>MAINTENANCE ACTIVE : le public ne voit que l&apos;écran de maintenance. Toi, tu vois le vrai site.</span>
      <Link href="/dashboard/maintenance" className="underline underline-offset-2">
        Gérer
      </Link>
    </div>
  )
}
