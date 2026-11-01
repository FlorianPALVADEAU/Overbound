import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { hasAmbassadorAccess } from '@/lib/ambassadors/access'
import { sendAmbassadorRewardClaimRequestEmail } from '@/lib/ambassadors/email'
import { loadProgramRules } from '@/lib/ambassadors/programRules'
import { getRewardKind } from '@/lib/ambassadors/program'
import { claimAmbassadorReward, releaseAmbassadorRewardClaim, type ClaimFailure } from '@/lib/ambassadors/rewardClaims'
import { loadCurrentSeason } from '@/lib/ambassadors/season'
import type { AmbassadorReward } from '@/types/Ambassador'

export const runtime = 'nodejs'

const claimBodySchema = z.object({
  reward_level: z.number().int().positive(),
})

const FAILURES: Record<ClaimFailure, { status: number; error: string }> = {
  NOT_FOUND: { status: 404, error: 'Ce palier n’est pas encore débloqué.' },
  EXPIRED: { status: 409, error: 'Cette récompense a expiré à la fin de la saison.' },
  NOT_CLAIMABLE: { status: 409, error: 'Cette récompense ne peut pas être réclamée.' },
}

export async function POST(request: NextRequest) {
  try {
    const parsed = claimBodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'reward_level invalide.' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) {
      console.error('[ambassador rewards] profile error', profileError)
      return NextResponse.json({ error: 'Erreur profil' }, { status: 500 })
    }
    if (!hasAmbassadorAccess({ role: profile?.role ?? null, email: user.email ?? null })) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const admin = supabaseAdmin()
    const { data: ambassador, error: ambassadorError } = await admin
      .from('ambassadors')
      .select('id')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
    if (ambassadorError) {
      console.error('[ambassador rewards] ambassador error', ambassadorError)
      return NextResponse.json({ error: 'Erreur ambassadeur' }, { status: 500 })
    }
    if (!ambassador) {
      return NextResponse.json({ error: 'Ambassadeur introuvable.' }, { status: 404 })
    }

    // Only a reward of the running season can be claimed; archived ones are closed.
    const { season: programYear } = await loadCurrentSeason(admin)
    const claim = await claimAmbassadorReward(admin, {
      ambassadorId: ambassador.id,
      programYear,
      rewardLevel: parsed.data.reward_level,
    })
    if (!claim.ok) {
      const failure = FAILURES[claim.reason]
      return NextResponse.json({ error: failure.error }, { status: failure.status })
    }

    const { reward } = claim
    const { data: codeRow } = await admin
      .from('ambassador_promotional_codes')
      .select('promotional_code:promotional_codes(code)')
      .eq('ambassador_id', ambassador.id)
      .eq('is_current', true)
      .maybeSingle()
    const promotionalCode = Array.isArray(codeRow?.promotional_code) ? codeRow?.promotional_code[0] : codeRow?.promotional_code

    try {
      await sendAmbassadorRewardClaimRequestEmail({
        ambassadorName: profile?.full_name?.trim() || user.user_metadata?.full_name || user.email || user.id,
        ambassadorEmail: user.email ?? 'email_inconnu',
        userId: user.id,
        ambassadorCode: promotionalCode?.code ?? null,
        reward,
      })
    } catch (emailError) {
      console.error('[ambassador rewards] email error', emailError)
      await releaseAmbassadorRewardClaim(admin, reward.id).catch((releaseError) =>
        console.error('[ambassador rewards] release error', releaseError),
      )
      return NextResponse.json({ error: 'Impossible d’envoyer le mail de réclamation.' }, { status: 502 })
    }

    const { levels } = await loadProgramRules(admin, programYear)
    const response: AmbassadorReward = {
      id: reward.id,
      reward_level: reward.reward_level,
      reward_name: reward.reward_name,
      kind: getRewardKind(levels, reward.reward_level),
      points_required: reward.points_required,
      status: reward.status,
      program_year: reward.program_year,
      earned_at: reward.earned_at,
      expires_at: reward.expires_at,
      claimed_at: reward.claimed_at,
      fulfilled_at: reward.fulfilled_at,
    }
    return NextResponse.json({ reward: response })
  } catch (error) {
    console.error('[ambassador rewards] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
