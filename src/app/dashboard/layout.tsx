'use client'

import { redirect } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { AdminShell } from '@/components/admin/AdminShell'
import { VolunteerAccessControl } from '@/components/admin/VolunteerAccessControl'
import { VolunteerHelpContact } from '@/components/admin/VolunteerHelpContact'
import { useSession } from '@/app/api/session/sessionQueries'

const Loading = () => (
  <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Chargement…</main>
)

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)
  const [profileRetryCount, setProfileRetryCount] = useState(0)
  const { data: session, isLoading, isFetching, refetch } = useSession()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!session?.user || session.profile?.role || profileRetryCount >= 2) return
    const retryTimer = window.setTimeout(() => {
      setProfileRetryCount((count) => count + 1)
      void refetch()
    }, 300)
    return () => window.clearTimeout(retryTimer)
  }, [profileRetryCount, refetch, session?.profile?.role, session?.user])

  // A background refetch (window focus, retry) must not unmount the page: it would drop open dialogs, filters and drafts.
  if (!hasMounted || isLoading || (isFetching && !session) || (session?.user && !session.profile?.role && profileRetryCount < 2)) return <Loading />
  if (!session?.user) redirect('/auth/login?next=/dashboard')
  if (session.profile?.role === 'volunteer') {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-xl space-y-6">
          <VolunteerAccessControl />
          <VolunteerHelpContact />
        </div>
      </main>
    )
  }
  if (session.profile?.role !== 'admin') redirect('/account')

  return (
    <AdminShell fullName={session.profile.full_name || session.user.email}>
      {children}
    </AdminShell>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
