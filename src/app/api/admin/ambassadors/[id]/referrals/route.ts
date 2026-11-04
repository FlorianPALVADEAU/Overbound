import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { loadAmbassadorReferrals } from '@/lib/admin/ambassadors/loadAmbassadorReferrals'

export const runtime = 'nodejs'

const referralCommandSchema = z.object({
  referral_email: z.string().email(),
  points: z.number().int().min(1).max(10).default(1),
  race_format: z.enum(['auto', 'open', 'ranked']).default('auto'),
})

/** Referrals of the running season: who came through the codes, the token or a manual credit. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const referrals = await loadAmbassadorReferrals(supabaseAdmin(), id)
    if (!referrals) return NextResponse.json({ error: 'Ambassadeur introuvable.' }, { status: 404 })
    return NextResponse.json({ referrals })
  } catch (error) {
    console.error('[admin ambassador referrals] list error', error)
    return NextResponse.json({ error: 'Impossible de charger les filleuls.' }, { status: 500 })
  }
}

/**
 * Credits a referral the code did not capture. The credit, the aggregate and the rewards are one
 * database command (admin_credit_manual_referral), so a retry or a concurrent call cannot double it.
 */
async function handlePost(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const parsed = referralCommandSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.issues }, { status: 400 })
    }

    const payload = parsed.data
    const admin = supabaseAdmin()

    const { data: ambassador } = await admin.from('ambassadors').select('id').eq('id', id).maybeSingle()
    if (!ambassador) return NextResponse.json({ error: 'Ambassadeur introuvable.' }, { status: 404 })

    const { data: registration, error: registrationError } = await admin
      .from('registrations')
      .select('id, email')
      .ilike('email', payload.referral_email.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (registrationError) {
      console.error('[admin ambassador referrals] registration lookup error', registrationError)
      return NextResponse.json({ error: 'Erreur recherche inscription.' }, { status: 500 })
    }
    if (!registration?.id) {
      return NextResponse.json({ error: 'Aucune inscription trouvée pour cet email.' }, { status: 404 })
    }

    const { data: credited, error: creditError } = await admin.rpc('admin_credit_manual_referral', {
      p_ambassador_id: id,
      p_registration_id: registration.id,
      p_points: payload.points,
      p_race_format: payload.race_format === 'auto' ? null : payload.race_format,
    })
    if (creditError) {
      console.error('[admin ambassador referrals] credit error', creditError)
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
    console.error('[admin ambassador referrals] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Ajout filleul manuel ambassadeur',
})
