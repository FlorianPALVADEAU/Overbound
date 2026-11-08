import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminAmbassadorHistoryResponse, AdminPointsAdjustmentEvent, AdminRewardDecisionEvent } from './types'
import { formatProfileName } from '@/lib/account/profile'

type Admin = Pick<SupabaseClient, 'from'>

const HISTORY_LIMIT = 100

/** Throws with the failing step so the route log says which query broke. */
function ensure<T>(step: string, result: { data: T[] | null; error: { message: string } | null }): T[] {
  if (result.error) throw new Error(`[admin ambassador history] ${step}: ${result.error.message}`)
  return result.data ?? []
}

/**
 * What the team did by hand on one ambassador: every point correction (with its reason) and every
 * cancellation or reopening of a reward. Both are append-only, so this is the audit trail as written.
 */
export async function loadAmbassadorHistory(admin: Admin, ambassadorId: string): Promise<AdminAmbassadorHistoryResponse> {
  const [adjustments, decisions, rewards] = await Promise.all([
    admin
      .from('ambassador_points_adjustments')
      .select('id, program_year, reason, before_total_points, after_total_points, before_recruits_open, after_recruits_open, before_recruits_ranked, after_recruits_ranked, actor_profile_id, created_at')
      .eq('ambassador_id', ambassadorId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT),
    admin
      .from('ambassador_reward_audit_events')
      .select('reward_id, action, from_status, to_status, reason, actor_profile_id, occurred_at')
      .eq('ambassador_id', ambassadorId)
      .order('occurred_at', { ascending: false })
      .limit(HISTORY_LIMIT),
    admin.from('ambassador_rewards').select('id, reward_name, reward_level, program_year').eq('ambassador_id', ambassadorId),
  ])

  const adjustmentRows = ensure<Record<string, unknown>>('adjustments', adjustments)
  const decisionRows = ensure<Record<string, unknown>>('decisions', decisions)
  const rewardRows = ensure<{ id: string; reward_name: string; reward_level: number; program_year: number }>('rewards', rewards)

  const actorIds = Array.from(new Set([
    ...adjustmentRows.map((row) => row.actor_profile_id as string),
    ...decisionRows.map((row) => row.actor_profile_id as string),
  ].filter(Boolean)))
  const actors = actorIds.length > 0
    ? ensure<{ id: string; first_name: string | null; last_name: string | null }>('actors', await admin.from('profiles').select('id, first_name, last_name').in('id', actorIds))
    : []
  const actorName = new Map(actors.map((row) => [row.id, formatProfileName(row)]))
  const rewardById = new Map(rewardRows.map((row) => [row.id, row]))

  const point_adjustments: AdminPointsAdjustmentEvent[] = adjustmentRows.map((row) => ({
    id: row.id as string,
    program_year: row.program_year as number,
    reason: row.reason as string,
    before_total_points: row.before_total_points as number,
    after_total_points: row.after_total_points as number,
    before_recruits_open: row.before_recruits_open as number,
    after_recruits_open: row.after_recruits_open as number,
    before_recruits_ranked: row.before_recruits_ranked as number,
    after_recruits_ranked: row.after_recruits_ranked as number,
    actor_name: actorName.get(row.actor_profile_id as string) ?? null,
    created_at: row.created_at as string,
  }))

  const reward_decisions: AdminRewardDecisionEvent[] = decisionRows.map((row) => {
    const reward = rewardById.get(row.reward_id as string)
    return {
      reward_id: row.reward_id as string,
      reward_name: reward?.reward_name ?? null,
      reward_level: reward?.reward_level ?? null,
      program_year: reward?.program_year ?? null,
      action: row.action as 'cancelled' | 'reopened',
      from_status: row.from_status as string,
      to_status: row.to_status as string,
      reason: row.reason as string,
      actor_name: actorName.get(row.actor_profile_id as string) ?? null,
      occurred_at: row.occurred_at as string,
    }
  })

  return { point_adjustments, reward_decisions }
}
