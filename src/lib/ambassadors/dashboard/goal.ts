import type { AmbassadorProgramRules, AmbassadorRewardKind } from '@/types/Ambassador'
import { getExtraTicketsEarned, getNextExtraTicketPointsRequired, POINTS_OPEN, POINTS_RANKED } from '@/lib/ambassadors/program'

export interface AmbassadorGoal {
  name: string
  description: string | null
  kind: AmbassadorRewardKind
  pointsRequired: number
  pointsRemaining: number
  /** Progress inside the current step, 0 to 100. */
  progressPercent: number
  /** What the remaining points mean in referrals. */
  friendsNeeded: { open: number; ranked: number }
  isBonus: boolean
}

const friendsFor = (pointsRemaining: number) => ({
  open: Math.ceil(pointsRemaining / POINTS_OPEN),
  ranked: Math.ceil(pointsRemaining / POINTS_RANKED),
})

const percent = (from: number, to: number, current: number) =>
  to <= from ? 100 : Math.min(100, Math.max(0, Math.round(((current - from) / (to - from)) * 100)))

/**
 * The single next thing to aim for: the next ladder level, then the next bonus bib.
 * Null when the ladder is finished and no bonus rule exists.
 */
export function buildGoal(program: AmbassadorProgramRules, totalPoints: number): AmbassadorGoal | null {
  const levels = [...program.levels].sort((a, b) => a.points_required - b.points_required)
  const nextIndex = levels.findIndex((level) => totalPoints < level.points_required)

  if (nextIndex >= 0) {
    const next = levels[nextIndex]
    const previousRequired = nextIndex === 0 ? 0 : levels[nextIndex - 1].points_required
    const pointsRemaining = next.points_required - totalPoints
    return {
      name: next.reward_name,
      description: next.description,
      kind: next.kind,
      pointsRequired: next.points_required,
      pointsRemaining,
      progressPercent: percent(previousRequired, next.points_required, totalPoints),
      friendsNeeded: friendsFor(pointsRemaining),
      isBonus: false,
    }
  }

  if (!program.bonus) return null
  const nextRequired = getNextExtraTicketPointsRequired(program.bonus, totalPoints)
  const previousRequired = nextRequired - program.bonus.interval_points
  const pointsRemaining = nextRequired - totalPoints
  return {
    name: program.bonus.reward_name,
    description: null,
    kind: 'bib',
    pointsRequired: nextRequired,
    pointsRemaining,
    progressPercent: percent(previousRequired, nextRequired, totalPoints),
    friendsNeeded: friendsFor(pointsRemaining),
    isBonus: true,
  }
}

export interface BonusSummary {
  earned: number
  nextAt: number
  intervalPoints: number
  name: string
}

/** Null when there is no bonus rule or when the ladder is not finished yet. */
export function buildBonusSummary(program: AmbassadorProgramRules, totalPoints: number): BonusSummary | null {
  if (!program.bonus) return null
  return {
    earned: getExtraTicketsEarned(program.bonus, totalPoints),
    nextAt: getNextExtraTicketPointsRequired(program.bonus, totalPoints),
    intervalPoints: program.bonus.interval_points,
    name: program.bonus.reward_name,
  }
}
