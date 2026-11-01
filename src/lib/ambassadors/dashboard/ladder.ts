import { isAmbassadorRewardExpired } from '@/lib/ambassadors/rewardLifecycle'
import type { AmbassadorProgramRules, AmbassadorReward, AmbassadorRewardKind, AmbassadorRewardStatus } from '@/types/Ambassador'

/** reached: points are there. next: the step being worked on. locked: further away. */
export type LadderStepState = 'reached' | 'next' | 'locked'

export interface LadderStep {
  level: number
  name: string
  description: string
  kind: AmbassadorRewardKind
  pointsRequired: number
  state: LadderStepState
  /** Status of the matching reward row, when the step has been reached. */
  rewardStatus: AmbassadorRewardStatus | null
  /** The reward was earned but its season ended before it was claimed. */
  rewardExpired: boolean
}

export function buildLadder(program: AmbassadorProgramRules, totalPoints: number, rewards: AmbassadorReward[], now = new Date()): LadderStep[] {
  const rewardByLevel = new Map(rewards.map((reward) => [reward.reward_level, reward]))
  const levels = [...program.levels].sort((a, b) => a.points_required - b.points_required)
  const nextLevel = levels.find((level) => totalPoints < level.points_required)?.reward_level ?? null

  return levels.map((level) => {
    const reached = totalPoints >= level.points_required
    const reward = reached ? rewardByLevel.get(level.reward_level) : undefined
    return {
      level: level.reward_level,
      name: level.reward_name,
      description: level.description,
      kind: level.kind,
      pointsRequired: level.points_required,
      state: reached ? 'reached' : level.reward_level === nextLevel ? 'next' : 'locked',
      rewardStatus: reward?.status ?? null,
      rewardExpired: reward?.status === 'earned' && isAmbassadorRewardExpired(reward.expires_at, now),
    }
  })
}

/** Rewards the ambassador can claim right now: earned and not past the end of the season. */
export const getClaimableRewards = (rewards: AmbassadorReward[], now = new Date()): AmbassadorReward[] =>
  rewards
    .filter((reward) => reward.status === 'earned' && !isAmbassadorRewardExpired(reward.expires_at, now))
    .sort((a, b) => a.reward_level - b.reward_level)
