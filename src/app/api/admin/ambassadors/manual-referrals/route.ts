import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

export const runtime = 'nodejs'

const payloadSchema = z.object({
  ambassador_id: z.string().uuid(),
  referral_email: z.string().email(),
  points: z.number().int().min(1).max(10).default(1),
  race_format: z.enum(['auto', 'open', 'ranked']).default('auto'),
})

const normalizeText = (value: string | null | undefined) => String(value || '').toLowerCase()

const detectRaceFormat = (ticketName: string | null | undefined, raceName: string | null | undefined) => {
  const merged = `${normalizeText(ticketName)} ${normalizeText(raceName)}`
  if (merged.includes('ranked')) return 'ranked'
  if (merged.includes('open')) return 'open'
  return 'open'
}

async function ensureAdmin(request: NextRequest) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  return { user }
}

async function handlePost(request: NextRequest) {
  try {
    const { error: authError } = await ensureAdmin(request)
    if (authError) return authError

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
        console.error('[admin ambassadors manual referral] insert manual referral error', manualInsertError)
        return NextResponse.json({ error: 'Impossible d’ajouter le filleul manuel.' }, { status: 500 })
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
        .select('name, race:races(name)')
        .eq('id', registration.ticket_id)
        .maybeSingle()

      raceFormat = payload.race_format === 'auto'
        ? detectRaceFormat(ticketRow?.name, (ticketRow as any)?.race?.name)
        : payload.race_format

      const { error: insertPointEventError } = await admin
        .from('ambassador_points_events')
        .insert({
          ambassador_id: payload.ambassador_id,
          order_id: registration.order_id,
          registration_id: registration.id,
          race_format: raceFormat,
          points: payload.points,
        })

      if (insertPointEventError) {
        console.error('[admin ambassadors manual referral] insert point event error', insertPointEventError)
        return NextResponse.json({ error: 'Impossible de créditer les points.' }, { status: 500 })
      }

      const { data: currentPoints } = await admin
        .from('ambassador_points')
        .select('total_points, recruits_open, recruits_ranked')
        .eq('ambassador_id', payload.ambassador_id)
        .maybeSingle()

      const nextTotal = Number(currentPoints?.total_points ?? 0) + payload.points
      const nextOpen = Number(currentPoints?.recruits_open ?? 0) + (raceFormat === 'open' ? 1 : 0)
      const nextRanked = Number(currentPoints?.recruits_ranked ?? 0) + (raceFormat === 'ranked' ? 1 : 0)

      const { data: rewardLevel, error: rewardLevelError } = await admin.rpc(
        'ambassador_reward_level_for_points',
        { p_total_points: nextTotal },
      )

      if (rewardLevelError) {
        console.error('[admin ambassadors manual referral] reward level error', rewardLevelError)
        return NextResponse.json({ error: 'Impossible de calculer le palier.' }, { status: 500 })
      }

      const { error: updatePointsError } = await admin
        .from('ambassador_points')
        .upsert(
          {
            ambassador_id: payload.ambassador_id,
            total_points: nextTotal,
            recruits_open: nextOpen,
            recruits_ranked: nextRanked,
            current_reward_level: Number(rewardLevel ?? 0),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'ambassador_id' },
        )

      if (updatePointsError) {
        console.error('[admin ambassadors manual referral] update points error', updatePointsError)
        return NextResponse.json({ error: 'Impossible de mettre à jour le total des points.' }, { status: 500 })
      }

      await admin.rpc('ambassador_ensure_rewards', { p_ambassador_id: payload.ambassador_id })
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

