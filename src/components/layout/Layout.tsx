import { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { createSupabaseServer } from '@/lib/supabase/server'

interface LayoutProps {
  children: ReactNode
}

export async function Layout({ children }: LayoutProps) {
  const supabase = await createSupabaseServer()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} profile={profile} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}