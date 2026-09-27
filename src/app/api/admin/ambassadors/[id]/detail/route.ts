import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { supabaseAdmin } from '@/lib/supabase/server'
import { isAmbassadorRewardExpired } from '@/lib/ambassadors/rewardLifecycle'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const { id: ambassadorId } = await params
  const admin = supabaseAdmin()
  const { data: ambassador, error: ambassadorError } = await admin
    .from('ambassadors')
    .select('id, profile_id, is_active, promo:promotional_codes(code)')
    .eq('id', ambassadorId)
    .maybeSingle()

  if (ambassadorError || !ambassador) {
    return NextResponse.json({ error: 'Ambassadeur introuvable.' }, { status: 404 })
  }

  const [profileResult, pointsResult, rewardsResult] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', ambassador.profile_id).maybeSingle(),
    admin.from('ambassador_points_years')
      .select('program_year, total_points, recruits_open, recruits_ranked, current_reward_level')
      .eq('ambassador_id', ambassadorId)
      .order('program_year', { ascending: false }),
    admin.from('ambassador_rewards')
      .select('id, reward_level, reward_name, status, program_year, earned_at, expires_at, claimed_at, fulfilled_at, cancelled_at, cancellation_reason')
      .eq('ambassador_id', ambassadorId)
      .order('program_year', { ascending: false })
      .order('reward_level', { ascending: true }),
  ])

  if (pointsResult.error || rewardsResult.error) {
    console.error('[admin ambassador detail] data error', pointsResult.error ?? rewardsResult.error)
    return NextResponse.json({ error: 'Impossible de charger la fiche ambassadeur.' }, { status: 500 })
  }

  const rewardIds = (rewardsResult.data ?? []).map((reward) => reward.id)
  const { data: auditEvents, error: auditError } = rewardIds.length > 0
    ? await admin
        .from('ambassador_reward_audit_events')
        .select('reward_id, action, from_status, to_status, reason, occurred_at')
        .in('reward_id', rewardIds)
        .order('occurred_at', { ascending: false })
    : { data: [], error: null }

  if (auditError) {
    console.error('[admin ambassador detail] audit error', auditError)
    return NextResponse.json({ error: 'Impossible de charger l’historique des récompenses.' }, { status: 500 })
  }

  const promo = Array.isArray(ambassador.promo) ? ambassador.promo[0] : ambassador.promo
  return NextResponse.json({
    ambassador: {
      id: ambassador.id,
      name: profileResult.data?.full_name ?? 'Ambassadeur',
      code: promo?.code ?? null,
      is_active: ambassador.is_active,
    },
    yearly_points: pointsResult.data ?? [],
    audit_events: auditEvents ?? [],
    rewards: (rewardsResult.data ?? []).map((reward) => ({
      ...reward,
      is_expired: isAmbassadorRewardExpired(reward.expires_at),
    })),
  })
}
