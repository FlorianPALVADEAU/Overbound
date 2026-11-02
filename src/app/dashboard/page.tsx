'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminOverview } from '@/components/admin/overview/AdminOverview'
import { resolveLegacyTabRoute } from '@/lib/admin/legacyTabRoutes'

function DashboardHome() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const legacyRoute = resolveLegacyTabRoute(searchParams)

  // Links from e-mails and notifications sent before the tabs became pages.
  useEffect(() => {
    if (legacyRoute) router.replace(legacyRoute)
  }, [legacyRoute, router])

  if (legacyRoute) return <p className="text-sm text-muted-foreground">Redirection…</p>
  return <AdminOverview eventId={searchParams.get('event')} />
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardHome />
    </Suspense>
  )
}
