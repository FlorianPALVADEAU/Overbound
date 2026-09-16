import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin(request)
    if (!adminAuth.ok) {
      return adminAuth.response
    }
    const user = adminAuth.user

    const payload = await request.json().catch(() => null)
    const endpoint = payload?.endpoint
    const keys = payload?.keys
    const p256dh = keys?.p256dh
    const pushAuth = keys?.auth

    if (!endpoint || !p256dh || !pushAuth) {
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
        auth: pushAuth,
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
