import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { loadAmbassadorHistory } from '@/lib/admin/ambassadors/loadAmbassadorHistory'

export const runtime = 'nodejs'

/** Point corrections and reward decisions made by hand on one ambassador, newest first. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    return NextResponse.json(await loadAmbassadorHistory(supabaseAdmin(), id))
  } catch (error) {
    console.error('[admin ambassador history] error', error)
    return NextResponse.json({ error: 'Impossible de charger l’historique.' }, { status: 500 })
  }
}
