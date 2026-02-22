import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { sendAdminPushNotification } from '@/lib/push'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await sendAdminPushNotification({
      title: 'Test notification Overbound',
      body: 'Ta configuration Web Push fonctionne ✅',
      url: '/dashboard?tab=members',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[push] test error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
