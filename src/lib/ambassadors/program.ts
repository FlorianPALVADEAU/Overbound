import type {
  AmbassadorNextReward,
  AmbassadorPaymentStatus,
  AmbassadorRaceFormat,
} from '@/types/Ambassador'

export const AMBASSADOR_REWARD_LEVELS = [
  { reward_level: 1, reward_name: 'T-shirt ambassadeur', points_required: 5 },
  { reward_level: 2, reward_name: 'Dossard Open offert', points_required: 10 },
  { reward_level: 3, reward_name: 'Dossard Ranked offert', points_required: 20 },
  {
    reward_level: 4,
    reward_name: 'Pack VIP (file prioritaire + badge + mention officielle)',
    points_required: 35,
  },
  { reward_level: 5, reward_name: 'Dossard offert édition suivante', points_required: 50 },
] as const

export const resolveRaceFormat = (value: string | null | undefined): AmbassadorRaceFormat =>
  String(value || '').toLowerCase() === 'ranked' ? 'ranked' : 'open'

export const resolvePaymentStatus = (value: string | null | undefined): AmbassadorPaymentStatus => {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'paid') return 'paid'
  if (normalized === 'refunded') return 'refunded'
  if (normalized === 'cancelled') return 'cancelled'
  return 'pending'
}

export const getNextReward = (totalPoints: number): AmbassadorNextReward | null => {
  const level = AMBASSADOR_REWARD_LEVELS.find((item) => totalPoints < item.points_required)
  if (!level) {
    return null
  }

  return {
    reward_level: level.reward_level,
    reward_name: level.reward_name,
    points_required: level.points_required,
    points_remaining: Math.max(level.points_required - totalPoints, 0),
  }
}

export const getCurrentRewardLevel = (totalPoints: number) => {
  if (totalPoints >= 50) return 5
  if (totalPoints >= 35) return 4
  if (totalPoints >= 20) return 3
  if (totalPoints >= 10) return 2
  if (totalPoints >= 5) return 1
  return 0
}
