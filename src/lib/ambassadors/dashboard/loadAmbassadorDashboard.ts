import type { SupabaseClient } from '@supabase/supabase-js'
import type { AmbassadorDashboardData, AmbassadorRecruitRow, AmbassadorReward } from '@/types/Ambassador'
import { resolveRewardStatus } from '@/lib/ambassadors/dashboardHelpers'
import { getNextReward, getRewardKind } from '@/lib/ambassadors/program'
import { loadProgramRules } from '@/lib/ambassadors/programRules'
import type { AmbassadorSeason } from '@/lib/ambassadors/season'
import { buildPreviousEdition, getPreviousSeason, type ArchivedReward, type ArchivedTotal } from '@/lib/ambassadors/dashboard/previousEdition'
import { buildLeaderboard } from '@/lib/ambassadors/dashboard/leaderboard'
import { listAmbassadorCodeIds, pickCurrentCodeId } from '@/lib/admin/ambassadors/currentCode'
import {
  buildRecruitRows,
  type RecruitPointEvent,
  type RecruitRegistration,
} from '@/lib/ambassadors/dashboard/recruits'

type Admin = Pick<SupabaseClient, 'from'>

export interface DashboardAmbassador {
  id: string
  promotional_code_id: string | null
}

const REGISTRATION_COLUMNS = 'id, user_id, email, created_at, order_id, ticket:tickets(name, race_format, race:races(name))'

const REWARD_COLUMNS = 'id, reward_level, reward_name, points_required, status, program_year, earned_at, expires_at, claimed_at, fulfilled_at'

/** Throws with the failing step so the route log says which query broke. */
function ensure<T>(step: string, result: { data: T | null; error: { message: string } | null }): T | [] {
  if (result.error) throw new Error(`[ambassador dashboard] ${step}: ${result.error.message}`)
  return result.data ?? []
}

export interface AmbassadorCodes {
  currentCode: string | null
  allCodeIds: string[]
  allCodes: string[]
}

export async function loadAmbassadorCodes(admin: Admin, ambassador: DashboardAmbassador): Promise<AmbassadorCodes> {
  const links = ensure(
    'codes',
    await admin
      .from('ambassador_promotional_codes')
      .select('promotional_code_id, is_current')
      .eq('ambassador_id', ambassador.id),
  ) as Array<{ promotional_code_id: string; is_current: boolean }>

  const allCodeIds = listAmbassadorCodeIds(links, ambassador.promotional_code_id)
  const currentCodeId = pickCurrentCodeId(links, ambassador.promotional_code_id)

  if (allCodeIds.length === 0) return { currentCode: null, allCodeIds, allCodes: [] }

  const codes = ensure('promo codes', await admin.from('promotional_codes').select('id, code').in('id', allCodeIds)) as Array<{
    id: string
    code: string | null
  }>
  const clean = (value: string | null) => (value ?? '').trim()

  return {
    currentCode: clean(codes.find((row) => row.id === currentCodeId)?.code ?? null) || null,
    allCodeIds,
    allCodes: codes.map((row) => clean(row.code)).filter(Boolean),
  }
}

/** Referrals reach an ambassador by promo code, by affiliation token, or by a manual credit. */
async function loadRecruitRegistrations(
  admin: Admin,
  ambassadorId: string,
  codes: AmbassadorCodes,
): Promise<RecruitRegistration[]> {
  const manual = ensure(
    'manual referrals',
    await admin.from('ambassador_manual_referrals').select('registration_id').eq('ambassador_id', ambassadorId),
  ) as Array<{ registration_id: string }>

  const [byCode, byToken, byManual] = await Promise.all([
    codes.allCodeIds.length > 0
      ? admin.from('registrations').select(REGISTRATION_COLUMNS).in('promotional_code_id', codes.allCodeIds)
      : null,
    codes.allCodes.length > 0
      ? admin.from('registrations').select(REGISTRATION_COLUMNS).in('affiliation_token', codes.allCodes).eq('is_affiliated', true)
      : null,
    manual.length > 0
      ? admin.from('registrations').select(REGISTRATION_COLUMNS).in('id', manual.map((row) => row.registration_id))
      : null,
  ])

  const rows = [
    ...(byCode ? (ensure('registrations by code', byCode) as RecruitRegistration[]) : []),
    ...(byToken ? (ensure('registrations by token', byToken) as RecruitRegistration[]) : []),
    ...(byManual ? (ensure('manual registrations', byManual) as RecruitRegistration[]) : []),
  ]
  return Array.from(new Map(rows.map((row) => [row.id, row])).values())
}

/** Referral rows of the running season: who came through a code, a token or a manual credit, with their points. */
export async function loadAmbassadorRecruits(
  admin: Admin,
  ambassador: DashboardAmbassador,
  codes: AmbassadorCodes,
  seasonStartedAt: string,
): Promise<AmbassadorRecruitRow[]> {
  const registrations = await loadRecruitRegistrations(admin, ambassador.id, codes)
  const orderIds = Array.from(new Set(registrations.map((row) => row.order_id).filter((id): id is string => Boolean(id))))
  const profileIds = Array.from(new Set(registrations.map((row) => row.user_id).filter((id): id is string => Boolean(id))))

  const [orders, profiles, events] = await Promise.all([
    orderIds.length > 0 ? admin.from('orders').select('id, status').in('id', orderIds) : null,
    profileIds.length > 0 ? admin.from('profiles').select('id, full_name').in('id', profileIds) : null,
    registrations.length > 0
      ? admin
          .from('ambassador_points_events')
          .select('registration_id, points, race_format, revoked_at')
          .eq('ambassador_id', ambassador.id)
          .in('registration_id', registrations.map((row) => row.id))
      : null,
  ])

  return buildRecruitRows({
    registrations,
    orderStatuses: new Map(
      (orders ? (ensure('orders', orders) as Array<{ id: string; status: string | null }>) : []).map((row) => [row.id, row.status]),
    ),
    profileNames: new Map(
      (profiles ? (ensure('profiles', profiles) as Array<{ id: string; full_name: string | null }>) : []).map((row) => [row.id, row.full_name]),
    ),
    pointEvents: events ? (ensure('point events', events) as RecruitPointEvent[]) : [],
    seasonStartedAt,
  })
}

async function loadLeaderboardEntries(admin: Admin, programYear: number) {
  const ambassadors = ensure(
    'active ambassadors',
    await admin.from('ambassadors').select('id, profile_id').eq('is_active', true),
  ) as Array<{ id: string; profile_id: string }>
  if (ambassadors.length === 0) return []

  const [points, profiles] = await Promise.all([
    admin
      .from('ambassador_points_years')
      .select('ambassador_id, total_points')
      .eq('program_year', programYear)
      .in('ambassador_id', ambassadors.map((row) => row.id)),
    admin.from('profiles').select('id, full_name').in('id', ambassadors.map((row) => row.profile_id)),
  ])

  const pointsByAmbassador = new Map(
    (ensure('leaderboard points', points) as Array<{ ambassador_id: string; total_points: number | null }>).map((row) => [
      row.ambassador_id,
      Number(row.total_points ?? 0),
    ]),
  )
  const nameByProfile = new Map(
    (ensure('leaderboard profiles', profiles) as Array<{ id: string; full_name: string | null }>).map((row) => [row.id, row.full_name]),
  )

  return ambassadors.map((row) => ({
    ambassador_id: row.id,
    profile_id: row.profile_id,
    full_name: nameByProfile.get(row.profile_id) ?? null,
    points: pointsByAmbassador.get(row.id) ?? 0,
  }))
}

/** Totals and claimed rewards of the editions closed before the running season. */
async function loadPreviousEdition(admin: Admin, ambassadorId: string, season: number) {
  const [totals, rewards] = await Promise.all([
    admin.from('ambassador_season_archive').select('season, total_points').eq('ambassador_id', ambassadorId).lt('season', season),
    admin
      .from('ambassador_rewards')
      .select('id, program_year, reward_level, reward_name, status')
      .eq('ambassador_id', ambassadorId)
      .lt('program_year', season)
      .in('status', ['claimed', 'fulfilled']),
  ])
  const archivedTotals = ensure('archive totals', totals) as ArchivedTotal[]
  const archivedRewards = ensure('archive rewards', rewards) as ArchivedReward[]
  const previousSeason = getPreviousSeason(archivedTotals, archivedRewards)
  if (previousSeason === null) return null

  const { levels } = await loadProgramRules(admin, previousSeason)
  return buildPreviousEdition(archivedTotals, archivedRewards, levels)
}

export async function loadAmbassadorDashboard(
  admin: Admin,
  ambassador: DashboardAmbassador,
  { season, startedAt, endsAt }: AmbassadorSeason,
): Promise<AmbassadorDashboardData> {
  const [program, codes] = await Promise.all([loadProgramRules(admin, season), loadAmbassadorCodes(admin, ambassador)])

  const [pointsYear, rewardRows, recruits, leaderboardEntries, previousEdition] = await Promise.all([
    admin
      .from('ambassador_points_years')
      .select('total_points, recruits_open, recruits_ranked')
      .eq('ambassador_id', ambassador.id)
      .eq('program_year', season)
      .maybeSingle(),
    admin
      .from('ambassador_rewards')
      .select(REWARD_COLUMNS)
      .eq('ambassador_id', ambassador.id)
      .eq('program_year', season)
      .neq('status', 'cancelled')
      .order('reward_level', { ascending: true }),
    loadAmbassadorRecruits(admin, ambassador, codes, startedAt),
    loadLeaderboardEntries(admin, season),
    loadPreviousEdition(admin, ambassador.id, season),
  ])

  const points = ensure('points', pointsYear) as { total_points?: number; recruits_open?: number; recruits_ranked?: number }
  const totalPoints = points.total_points ?? 0

  const rewards: AmbassadorReward[] = (ensure('rewards', rewardRows) as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    reward_level: row.reward_level as number,
    reward_name: row.reward_name as string,
    kind: getRewardKind(program.levels, row.reward_level as number),
    points_required: row.points_required as number,
    status: resolveRewardStatus(row.status as string),
    program_year: row.program_year as number,
    earned_at: row.earned_at as string,
    expires_at: (row.expires_at as string | null) ?? null,
    claimed_at: (row.claimed_at as string | null) ?? null,
    fulfilled_at: (row.fulfilled_at as string | null) ?? null,
  }))

  return {
    program,
    season_ends_at: endsAt,
    code: codes.currentCode,
    total_points: totalPoints,
    points_breakdown: { open_count: points.recruits_open ?? 0, ranked_count: points.recruits_ranked ?? 0 },
    rewards,
    next_reward: getNextReward(program.levels, totalPoints),
    leaderboard: buildLeaderboard(leaderboardEntries, ambassador.id),
    recruits_table: recruits,
    previous_edition: previousEdition,
  }
}

/** Shown to an account with ambassador access but no active ambassador profile. */
export async function loadEmptyAmbassadorDashboard(admin: Admin, { season, endsAt }: AmbassadorSeason): Promise<AmbassadorDashboardData> {
  const program = await loadProgramRules(admin, season)
  return {
    program,
    season_ends_at: endsAt,
    code: null,
    total_points: 0,
    points_breakdown: { open_count: 0, ranked_count: 0 },
    rewards: [],
    next_reward: getNextReward(program.levels, 0),
    leaderboard: { total_ranked: 0, current_user_rank: null, top: [], chase: null },
    recruits_table: [],
    previous_edition: null,
  }
}
