import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'
import { loadAccountStats } from '@/lib/account/loadAccountStats'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const user = await resolveRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const stats = await loadAccountStats(supabaseAdmin(), { id: user.id, email: user.email })
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[account stats] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
