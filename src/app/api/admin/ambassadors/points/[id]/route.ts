import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { getCurrentProgramYear } from '@/lib/ambassadors/rewardLifecycle'

export const runtime = 'nodejs'

const payloadSchema = z.object({
  total_points: z.number().int().min(0),
  recruits_open: z.number().int().min(0),
  recruits_ranked: z.number().int().min(0),
  program_year: z.number().int().min(2020).max(2100).optional(),
  reason: z.string().trim().min(3).max(1000),
  idempotency_key: z.string().uuid(),
})

async function handlePatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const payload = payloadSchema.parse(await request.json())
    const programYear = payload.program_year ?? getCurrentProgramYear()

    const admin = supabaseAdmin()

    const { data: updated, error } = await admin
      .rpc('admin_adjust_ambassador_points', {
        p_ambassador_id: id,
        p_program_year: programYear,
        p_total_points: payload.total_points,
        p_recruits_open: payload.recruits_open,
        p_recruits_ranked: payload.recruits_ranked,
        p_reason: payload.reason,
        p_actor_profile_id: auth.user.id,
        p_idempotency_key: payload.idempotency_key,
      })
      .single()

    if (error || !updated) {
      console.error('[admin ambassadors points] update error', error)
      if (error?.code === 'PGRST202') {
        return NextResponse.json(
          {
            error: 'La migration des corrections de points ambassadeurs n’est pas appliquée sur cette base.',
            code: 'AMBASSADOR_POINTS_MIGRATION_REQUIRED',
          },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: 'Impossible de mettre à jour les points.' }, { status: 500 })
    }

    if (programYear === getCurrentProgramYear()) {
      const { error: rewardsError } = await admin.rpc('ambassador_ensure_rewards', { p_ambassador_id: id })
      if (rewardsError) {
        console.error('[admin ambassadors points] ensure rewards error', rewardsError)
        return NextResponse.json({ error: 'Impossible de synchroniser les récompenses.' }, { status: 500 })
      }
    }

    return NextResponse.json({ points: updated, program_year: programYear })
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
