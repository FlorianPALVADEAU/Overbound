'use client'

import { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { PromotionsBanner } from './PromotionsBanner'
import { useSession } from '@/app/api/session/sessionQueries'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { data, isLoading } = useSession()
  
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
    </div>
  )
}
