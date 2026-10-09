'use client'

import { ReactNode, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useSelectedLayoutSegment } from 'next/navigation'
import { MaintenanceBanner } from './MaintenanceBanner'
import { Header } from './Header'
import { Footer } from './Footer'
import { PromotionsBanner } from './PromotionsBanner'
import { useSession, SESSION_QUERY_KEY, type SessionResponse } from '@/app/api/session/sessionQueries'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { CookieConsentBanner } from '@/components/consent/CookieConsentBanner'
import type { Session } from '@supabase/supabase-js'
import { PopupArbiterProvider } from '@/components/popups/PopupArbiterProvider'
import { GlobalLuckyWheelWidget } from '@/components/lucky-wheel/GlobalLuckyWheelWidget'

interface LayoutProps {
  children: ReactNode
}

const PopupPromotion = dynamic(
  () => import('@/components/promotions/PopupPromotion').then((module) => module.PopupPromotion),
  { ssr: false }
)

export function Layout({ children }: LayoutProps) {
  const { data, isLoading } = useSession()
  const queryClient = useQueryClient()
  // The account area has its own fixed bottom navigation; the site footer would sit underneath it on mobile.
  const isAccountArea = usePathname()?.startsWith('/account') ?? false
  // Segment (not URL): the maintenance screen is served by a rewrite, so the URL is the visitor's original one.
  const isMaintenanceScreen = useSelectedLayoutSegment() === 'maintenance'
  const supabase = createSupabaseBrowser()

  const seedSessionCache = useCallback((session: Session | null) => {
    const user = session?.user ?? null
    queryClient.setQueryData<SessionResponse>(SESSION_QUERY_KEY, (previous) => ({
      user: user
        ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            user_metadata: user.user_metadata,
          }
        : null,
      profile:
        user && previous?.user?.id === user.id && previous?.profile
          ? previous.profile
          : user
            ? {
                full_name:
                  (user.user_metadata as Record<string, unknown> | undefined)?.full_name as
                    | string
                    | null
                    | undefined,
                avatar_url:
                  (user.user_metadata as Record<string, unknown> | undefined)?.avatar_url as
                    | string
                    | null
                    | undefined,
              }
            : null,
      alerts: previous?.alerts ?? null,
    }))
  }, [queryClient])

  const syncPostAuthData = useCallback(async (userId: string) => {
    const storageKey = `post-auth-sync:${userId}`
    const syncStatus = sessionStorage.getItem(storageKey)
    if (syncStatus === 'done' || syncStatus === 'pending') {
      return
    }

    sessionStorage.setItem(storageKey, 'pending')

    try {
      const response = await fetch('/api/auth/post-auth-sync', { method: 'POST' })
      if (!response.ok) {
        throw new Error('post-auth sync failed')
      }
      sessionStorage.setItem(storageKey, 'done')
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    } catch (error) {
      console.warn('[layout] post-auth sync failed', error)
      sessionStorage.removeItem(storageKey)
    }
  }, [queryClient])

  // Listen to auth state changes and invalidate session cache
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        seedSessionCache(session)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        seedSessionCache(session)

        const userId = session?.user?.id
        if (userId && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
          void syncPostAuthData(userId)
        }
      }

      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, seedSessionCache, syncPostAuthData, queryClient])

  if (isMaintenanceScreen) return <>{children}</>

  return (
    <PopupArbiterProvider>
      <div className="flex min-h-screen flex-col">
        <MaintenanceBanner isAdmin={data?.profile?.role === 'admin'} />
        <Header
          user={data?.user ?? null}
          profile={data?.profile ?? null}
          alerts={data?.alerts ?? null}
          isLoading={isLoading}
        />
        <PromotionsBanner />
        <main className="flex-1">{children}</main>
        <div className={isAccountArea ? 'hidden md:block' : undefined}>
          <Footer />
        </div>
        <CookieConsentBanner />
        {/* Popup promotion for non-authenticated users */}
        <PopupPromotion isAuthenticated={!!data?.user} />
        {/* FDR-0015 §7.1: Lucky Wheel is site-wide, not just on event pages
            -- it resolves its own event from context (the current event
            page, or the featured event elsewhere). */}
        <GlobalLuckyWheelWidget />
      </div>
    </PopupArbiterProvider>
  )
}
