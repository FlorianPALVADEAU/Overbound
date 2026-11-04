import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveRewardStatus } from '@/lib/ambassadors/dashboardHelpers'
import { loadAmbassadorCodes } from '@/lib/ambassadors/dashboard/loadAmbassadorDashboard'
import { getNextReward } from '@/lib/ambassadors/program'
import { loadProgramRules } from '@/lib/ambassadors/programRules'
import { loadCurrentSeason } from '@/lib/ambassadors/season'
import { isAmbassadorRewardExpired } from '@/lib/ambassadors/rewardLifecycle'
import { buildAdminLadder, buildBonusSummary } from './sheetLadder'
import type { AdminAmbassadorSheetResponse, AdminSheetReward } from './types'

type Admin = Pick<SupabaseClient, 'from'>

const REWARD_COLUMNS = 'id, reward_level, reward_name, points_required, status, program_year, earned_at, expires_at, claimed_at, fulfilled_at, cancellation_reason'

/** Throws with the failing step so the route log says which query broke. */
function ensure<T>(step: string, result: { data: T | null; error: { message: string } | null }): T | null {
  if (result.error) throw new Error(`[admin ambassador sheet] ${step}: ${result.error.message}`)
  return result.data
}

/**
 * Everything the admin sees on one ambassador for one season: the totals, the ladder with each reward,
 * the bonus bibs and the code. Referrals and history are separate reads, loaded when their tab opens.
 * Returns null when the ambassador does not exist.
 */
export async function loadAmbassadorSheet(
  admin: Admin,
  ambassadorId: string,
  requestedSeason: number | null,
): Promise<AdminAmbassadorSheetResponse | null> {
  const ambassador = ensure<{ id: string; profile_id: string; is_active: boolean; promotional_code_id: string | null }>(
    'ambassador',
    await admin.from('ambassadors').select('id, profile_id, is_active, promotional_code_id').eq('id', ambassadorId).maybeSingle(),
  )
  if (!ambassador) return null

  const currentSeason = await loadCurrentSeason(admin)
  const season = requestedSeason ?? currentSeason.season

  const [profileResult, pointRows, rewardRows, codes, program] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', ambassador.profile_id).maybeSingle(),
    admin.from('ambassador_points_years').select('program_year, total_points, recruits_open, recruits_ranked').eq('ambassador_id', ambassadorId),
    admin.from('ambassador_rewards').select(REWARD_COLUMNS).eq('ambassador_id', ambassadorId).eq('program_year', season).order('reward_level', { ascending: true }),
    loadAmbassadorCodes(admin, { id: ambassador.id, promotional_code_id: ambassador.promotional_code_id }),
    loadProgramRules(admin, season),
  ])

  const profile = ensure<{ full_name: string | null }>('profile', profileResult)
  const allPoints = ensure<Array<{ program_year: number; total_points: number; recruits_open: number; recruits_ranked: number }>>('points', pointRows) ?? []
  const seasonPoints = allPoints.find((row) => Number(row.program_year) === season)
  const totalPoints = seasonPoints?.total_points ?? 0

  const rewards: AdminSheetReward[] = (ensure<Array<Record<string, unknown>>>('rewards', rewardRows) ?? []).map((row) => ({
    id: row.id as string,
    reward_level: row.reward_level as number,
    reward_name: row.reward_name as string,
    points_required: row.points_required as number,
    status: resolveRewardStatus(row.status as string),
    program_year: row.program_year as number,
    earned_at: row.earned_at as string,
    expires_at: (row.expires_at as string | null) ?? null,
    claimed_at: (row.claimed_at as string | null) ?? null,
    fulfilled_at: (row.fulfilled_at as string | null) ?? null,
    cancellation_reason: (row.cancellation_reason as string | null) ?? null,
    is_expired: isAmbassadorRewardExpired(row.expires_at as string | null),
  }))

  const { steps, bonusRewards } = buildAdminLadder(program, totalPoints, rewards)
  const availableYears = new Set<number>([currentSeason.season, season, ...allPoints.map((row) => Number(row.program_year))])

  return {
    ambassador: {
      id: ambassador.id,
      profile_id: ambassador.profile_id,
      name: profile?.full_name ?? 'Ambassadeur',
      code: codes.currentCode,
      is_active: ambassador.is_active,
    },
    program_year: season,
    current_season: currentSeason.season,
    available_program_years: Array.from(availableYears).filter(Number.isInteger).sort((a, b) => b - a),
    season: {
      total_points: totalPoints,
      recruits_open: seasonPoints?.recruits_open ?? 0,
      recruits_ranked: seasonPoints?.recruits_ranked ?? 0,
    },
    next_reward: getNextReward(program.levels, totalPoints),
    ladder: steps,
    bonus: buildBonusSummary(program.bonus, totalPoints),
    bonus_rewards: bonusRewards,
  }
}
