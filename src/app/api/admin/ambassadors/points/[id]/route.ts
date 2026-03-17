import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

export const runtime = 'nodejs'

const payloadSchema = z.object({
  total_points: z.number().int().min(0),
  recruits_open: z.number().int().min(0),
  recruits_ranked: z.number().int().min(0),
})

async function handlePatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params
    const payload = payloadSchema.parse(await request.json())

    const admin = supabaseAdmin()

    const { data: rewardLevel, error: rewardLevelError } = await admin
      .rpc('ambassador_reward_level_for_points', { p_total_points: payload.total_points })

    if (rewardLevelError) {
      console.error('[admin ambassadors points] reward level error', rewardLevelError)
      return NextResponse.json({ error: 'Impossible de calculer le palier.' }, { status: 500 })
    }

    const { data: updated, error } = await admin
      .from('ambassador_points')
      .upsert({
        ambassador_id: id,
        total_points: payload.total_points,
        recruits_open: payload.recruits_open,
        recruits_ranked: payload.recruits_ranked,
        current_reward_level: Number(rewardLevel ?? 0),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'ambassador_id' })
      .select('ambassador_id, total_points, recruits_open, recruits_ranked, current_reward_level')
      .single()

    if (error || !updated) {
      console.error('[admin ambassadors points] update error', error)
      return NextResponse.json({ error: 'Impossible de mettre à jour les points.' }, { status: 500 })
    }

    await admin.rpc('ambassador_ensure_rewards', { p_ambassador_id: id })

    return NextResponse.json({ points: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('[admin ambassadors points] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PATCH = withRequestLogging(handlePatch, {
  actionType: 'Mise à jour points ambassadeur admin',
})
