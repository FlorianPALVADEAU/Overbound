'use client'

import { ReactNode, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Header } from './Header'
import { Footer } from './Footer'
import { PromotionsBanner } from './PromotionsBanner'
import { useSession, SESSION_QUERY_KEY, type SessionResponse } from '@/app/api/session/sessionQueries'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { CookieConsentBanner } from '@/components/consent/CookieConsentBanner'
import type { Session } from '@supabase/supabase-js'

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
      seedSessionCache(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        seedSessionCache(session)

        const userId = session?.user?.id
        if (userId && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
          void syncPostAuthData(userId)
        }
      }

      if (event === 'SIGNED_OUT') {
        seedSessionCache(null)
      }

      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, seedSessionCache, syncPostAuthData, queryClient])

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        user={data?.user ?? null}
        profile={data?.profile ?? null}
        alerts={data?.alerts ?? null}
        isLoading={isLoading}
      />
      <PromotionsBanner />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieConsentBanner />
      {/* Popup promotion for non-authenticated users */}
      <PopupPromotion isAuthenticated={!!data?.user} />
    </div>
  )
}
