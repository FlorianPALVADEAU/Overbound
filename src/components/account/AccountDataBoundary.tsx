'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  useAccountRegistrations,
  type AccountRegistrationsResponse,
} from '@/app/api/account/registrations/accountRegistrationsQueries'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountScreen } from '@/components/account/AccountScreen'

export type AuthenticatedAccountData = AccountRegistrationsResponse & {
  user: NonNullable<AccountRegistrationsResponse['user']>
}

const isAuthError = (message: string | undefined) => Boolean(message?.toLowerCase().includes('non authentifi'))

function AccountSkeleton() {
  return (
    <AccountScreen>
      <div className="space-y-8" aria-busy="true" aria-label="Chargement">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-72 w-full rounded-[22px]" />
        <Skeleton className="h-14 w-full" />
      </div>
    </AccountScreen>
  )
}

/**
 * Single place for the loading / error / signed-out states of every account
 * screen. Children only ever render with an authenticated user.
 */
export function AccountDataBoundary({ children }: { children: (data: AuthenticatedAccountData) => ReactNode }) {
  const router = useRouter()
  const { data, isLoading, error, refetch } = useAccountRegistrations()
  const signedOut = isAuthError(error?.message) || (!isLoading && !error && !data?.user)

  useEffect(() => {
    if (!signedOut) return
    const next = `${window.location.pathname}${window.location.search}`
    router.replace(`/auth/login?next=${encodeURIComponent(next)}`)
  }, [signedOut, router])

  if (isLoading || signedOut) return <AccountSkeleton />

  if (error || !data?.user) {
    return (
      <AccountScreen>
        <div className="space-y-4 py-16 text-center">
          <p className="text-lg font-bold">Impossible de charger ton compte</p>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
          <Button onClick={() => refetch()} className="h-11 px-6">
            Réessayer
          </Button>
        </div>
      </AccountScreen>
    )
  }

  return <>{children({ ...data, user: data.user })}</>
}
