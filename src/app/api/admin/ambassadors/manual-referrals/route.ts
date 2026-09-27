import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { getCurrentProgramYear } from '@/lib/ambassadors/rewardLifecycle'

export const runtime = 'nodejs'

const payloadSchema = z.object({
  ambassador_id: z.string().uuid(),
  referral_email: z.string().email(),
  points: z.number().int().min(1).max(10).default(1),
  race_format: z.enum(['auto', 'open', 'ranked']).default('auto'),
})

const resolveRaceFormat = (operationsConfig: { departure_mode?: string } | null | undefined) =>
  operationsConfig?.departure_mode === 'fixed' ? 'ranked' : 'open'

const normalizeText = (value: string | null | undefined) => String(value || '').toLowerCase()

async function handlePost(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = payloadSchema.parse(await request.json())
    const admin = supabaseAdmin()

    const { data: ambassador } = await admin
      .from('ambassadors')
      .select('id')
      .eq('id', payload.ambassador_id)
      .maybeSingle()

    if (!ambassador) {
      return NextResponse.json({ error: 'Ambassadeur introuvable.' }, { status: 404 })
    }

    const { data: registration, error: registrationError } = await admin
      .from('registrations')
      .select('id, order_id, ticket_id, email')
      .ilike('email', payload.referral_email.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (registrationError) {
      console.error('[admin ambassadors manual referral] registration lookup error', registrationError)
      return NextResponse.json({ error: 'Erreur recherche inscription.' }, { status: 500 })
    }

    if (!registration?.id) {
      return NextResponse.json({ error: 'Aucune inscription trouvée pour cet email.' }, { status: 404 })
    }

    const { data: existingManualReferral } = await admin
      .from('ambassador_manual_referrals')
      .select('id')
      .eq('ambassador_id', payload.ambassador_id)
      .eq('registration_id', registration.id)
      .maybeSingle()

    if (!existingManualReferral) {
      const { error: manualInsertError } = await admin
        .from('ambassador_manual_referrals')
        .insert({
          ambassador_id: payload.ambassador_id,
          registration_id: registration.id,
        })

      if (manualInsertError) {
        if (manualInsertError.code === '23505') {
          // Another request recorded the same manual referral first. Continue
          // to the points ledger, whose unique key provides the idempotence
          // guarantee for the credit itself.
        } else {
          console.error('[admin ambassadors manual referral] insert manual referral error', manualInsertError)
          return NextResponse.json({ error: 'Impossible d’ajouter le filleul manuel.' }, { status: 500 })
        }
      }
    }

    const { data: existingPointEvent } = await admin
      .from('ambassador_points_events')
      .select('id')
      .eq('ambassador_id', payload.ambassador_id)
      .eq('registration_id', registration.id)
      .maybeSingle()

    let pointsCredited = 0
    let raceFormat: 'open' | 'ranked' = 'open'

    if (!existingPointEvent) {
      const { data: ticketRow } = await admin
        .from('tickets')
        .select('operations_config')
        .eq('id', registration.ticket_id)
        .maybeSingle()

      raceFormat = payload.race_format === 'auto'
        ? resolveRaceFormat(ticketRow?.operations_config)
        : payload.race_format

      const { error: insertPointEventError } = await admin
        .from('ambassador_points_events')
        .insert({
          ambassador_id: payload.ambassador_id,
          order_id: registration.order_id,
          registration_id: registration.id,
          race_format: raceFormat,
          points: payload.points,
          program_year: getCurrentProgramYear(),
        })

      if (insertPointEventError) {
        // A concurrent request may have credited the same registration. The
        // unique key is the source of truth; report it as idempotent instead
        // of applying points twice.
        if (insertPointEventError.code === '23505') {
          return NextResponse.json({
            success: true,
            registration_id: registration.id,
            email: registration.email,
            points_credited: 0,
            already_credited: true,
          })
        }
        console.error('[admin ambassadors manual referral] insert point event error', insertPointEventError)
        return NextResponse.json({ error: 'Impossible de créditer les points.' }, { status: 500 })
      }

      // Recompute from the immutable events ledger instead of read-modify-
      // writing an aggregate. This prevents lost updates when two manual
      // referrals are credited at the same time.
      const { data: pointEvents, error: pointEventsError } = await admin
        .from('ambassador_points_events')
        .select('points, race_format, program_year')
        .eq('ambassador_id', payload.ambassador_id)
        .eq('program_year', getCurrentProgramYear())

      if (pointEventsError) {
        console.error('[admin ambassadors manual referral] points ledger error', pointEventsError)
        return NextResponse.json({ error: 'Impossible de recalculer les points.' }, { status: 500 })
      }

      const nextTotal = (pointEvents ?? []).reduce((sum, event) => sum + Number(event.points ?? 0), 0)
      const nextOpen = (pointEvents ?? []).filter((event) => normalizeText(event.race_format) === 'open').length
      const nextRanked = (pointEvents ?? []).filter((event) => normalizeText(event.race_format) === 'ranked').length

      const { data: rewardLevel, error: rewardLevelError } = await admin.rpc(
        'ambassador_reward_level_for_points',
        { p_total_points: nextTotal },
      )

      if (rewardLevelError) {
        console.error('[admin ambassadors manual referral] reward level error', rewardLevelError)
        return NextResponse.json({ error: 'Impossible de calculer le palier.' }, { status: 500 })
      }

      const { error: updatePointsError } = await admin
        .from('ambassador_points_years')
        .upsert(
          {
            ambassador_id: payload.ambassador_id,
            program_year: getCurrentProgramYear(),
            total_points: nextTotal,
            recruits_open: nextOpen,
            recruits_ranked: nextRanked,
            current_reward_level: Number(rewardLevel ?? 0),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'ambassador_id,program_year' },
        )

      if (updatePointsError) {
        console.error('[admin ambassadors manual referral] update points error', updatePointsError)
        return NextResponse.json({ error: 'Impossible de mettre à jour le total des points.' }, { status: 500 })
      }

      const { error: legacyPointsError } = await admin
        .from('ambassador_points')
        .upsert({
          ambassador_id: payload.ambassador_id,
          total_points: nextTotal,
          recruits_open: nextOpen,
          recruits_ranked: nextRanked,
          current_reward_level: Number(rewardLevel ?? 0),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'ambassador_id' })

      if (legacyPointsError) {
        console.error('[admin ambassadors manual referral] legacy points sync error', legacyPointsError)
        return NextResponse.json({ error: 'Impossible de synchroniser les points.' }, { status: 500 })
      }

      const { error: rewardsError } = await admin.rpc('ambassador_ensure_rewards', { p_ambassador_id: payload.ambassador_id })
      if (rewardsError) {
        console.error('[admin ambassadors manual referral] ensure rewards error', rewardsError)
        return NextResponse.json({ error: 'Impossible de synchroniser les récompenses.' }, { status: 500 })
      }
      pointsCredited = payload.points
    }

    return NextResponse.json({
      success: true,
      registration_id: registration.id,
      email: registration.email,
      points_credited: pointsCredited,
      already_credited: Boolean(existingPointEvent),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('[admin ambassadors manual referral] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Ajout filleul manuel ambassadeur',
})
