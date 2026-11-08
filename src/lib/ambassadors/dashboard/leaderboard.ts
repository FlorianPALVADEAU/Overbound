import type { AmbassadorLeaderboard } from '@/types/Ambassador'
import { formatLeaderboardName } from '@/lib/ambassadors/dashboardHelpers'

export interface LeaderboardInput {
  ambassador_id: string
  profile_id: string
  first_name: string | null
  last_name: string | null
  points: number
}

const TOP_SIZE = 3

/**
 * Ranking of the running season. Only ambassadors with points are ranked. Ties are broken by name
 * so the order is stable. `chase` is the ambassador right above the viewer and the points that
 * take the viewer strictly past them.
 */
export function buildLeaderboard(entries: LeaderboardInput[], currentAmbassadorId: string): AmbassadorLeaderboard {
  const ranked = entries
    .filter((entry) => entry.points > 0)
    .map((entry) => ({
      ambassador_id: entry.ambassador_id,
      points: entry.points,
      name: formatLeaderboardName(entry, entry.profile_id),
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'fr'))
    .map((entry, index) => ({ ...entry, rank: index + 1, is_current_user: entry.ambassador_id === currentAmbassadorId }))

  const current = ranked.find((entry) => entry.is_current_user) ?? null
  const above = current && current.rank > 1 ? ranked[current.rank - 2] : null

  return {
    total_ranked: ranked.length,
    current_user_rank: current?.rank ?? null,
    current_points: current?.points ?? null,
    top: ranked.slice(0, TOP_SIZE).map(({ rank, name, points, is_current_user }) => ({ rank, name, points, is_current_user })),
    chase: current && above ? { name: above.name, points_to_pass: above.points - current.points + 1 } : null,
  }
}
