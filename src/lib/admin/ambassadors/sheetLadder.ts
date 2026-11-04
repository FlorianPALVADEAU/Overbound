import { getExtraTicketsEarned, getNextExtraTicketPointsRequired } from '@/lib/ambassadors/program'
import type { AmbassadorBonusRule, AmbassadorProgramRules } from '@/types/Ambassador'
import type { AdminBonusSummary, AdminLadderStep, AdminSheetReward } from './types'

export type { AdminSheetReward } from './types'

/**
 * The ladder of a season with the reward row of each step. Rewards numbered after the last level are
 * the bonus bibs and come back separately, in level order.
 */
export function buildAdminLadder(
  program: AmbassadorProgramRules,
  totalPoints: number,
  rewards: readonly AdminSheetReward[],
): { steps: AdminLadderStep[]; bonusRewards: AdminSheetReward[] } {
  const levels = [...program.levels].sort((a, b) => a.points_required - b.points_required)
  const rewardByLevel = new Map(rewards.map((reward) => [reward.reward_level, reward]))
  const lastLevel = levels.reduce((max, level) => Math.max(max, level.reward_level), 0)
  const nextLevel = levels.find((level) => totalPoints < level.points_required)?.reward_level ?? null

  const steps = levels.map((level): AdminLadderStep => ({
    level: level.reward_level,
    name: level.reward_name,
    kind: level.kind,
    points_required: level.points_required,
    state: totalPoints >= level.points_required ? 'reached' : level.reward_level === nextLevel ? 'next' : 'locked',
    reward: rewardByLevel.get(level.reward_level) ?? null,
  }))

  const bonusRewards = rewards
    .filter((reward) => reward.reward_level > lastLevel)
    .sort((a, b) => a.reward_level - b.reward_level)

  return { steps, bonusRewards }
}

/** Bonus bibs earned so far and the points left before the next one. Null when the program has no bonus rule. */
export function buildBonusSummary(bonus: AmbassadorBonusRule | null, totalPoints: number): AdminBonusSummary | null {
  if (!bonus) return null
  return {
    reward_name: bonus.reward_name,
    earned: getExtraTicketsEarned(bonus, totalPoints),
    next_points_required: getNextExtraTicketPointsRequired(bonus, totalPoints),
  }
}
