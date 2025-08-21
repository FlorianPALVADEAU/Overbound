/* eslint-disable react/no-unescaped-entities */
// src/app/admin/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import Link from 'next/link'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createSupabaseServer()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Récupérer le profil avec le rôle
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'volunteer'].includes(profile.role)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground mb-4">
              Tu n'as pas les permissions nécessaires pour accéder à cette page.
            </p>
            <Link href="/account">
              <Button>Retour au compte</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  let stats = null
  
  // Récupérer les statistiques uniquement pour les admins
  if (profile.role === 'admin') {
    // Essayer d'abord admin_overview, puis admin_overview_safe en cas d'erreur
    const { data: statsData, error: statsError } = await supabase.rpc('admin_overview')
    
    if (statsError) {
      console.log('Tentative avec admin_overview_safe...', statsError.message)
      const { data: safeStatsData, error: safeStatsError } = await supabase.rpc('admin_overview_safe')
      
      if (safeStatsError) {
        console.error('Erreur stats (safe):', safeStatsError)
      } else {
        stats = safeStatsData
      }
    } else {
      stats = statsData
    }
  }

  return (
    <AdminDashboard 
      user={user} 
      profile={profile} 
      stats={stats} 
    />
  )
}