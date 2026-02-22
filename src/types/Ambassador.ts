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

export interface AmbassadorDashboardData {
  code: string | null
  total_points: number
  points_breakdown: {
    open_count: number
    ranked_count: number
  }
  rewards: AmbassadorReward[]
  next_reward: AmbassadorNextReward | null
  recruits_table: AmbassadorRecruitRow[]
}
