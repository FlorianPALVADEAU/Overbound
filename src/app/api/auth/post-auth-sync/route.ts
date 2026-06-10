import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { runPostAuthSync } from '@/lib/auth/postAuthSync'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    await runPostAuthSync(user)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[post-auth-sync] error', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
