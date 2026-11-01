import type { AmbassadorPreviousEdition, AmbassadorRewardLevel, AmbassadorRewardStatus } from '@/types/Ambassador'
import { getRewardKind } from '@/lib/ambassadors/program'
import { resolveRewardStatus } from '@/lib/ambassadors/dashboardHelpers'

export interface ArchivedTotal {
  season: number
  total_points: number
}

export interface ArchivedReward {
  id: string
  program_year: number
  reward_level: number
  reward_name: string
  status: string
}

/** Seasons that left something to show: a final total or a reward actually claimed. */
export const getPreviousSeason = (totals: ArchivedTotal[], rewards: ArchivedReward[]): number | null => {
  const seasons = [...totals.map((row) => row.season), ...rewards.map((row) => row.program_year)]
  return seasons.length > 0 ? Math.max(...seasons) : null
}

const KEPT: AmbassadorRewardStatus[] = ['claimed', 'fulfilled']

/**
 * What an ambassador kept from the last closed edition. Only rewards that were claimed or
 * delivered are listed; rewards that were never claimed are archived without trace on purpose.
 */
export function buildPreviousEdition(
  totals: ArchivedTotal[],
  rewards: ArchivedReward[],
  levels: AmbassadorRewardLevel[],
): AmbassadorPreviousEdition | null {
  const season = getPreviousSeason(totals, rewards)
  if (season === null) return null

  const kept = rewards
    .filter((reward) => reward.program_year === season)
    .map((reward) => ({ reward, status: resolveRewardStatus(reward.status) }))
    .filter(({ status }) => KEPT.includes(status))
    .sort((a, b) => a.reward.reward_level - b.reward.reward_level)

  return {
    label: `Édition ${season}`,
    total_points: totals.find((row) => row.season === season)?.total_points ?? 0,
    rewards: kept.map(({ reward, status }) => ({
      id: reward.id,
      reward_name: reward.reward_name,
      kind: getRewardKind(levels, reward.reward_level),
      status,
    })),
  }
}
