import type {
  AmbassadorBonusRule,
  AmbassadorNextReward,
  AmbassadorPaymentStatus,
  AmbassadorProgramRules,
  AmbassadorRaceFormat,
  AmbassadorRewardKind,
  AmbassadorRewardLevel,
} from '@/types/Ambassador'

export const POINTS_OPEN = 1
export const POINTS_RANKED = 2

export const resolveRaceFormat = (value: string | null | undefined): AmbassadorRaceFormat =>
  String(value || '').toLowerCase() === 'ranked' ? 'ranked' : 'open'

export const resolvePaymentStatus = (value: string | null | undefined): AmbassadorPaymentStatus => {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'paid') return 'paid'
  if (normalized === 'refunded') return 'refunded'
  if (normalized === 'cancelled') return 'cancelled'
  return 'pending'
}

/** Rows of the latest `effective_year` that is not after `programYear`. Same rule as the SQL functions. */
export const pickEffectiveRows = <T extends { effective_year: number }>(rows: T[], programYear: number): T[] => {
  const years = rows.map((row) => row.effective_year).filter((year) => year <= programYear)
  if (years.length === 0) return []
  const effectiveYear = Math.max(...years)
  return rows.filter((row) => row.effective_year === effectiveYear)
}

export interface RewardLevelRow extends AmbassadorRewardLevel {
  effective_year: number
}

export interface ProgramRulesRow extends AmbassadorBonusRule {
  effective_year: number
}

export const buildProgramRules = (
  levelRows: RewardLevelRow[],
  ruleRows: ProgramRulesRow[],
  programYear: number,
): AmbassadorProgramRules => {
  const levels = pickEffectiveRows(levelRows, programYear)
    .map(({ effective_year: _effectiveYear, ...level }) => level)
    .sort((a, b) => a.points_required - b.points_required)
  const [rule] = pickEffectiveRows(ruleRows, programYear)
  const bonus = rule
    ? { base_points: rule.base_points, interval_points: rule.interval_points, reward_name: rule.reward_name }
    : null
  return { levels, bonus }
}

export const getNextReward = (
  levels: AmbassadorRewardLevel[],
  totalPoints: number,
): AmbassadorNextReward | null => {
  const level = levels.find((item) => totalPoints < item.points_required)
  if (!level) return null

  return {
    reward_level: level.reward_level,
    reward_name: level.reward_name,
    points_required: level.points_required,
    points_remaining: level.points_required - totalPoints,
  }
}

export const getCurrentRewardLevel = (levels: AmbassadorRewardLevel[], totalPoints: number): number =>
  levels.reduce((unlocked, level) => (totalPoints >= level.points_required ? Math.max(unlocked, level.reward_level) : unlocked), 0)

/** Bonus rewards are numbered after the last ladder level, so the first bonus of a 10-level ladder is level 11. */
export const getFirstBonusLevel = (levels: AmbassadorRewardLevel[]): number =>
  levels.reduce((max, level) => Math.max(max, level.reward_level), 0) + 1

export const getRewardKind = (levels: AmbassadorRewardLevel[], rewardLevel: number): AmbassadorRewardKind =>
  levels.find((level) => level.reward_level === rewardLevel)?.kind ?? 'bib'

export const getExtraTicketsEarned = (bonus: AmbassadorBonusRule | null, totalPoints: number): number => {
  if (!bonus || totalPoints < bonus.base_points + bonus.interval_points) return 0
  return Math.floor((totalPoints - bonus.base_points) / bonus.interval_points)
}

export const getNextExtraTicketPointsRequired = (bonus: AmbassadorBonusRule, totalPoints: number): number =>
  bonus.base_points + (getExtraTicketsEarned(bonus, totalPoints) + 1) * bonus.interval_points
