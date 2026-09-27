import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'

export const runtime = 'nodejs'

const resolveRewardStatus = (value: string | null | undefined): AmbassadorRewardStatus => {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'claimed') return 'claimed'
  if (normalized === 'fulfilled') return 'fulfilled'
  if (normalized === 'cancelled') return 'cancelled'
  return 'earned'
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const admin = supabaseAdmin()

    const { data: rewardsRows, error: rewardsError } = await admin
      .from('ambassador_rewards')
      .select('id, ambassador_id, reward_level, reward_name, status, program_year, earned_at, expires_at, claimed_at, fulfilled_at, cancelled_at, cancellation_reason')
      .order('earned_at', { ascending: false })

    if (rewardsError) {
      console.error('[admin ambassadors] rewards error', rewardsError)
      return NextResponse.json({ error: 'Erreur récompenses' }, { status: 500 })
    }

    const rewards = (rewardsRows || []) as Array<{
      id: string
      ambassador_id: string
      reward_level: number
      reward_name: string
      status: string | null
      program_year: number | null
      earned_at: string
      expires_at: string | null
      claimed_at: string | null
      fulfilled_at: string | null
      cancelled_at: string | null
      cancellation_reason: string | null
    }>

    if (rewards.length === 0) {
      return NextResponse.json({ rewards: [] })
    }

    const ambassadorIds = Array.from(new Set(rewards.map((row) => row.ambassador_id)))

    const { data: ambassadorsRows, error: ambassadorsError } = await admin
      .from('ambassadors')
      .select('id, profile_id, promo:promotional_codes(code)')
      .in('id', ambassadorIds)

    if (ambassadorsError) {
      console.error('[admin ambassadors] ambassadors error', ambassadorsError)
      return NextResponse.json({ error: 'Erreur ambassadeurs' }, { status: 500 })
    }

    const ambassadors = (ambassadorsRows || []) as Array<{
      id: string
      profile_id: string
      promo: { code?: string | null } | Array<{ code?: string | null }> | null
    }>

    const profileIds = Array.from(new Set(ambassadors.map((row) => row.profile_id)))

    const { data: profilesRows, error: profilesError } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', profileIds)

    if (profilesError) {
      console.error('[admin ambassadors] profiles error', profilesError)
      return NextResponse.json({ error: 'Erreur profils' }, { status: 500 })
    }

    const profilesMap = new Map(
      (profilesRows || []).map((row) => [row.id as string, row.full_name as string | null]),
    )
    const ambassadorMap = new Map(
      ambassadors.map((row) => [
        row.id,
        {
          profile_id: row.profile_id,
          code: Array.isArray(row.promo) ? row.promo?.[0]?.code ?? null : row.promo?.code ?? null,
          full_name: profilesMap.get(row.profile_id) ?? null,
        },
      ]),
    )

    const response = rewards.map((reward) => {
      const ambassador = ambassadorMap.get(reward.ambassador_id)
      return {
        id: reward.id,
        ambassador_id: reward.ambassador_id,
        ambassador_name: ambassador?.full_name ?? 'Ambassadeur',
        ambassador_code: ambassador?.code ?? null,
        profile_id: ambassador?.profile_id ?? null,
        reward_level: reward.reward_level,
        reward_name: reward.reward_name,
        status: resolveRewardStatus(reward.status),
        program_year: reward.program_year,
        earned_at: reward.earned_at,
        expires_at: reward.expires_at,
        claimed_at: reward.claimed_at,
        fulfilled_at: reward.fulfilled_at,
        cancelled_at: reward.cancelled_at,
        cancellation_reason: reward.cancellation_reason,
      }
    })

    return NextResponse.json({ rewards: response })
  } catch (error) {
    console.error('[admin ambassadors] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
