import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
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

    const payload = await request.json().catch(() => null)
    const endpoint = payload?.endpoint
    const keys = payload?.keys
    const p256dh = keys?.p256dh
    const auth = keys?.auth

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const { error } = await admin
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        email: user.email ?? null,
        endpoint,
        p256dh,
        auth,
      }, { onConflict: 'endpoint' })

    if (error) {
      console.error('[push] subscribe error', error)
      return NextResponse.json({ error: 'Impossible de sauvegarder l’abonnement' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[push] subscribe error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
