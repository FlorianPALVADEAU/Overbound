import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const runtime = 'nodejs'

const payloadSchema = z.object({
  ambassador_id: z.string().uuid(),
  referral_email: z.string().email(),
  points: z.number().int().min(1).max(10).default(1),
  race_format: z.enum(['auto', 'open', 'ranked']).default('auto'),
})

/**
 * Credits a referral the code did not capture. The credit, the aggregate and the rewards are one
 * database command (admin_credit_manual_referral), so a retry or a concurrent call cannot double it.
 */
async function handlePost(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = payloadSchema.parse(await request.json())
    const admin = supabaseAdmin()

    const { data: ambassador } = await admin.from('ambassadors').select('id').eq('id', payload.ambassador_id).maybeSingle()
    if (!ambassador) {
      return NextResponse.json({ error: 'Ambassadeur introuvable.' }, { status: 404 })
    }

    const { data: registration, error: registrationError } = await admin
      .from('registrations')
      .select('id, email')
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

    const { data: credited, error: creditError } = await admin.rpc('admin_credit_manual_referral', {
      p_ambassador_id: payload.ambassador_id,
      p_registration_id: registration.id,
      p_points: payload.points,
      p_race_format: payload.race_format === 'auto' ? null : payload.race_format,
    })
    if (creditError) {
      console.error('[admin ambassadors manual referral] credit error', creditError)
      return NextResponse.json({ error: 'Impossible de créditer les points.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      registration_id: registration.id,
      email: registration.email,
      points_credited: credited ? payload.points : 0,
      already_credited: !credited,
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
