/**
 * Contract of the admin ambassador API. Shared by the route handlers (which build these shapes) and
 * the browser hooks (which read them), so neither side keeps its own copy.
 */
import type { AmbassadorRaceFormat, AmbassadorNextReward, AmbassadorPaymentStatus, AmbassadorPointsStatus, AmbassadorRewardKind, AmbassadorRewardStatus } from '@/types/Ambassador'

/** One line of the ambassador list: season totals, reward work still open, active code. */
export interface AdminAmbassadorRow {
  ambassador_id: string
  profile_id: string
  ambassador_name: string
  ambassador_code: string | null
  is_active: boolean
  total_points: number
  recruits_open: number
  recruits_ranked: number
  /** Earned rewards the ambassador has not claimed yet. */
  rewards_to_claim: number
  /** Claimed rewards the team has not sent yet. */
  rewards_to_fulfil: number
}

export interface AdminAmbassadorListResponse {
  ambassadors: AdminAmbassadorRow[]
  program_year: number
  available_program_years: number[]
}

/** A reward row as the admin sees it, every status included. */
export interface AdminSheetReward {
  id: string
  reward_level: number
  reward_name: string
  points_required: number
  status: AmbassadorRewardStatus
  program_year: number
  earned_at: string
  expires_at: string | null
  claimed_at: string | null
  fulfilled_at: string | null
  cancellation_reason: string | null
  /** The season ended before the reward was claimed. Computed by the server. */
  is_expired: boolean
}

export type AdminLadderState = 'reached' | 'next' | 'locked'

export interface AdminLadderStep {
  level: number
  name: string
  kind: AmbassadorRewardKind
  points_required: number
  state: AdminLadderState
  reward: AdminSheetReward | null
}

export interface AdminBonusSummary {
  reward_name: string
  earned: number
  next_points_required: number
}

export interface AdminAmbassadorSheetResponse {
  ambassador: {
    id: string
    profile_id: string
    name: string
    code: string | null
    is_active: boolean
  }
  /** Season shown. */
  program_year: number
  /** The running season: referrals are only listed for it. */
  current_season: number
  available_program_years: number[]
  season: {
    total_points: number
    recruits_open: number
    recruits_ranked: number
  }
  next_reward: AmbassadorNextReward | null
  ladder: AdminLadderStep[]
  bonus: AdminBonusSummary | null
  /** Rewards numbered after the ladder (bonus bibs), in level order. */
  bonus_rewards: AdminSheetReward[]
}

export interface AdminAmbassadorReferralRow {
  id: string
  name: string | null
  signup_date: string | null
  race_format: AmbassadorRaceFormat
  payment_status: AmbassadorPaymentStatus
  points: number
  points_status: AmbassadorPointsStatus
  order_id: string | null
}

export interface AdminAmbassadorReferralsResponse {
  referrals: AdminAmbassadorReferralRow[]
}

export interface AdminPointsAdjustmentEvent {
  id: string
  program_year: number
  reason: string
  before_total_points: number
  after_total_points: number
  before_recruits_open: number
  after_recruits_open: number
  before_recruits_ranked: number
  after_recruits_ranked: number
  actor_name: string | null
  created_at: string
}

export interface AdminRewardDecisionEvent {
  reward_id: string
  reward_name: string | null
  reward_level: number | null
  program_year: number | null
  action: 'cancelled' | 'reopened'
  from_status: string
  to_status: string
  reason: string
  actor_name: string | null
  occurred_at: string
}

export interface AdminAmbassadorHistoryResponse {
  point_adjustments: AdminPointsAdjustmentEvent[]
  reward_decisions: AdminRewardDecisionEvent[]
}
