import type { SupabaseClient } from '@supabase/supabase-js'
import { loadCurrentSeason } from '@/lib/ambassadors/season'
import { pickCurrentCodeId, type AmbassadorCodeLink } from './currentCode'
import { countRewardsToHandle } from './rewardCounts'
import type { AdminAmbassadorListResponse, AdminAmbassadorRow } from './types'

type Admin = Pick<SupabaseClient, 'from'>

interface AmbassadorRecord {
  id: string
  profile_id: string
  is_active: boolean
  promotional_code_id: string | null
}

interface SeasonPointsRecord {
  ambassador_id: string
  program_year: number
  total_points: number
  recruits_open: number
  recruits_ranked: number
}

/** Throws with the failing step so the route log says which query broke. */
function ensure<T>(step: string, result: { data: T[] | null; error: { message: string } | null }): T[] {
  if (result.error) throw new Error(`[admin ambassadors list] ${step}: ${result.error.message}`)
  return result.data ?? []
}

/**
 * Every ambassador with the totals of one season, the code they share and the rewards waiting on them
 * or on the team. One row per ambassador: the rewards themselves are read on the ambassador's sheet.
 */
export async function loadAmbassadorList(admin: Admin, requestedSeason: number | null): Promise<AdminAmbassadorListResponse> {
  const season = requestedSeason ?? (await loadCurrentSeason(admin)).season

  const ambassadors = ensure<AmbassadorRecord>(
    'ambassadors',
    await admin.from('ambassadors').select('id, profile_id, is_active, promotional_code_id').order('created_at', { ascending: false }),
  )
  const ambassadorIds = ambassadors.map((row) => row.id)
  const profileIds = ambassadors.map((row) => row.profile_id)

  if (ambassadorIds.length === 0) {
    return { ambassadors: [], program_year: season, available_program_years: [season] }
  }

  const [profiles, links, points, rewards] = await Promise.all([
    admin.from('profiles').select('id, full_name').in('id', profileIds),
    admin.from('ambassador_promotional_codes').select('ambassador_id, promotional_code_id, is_current').in('ambassador_id', ambassadorIds),
    admin.from('ambassador_points_years').select('ambassador_id, program_year, total_points, recruits_open, recruits_ranked').in('ambassador_id', ambassadorIds),
    admin.from('ambassador_rewards').select('ambassador_id, status').in('ambassador_id', ambassadorIds).eq('program_year', season).in('status', ['earned', 'claimed']),
  ])

  const profileRows = ensure<{ id: string; full_name: string | null }>('profiles', profiles)
  const linkRows = ensure<AmbassadorCodeLink & { ambassador_id: string }>('codes', links)
  const pointRows = ensure<SeasonPointsRecord>('points', points)
  const rewardRows = ensure<{ ambassador_id: string; status: string }>('rewards', rewards)

  const codeIds = Array.from(new Set([
    ...linkRows.map((link) => link.promotional_code_id),
    ...ambassadors.map((row) => row.promotional_code_id).filter((id): id is string => Boolean(id)),
  ]))
  const codeRows = codeIds.length > 0
    ? ensure<{ id: string; code: string | null }>('promo codes', await admin.from('promotional_codes').select('id, code').in('id', codeIds))
    : []

  const nameByProfile = new Map(profileRows.map((row) => [row.id, row.full_name]))
  const codeById = new Map(codeRows.map((row) => [row.id, row.code]))
  const linksByAmbassador = new Map<string, AmbassadorCodeLink[]>()
  for (const link of linkRows) {
    linksByAmbassador.set(link.ambassador_id, [...(linksByAmbassador.get(link.ambassador_id) ?? []), link])
  }
  const pointsByAmbassador = new Map(pointRows.filter((row) => row.program_year === season).map((row) => [row.ambassador_id, row]))
  const rewardsToHandle = countRewardsToHandle(rewardRows)

  const rows: AdminAmbassadorRow[] = ambassadors.map((ambassador) => {
    const currentCodeId = pickCurrentCodeId(linksByAmbassador.get(ambassador.id) ?? [], ambassador.promotional_code_id)
    const seasonPoints = pointsByAmbassador.get(ambassador.id)
    const toHandle = rewardsToHandle.get(ambassador.id)
    return {
      ambassador_id: ambassador.id,
      profile_id: ambassador.profile_id,
      ambassador_name: nameByProfile.get(ambassador.profile_id) ?? 'Ambassadeur',
      ambassador_code: currentCodeId ? (codeById.get(currentCodeId) ?? null) : null,
      is_active: ambassador.is_active,
      total_points: seasonPoints?.total_points ?? 0,
      recruits_open: seasonPoints?.recruits_open ?? 0,
      recruits_ranked: seasonPoints?.recruits_ranked ?? 0,
      rewards_to_claim: toHandle?.toClaim ?? 0,
      rewards_to_fulfil: toHandle?.toFulfil ?? 0,
    }
  })

  const years = new Set<number>([season, ...pointRows.map((row) => Number(row.program_year))])
  return {
    ambassadors: rows,
    program_year: season,
    available_program_years: Array.from(years).filter(Number.isInteger).sort((a, b) => b - a),
  }
}
