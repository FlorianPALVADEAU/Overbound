import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import { loadAdminOverview } from '@/lib/admin/overviewLoader'

const querySchema = z.object({ event: z.string().uuid().optional() })

/** Figures and to-do list of the back-office landing page, for all events or the one selected. */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) return auth.response

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
    if (!parsed.success) return NextResponse.json({ error: 'Événement invalide' }, { status: 400 })

    const overview = await loadAdminOverview(supabaseAdmin(), {
      organizationId: auth.organizationId,
      eventId: parsed.data.event ?? null,
    })
    if (!overview) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

    return NextResponse.json({ overview }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[admin-overview] fetch error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
