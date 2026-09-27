import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

// FDR-0014 §10: PAUSE CAMPAIGN emergency control. Toggles `paused` only --
// never touches `enabled`, trigger rules, rewards, or existing allocations.
// lucky_wheel_spin checks `paused` first, before any other logic.
const pauseSchema = z.object({
  paused: z.boolean(),
})

const handlePost = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const parsed = pauseSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const { data: campaign, error } = await admin
      .from('lucky_wheel_campaigns')
      .update({ paused: parsed.data.paused, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, enabled, paused')
      .single()

    if (error) throw error

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Erreur PAUSE lucky wheel campaign:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Pause/reprise campagne Lucky Wheel',
})
