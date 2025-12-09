'use client'

import { ReactNode, useEffect } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { PromotionsBanner } from './PromotionsBanner'
import { PopupPromotion } from '@/components/promotions/PopupPromotion'
import { useSession, SESSION_QUERY_KEY } from '@/app/api/session/sessionQueries'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { data, isLoading } = useSession()
  const queryClient = useQueryClient()
  const supabase = createSupabaseBrowser()

  // Listen to auth state changes and invalidate session cache
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, queryClient])

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
      {/* Popup promotion for non-authenticated users */}
      <PopupPromotion isAuthenticated={!!data?.user} />
    </div>
  )
}
