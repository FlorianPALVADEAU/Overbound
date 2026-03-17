import { Timestamp, UUID } from './base.type'

export type AmbassadorRaceFormat = 'open' | 'ranked'
export type AmbassadorPaymentStatus = 'paid' | 'pending' | 'refunded' | 'cancelled'
export type AmbassadorRewardStatus = 'earned' | 'claimed' | 'fulfilled'

export interface AmbassadorReward {
  id: UUID
  reward_level: number
  reward_name: string
  status: AmbassadorRewardStatus
  earned_at: Timestamp
  claimed_at: Timestamp | null
  fulfilled_at: Timestamp | null
}

export interface AmbassadorRecruitRow {
  id: UUID
  name: string | null
  signup_date: Timestamp | null
  race_format: AmbassadorRaceFormat
  payment_status: AmbassadorPaymentStatus
  points: number
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

export interface AmbassadorDashboardData {
  code: string | null
  total_points: number
  points_breakdown: {
    open_count: number
    ranked_count: number
  }
  rewards: AmbassadorReward[]
  next_reward: AmbassadorNextReward | null
  leaderboard: {
    current_user_rank: number | null
    total_ambassadors: number
    top: AmbassadorLeaderboardEntry[]
  }
  recruits_table: AmbassadorRecruitRow[]
}
