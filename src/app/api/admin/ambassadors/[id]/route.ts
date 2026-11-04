import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { loadAmbassadorSheet } from '@/lib/admin/ambassadors/loadAmbassadorSheet'
import { parseSeasonParam } from '@/lib/admin/ambassadors/seasonParam'

export const runtime = 'nodejs'

/** The sheet of one ambassador for one season: totals, ladder with rewards, bonus bibs and code. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const season = parseSeasonParam(request.nextUrl.searchParams.get('year'))
    const sheet = await loadAmbassadorSheet(supabaseAdmin(), id, season)
    if (!sheet) return NextResponse.json({ error: 'Ambassadeur introuvable.' }, { status: 404 })
    return NextResponse.json(sheet)
  } catch (error) {
    console.error('[admin ambassadors] sheet error', error)
    return NextResponse.json({ error: 'Impossible de charger la fiche ambassadeur.' }, { status: 500 })
  }
}
