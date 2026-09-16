import { NextResponse } from 'next/server'
import { sendAdminPushNotification } from '@/lib/push'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
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
