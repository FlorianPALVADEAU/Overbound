import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { loadAmbassadorList } from '@/lib/admin/ambassadors/loadAmbassadorList'
import { parseSeasonParam } from '@/lib/admin/ambassadors/seasonParam'

export const runtime = 'nodejs'

/** Ambassador list of one season: totals, active code and the rewards waiting on the ambassador or the team. */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const season = parseSeasonParam(request.nextUrl.searchParams.get('year'))
    return NextResponse.json(await loadAmbassadorList(supabaseAdmin(), season))
  } catch (error) {
    console.error('[admin ambassadors] list error', error)
    return NextResponse.json({ error: 'Impossible de charger les ambassadeurs.' }, { status: 500 })
  }
}
