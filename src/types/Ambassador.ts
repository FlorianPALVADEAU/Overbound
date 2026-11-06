import { Timestamp, UUID } from './base.type'

export type AmbassadorRaceFormat = 'open' | 'ranked'
export type AmbassadorPaymentStatus = 'paid' | 'pending' | 'refunded' | 'cancelled'
export type AmbassadorRewardStatus = 'earned' | 'claimed' | 'fulfilled' | 'cancelled'
export type AmbassadorRewardKind = 'recognition' | 'discount' | 'bib' | 'perk' | 'merch' | 'refund'

/** One step of the reward ladder, as configured in `ambassador_reward_levels`. */
export interface AmbassadorRewardLevel {
  reward_level: number
  reward_name: string
  points_required: number
  description: string
  badge_label: string
  kind: AmbassadorRewardKind
}

/** One bonus reward per `interval_points` above `base_points`, as configured in `ambassador_program_rules`. */
export interface AmbassadorBonusRule {
  base_points: number
  interval_points: number
  reward_name: string
}

export interface AmbassadorProgramRules {
  levels: AmbassadorRewardLevel[]
  bonus: AmbassadorBonusRule | null
}

export interface AmbassadorReward {
  id: UUID
  reward_level: number
  reward_name: string
  kind: AmbassadorRewardKind
  points_required: number
  status: AmbassadorRewardStatus
  program_year: number
  earned_at: Timestamp
  /** End of the season. Null: no expiry. */
  expires_at: Timestamp | null
  claimed_at: Timestamp | null
  fulfilled_at: Timestamp | null
}

/** counted: points credited. revoked: credited then taken back (refund, cancellation). none: no point (unpaid, own registration, free). */
export type AmbassadorPointsStatus = 'counted' | 'revoked' | 'none'

export interface AmbassadorRecruitRow {
  id: UUID
  name: string | null
  signup_date: Timestamp | null
  race_format: AmbassadorRaceFormat
  payment_status: AmbassadorPaymentStatus
  points: number
  points_status: AmbassadorPointsStatus
  order_id: UUID | null
}

export interface AmbassadorNextReward {
  reward_level: number
  reward_name: string
  points_required: number
  points_remaining: number
}

export interface AmbassadorLeaderboardEntry {
  rank: number
  name: string
  points: number
  is_current_user: boolean
}

/** The ambassador directly above the viewer, and how many points it takes to pass them. */
export interface AmbassadorChaseTarget {
  name: string
  points_to_pass: number
}

export interface AmbassadorLeaderboard {
  /** Only ambassadors with at least one point are ranked. */
  total_ranked: number
  current_user_rank: number | null
  /** The viewer's own points when ranked, otherwise null. Shown on the "Toi" row outside the top. */
  current_points?: number | null
  top: AmbassadorLeaderboardEntry[]
  chase: AmbassadorChaseTarget | null
}

/** What an ambassador kept from a closed edition: the final total and the rewards actually claimed. */
export interface AmbassadorPreviousEdition {
  label: string
  total_points: number
  rewards: Array<{ id: UUID; reward_name: string; kind: AmbassadorRewardKind; status: AmbassadorRewardStatus }>
}

export interface AmbassadorDashboardData {
  program: AmbassadorProgramRules
  /** When the rewards of the running season expire. Null: not set. */
  season_ends_at: Timestamp | null
  /** Event open for sales: the shared link lands on its page. Null: the link points at the home page. */
  open_event_slug: string | null
  code: string | null
  total_points: number
  points_breakdown: {
    open_count: number
    ranked_count: number
  }
  /** Rewards of the running season, cancelled ones excluded. */
  rewards: AmbassadorReward[]
  next_reward: AmbassadorNextReward | null
  leaderboard: AmbassadorLeaderboard
  recruits_table: AmbassadorRecruitRow[]
  previous_edition: AmbassadorPreviousEdition | null
}
