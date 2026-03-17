import type {
  AmbassadorNextReward,
  AmbassadorPaymentStatus,
  AmbassadorRaceFormat,
} from '@/types/Ambassador'

export const AMBASSADOR_REWARD_LEVELS = [
  { reward_level: 1, reward_name: 'Badge ambassadeur + accès classement', points_required: 1 },
  { reward_level: 2, reward_name: 'Récompense starter (réduction / avantage course)', points_required: 2 },
  { reward_level: 3, reward_name: 'Réduction 50% sur un dossard (utilisable sous 72h)', points_required: 3 },
  { reward_level: 4, reward_name: 'Dossard Open offert', points_required: 5 },
  { reward_level: 5, reward_name: 'Upgrade VIP (file prioritaire + badge spécial)', points_required: 8 },
  { reward_level: 6, reward_name: 'T-shirt ambassadeur / mise en avant réseau', points_required: 10 },
  { reward_level: 7, reward_name: 'Statut confirmé (avantages exclusifs)', points_required: 15 },
  { reward_level: 8, reward_name: 'Remboursement total', points_required: 20 },
  { reward_level: 9, reward_name: 'Dossard offert édition suivante', points_required: 25 },
  { reward_level: 10, reward_name: 'Statut ambassadeur officiel (premium)', points_required: 30 },
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
  return AMBASSADOR_REWARD_LEVELS.reduce(
    (maxUnlocked, level) => (totalPoints >= level.points_required ? level.reward_level : maxUnlocked),
    0,
  )
}
