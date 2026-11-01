import type { SupabaseClient } from '@supabase/supabase-js'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'
import { resolveRewardStatus } from '@/lib/ambassadors/dashboardHelpers'

type Admin = Pick<SupabaseClient, 'from'>

export type ClaimFailure = 'NOT_FOUND' | 'EXPIRED' | 'NOT_CLAIMABLE'

export interface ClaimedReward {
  id: string
  reward_level: number
  reward_name: string
  points_required: number
  status: AmbassadorRewardStatus
  program_year: number
  earned_at: string
  expires_at: string | null
  claimed_at: string | null
  fulfilled_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
}

export type ClaimResult = { ok: true; reward: ClaimedReward } | { ok: false; reason: ClaimFailure }

const COLUMNS =
  'id, reward_level, reward_name, points_required, status, program_year, earned_at, expires_at, claimed_at, fulfilled_at, cancelled_at, cancellation_reason'

const normalize = (row: Record<string, unknown>): ClaimedReward => ({
  ...(row as unknown as ClaimedReward),
  status: resolveRewardStatus(row.status as string),
})

/**
 * Moves one reward of the given season from earned to claimed. The status and expiry checks are
 * part of the UPDATE, so two concurrent claims cannot both succeed.
 */
export async function claimAmbassadorReward(
  admin: Admin,
  params: { ambassadorId: string; programYear: number; rewardLevel: number; now?: Date },
): Promise<ClaimResult> {
  const { ambassadorId, programYear, rewardLevel, now = new Date() } = params
  const scope = (query: ReturnType<ReturnType<Admin['from']>['update']>) =>
    query.eq('ambassador_id', ambassadorId).eq('program_year', programYear).eq('reward_level', rewardLevel)

  const { data: claimed, error } = await scope(
    admin.from('ambassador_rewards').update({ status: 'claimed', claimed_at: now.toISOString(), updated_at: now.toISOString() }),
  )
    .eq('status', 'earned')
    .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
    .select(COLUMNS)
    .maybeSingle()
  if (error) throw error
  if (claimed) return { ok: true, reward: normalize(claimed) }

  const { data: existing, error: lookupError } = await admin
    .from('ambassador_rewards')
    .select('status, expires_at')
    .eq('ambassador_id', ambassadorId)
    .eq('program_year', programYear)
    .eq('reward_level', rewardLevel)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (!existing) return { ok: false, reason: 'NOT_FOUND' }
  if (resolveRewardStatus(existing.status) === 'earned') return { ok: false, reason: 'EXPIRED' }
  return { ok: false, reason: 'NOT_CLAIMABLE' }
}

/** Puts a claim back to earned when the team could not be notified, so the ambassador can retry. */
export async function releaseAmbassadorRewardClaim(admin: Admin, rewardId: string): Promise<void> {
  const { error } = await admin
    .from('ambassador_rewards')
    .update({ status: 'earned', claimed_at: null, updated_at: new Date().toISOString() })
    .eq('id', rewardId)
    .eq('status', 'claimed')
    .is('fulfilled_at', null)
  if (error) throw error
}

