import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { ListResponse } from '@/components/admin/operations'

export type LuckyWheelRewardType =
  | 'TICKET_PERCENT_DISCOUNT'
  | 'TICKET_FIXED_DISCOUNT'
  | 'FREE_TICKET'
  | 'FREE_PRODUCT'
  // Legacy, ambiguous (percent or fixed?) -- kept only so a reward still
  // saved under one of these can be read/opened for correction. Never
  // selectable for a new reward (RewardFormDialog.tsx). See
  // src/lib/luckyWheel/redemption.ts header, 2026-09-27.
  | 'PRODUCT_DISCOUNT'
  | 'PHOTO_DISCOUNT'
  | 'PRODUCT_PERCENT_DISCOUNT'
  | 'PRODUCT_FIXED_DISCOUNT'
  | 'PHOTO_PERCENT_DISCOUNT'
  | 'PHOTO_FIXED_DISCOUNT'
  | 'FREE_PHOTO_PACK'
  | 'CUSTOM'

export type LuckyWheelCommercialPhase = 'LAUNCH' | 'STANDARD' | 'HIGH_DEMAND'

export interface LuckyWheelCampaign {
  id: string
  name: string
  enabled: boolean
  paused: boolean
  starts_at: string
  ends_at: string
  trigger_rules: Record<string, unknown>
  commercial_phase: LuckyWheelCommercialPhase
  reward_expiration_hours: number
  max_discount_budget: number | null
  events: { event_id: string }[]
  rewards: { id: string }[]
  created_at: string
  updated_at: string
}

export interface LuckyWheelReward {
  id: string
  campaign_id: string
  name: string
  type: LuckyWheelRewardType
  weight: number | null
  probability: number | null
  stock: number | null
  max_wins: number | null
  wins_count: number
  public_value: number | null
  estimated_cost: number | null
  minimum_basket: number | null
  valid_from: string | null
  valid_until: string | null
  commercial_phases: LuckyWheelCommercialPhase[]
  enabled: boolean
  image_url: string | null
  // FDR-0014 addendum (product-line discounts) §3.1: required for
  // PRODUCT_DISCOUNT/PHOTO_DISCOUNT, null for every other type.
  target_upsell_id: string | null
  created_at: string
  updated_at: string
}

export interface LuckyWheelCampaignPayload {
  name: string
  enabled: boolean
  paused: boolean
  starts_at: string
  ends_at: string
  trigger_rules?: Record<string, unknown>
  commercial_phase: LuckyWheelCommercialPhase
  reward_expiration_hours: number
  max_discount_budget: number | null
  event_ids: string[]
}

export interface LuckyWheelRewardPayload {
  campaign_id: string
  name: string
  type: LuckyWheelRewardType
  weight?: number | null
  probability?: number | null
  stock?: number | null
  max_wins?: number | null
  public_value?: number | null
  estimated_cost?: number | null
  minimum_basket?: number | null
  valid_from?: string | null
  valid_until?: string | null
  commercial_phases?: LuckyWheelCommercialPhase[]
  enabled: boolean
  image_url?: string | null
  target_upsell_id?: string | null
}

const ADMIN_LUCKY_WHEEL_CAMPAIGNS_QUERY_KEY = ['admin', 'lucky-wheel', 'campaigns'] as const
const ADMIN_LUCKY_WHEEL_REWARDS_QUERY_KEY = (campaignId: string) =>
  ['admin', 'lucky-wheel', 'rewards', campaignId] as const

const isSuccessStatus = (status: number) => status >= 200 && status < 300

// Campaigns ---------------------------------------------------------------

const fetchAdminLuckyWheelCampaigns = async (): Promise<LuckyWheelCampaign[]> => {
  const response = await axiosClient.get<{ campaigns: LuckyWheelCampaign[] }>('/admin/lucky-wheel/campaigns')
  if (!isSuccessStatus(response.status)) {
    throw new Error('Erreur lors du chargement des campagnes Lucky Wheel')
  }
  return response.data.campaigns ?? []
}

export const useAdminLuckyWheelCampaigns = () =>
  useQuery<LuckyWheelCampaign[], Error>({
    queryKey: ADMIN_LUCKY_WHEEL_CAMPAIGNS_QUERY_KEY,
    queryFn: fetchAdminLuckyWheelCampaigns,
  })

export const useAdminLuckyWheelCampaignsPage = (params: { cursor?: string | null; limit?: number; search?: string }) =>
  useQuery<ListResponse<LuckyWheelCampaign>, Error>({
    queryKey: [...ADMIN_LUCKY_WHEEL_CAMPAIGNS_QUERY_KEY, 'page', params],
    queryFn: async () => {
      const query = new URLSearchParams({ paginated: 'true', limit: String(params.limit ?? 25) })
      if (params.cursor) query.set('cursor', params.cursor)
      if (params.search?.trim()) query.set('search', params.search.trim())
      const response = await axiosClient.get<{ campaigns: LuckyWheelCampaign[]; page: { nextCursor: string | null; totalCount: number } }>(`/admin/lucky-wheel/campaigns?${query.toString()}`)
      return { items: response.data.campaigns ?? [], nextCursor: response.data.page.nextCursor, total: response.data.page.totalCount }
    },
  })

export const createAdminLuckyWheelCampaign = async (
  payload: LuckyWheelCampaignPayload,
): Promise<LuckyWheelCampaign> => {
  const response = await axiosClient.post<{ campaign: LuckyWheelCampaign }>('/admin/lucky-wheel/campaigns', payload)
  if (!isSuccessStatus(response.status)) {
    throw new Error('Erreur lors de la création de la campagne')
  }
  return response.data.campaign
}

export const updateAdminLuckyWheelCampaign = async (
  id: string,
  payload: LuckyWheelCampaignPayload,
): Promise<LuckyWheelCampaign> => {
  const response = await axiosClient.put<{ campaign: LuckyWheelCampaign }>(`/admin/lucky-wheel/campaigns/${id}`, payload)
  if (!isSuccessStatus(response.status)) {
    throw new Error('Erreur lors de la mise à jour de la campagne')
  }
  return response.data.campaign
}

export const deleteAdminLuckyWheelCampaign = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/admin/lucky-wheel/campaigns/${id}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression de la campagne')
    }
    throw error
  }
}

/** FDR-0014 §10/§12: emergency control. Touches only `paused`. */
export const pauseAdminLuckyWheelCampaign = async (
  id: string,
  paused: boolean,
): Promise<Pick<LuckyWheelCampaign, 'id' | 'name' | 'enabled' | 'paused'>> => {
  const response = await axiosClient.post<{
    campaign: Pick<LuckyWheelCampaign, 'id' | 'name' | 'enabled' | 'paused'>
  }>(`/admin/lucky-wheel/campaigns/${id}/pause`, { paused })
  if (!isSuccessStatus(response.status)) {
    throw new Error('Erreur lors du changement de statut de la campagne')
  }
  return response.data.campaign
}

export const adminLuckyWheelCampaignsQueryKey = ADMIN_LUCKY_WHEEL_CAMPAIGNS_QUERY_KEY

// Rewards -------------------------------------------------------------------

const fetchAdminLuckyWheelRewards = async (campaignId: string): Promise<LuckyWheelReward[]> => {
  const response = await axiosClient.get<{ rewards: LuckyWheelReward[] }>('/admin/lucky-wheel/rewards', {
    params: { campaign_id: campaignId },
  })
  if (!isSuccessStatus(response.status)) {
    throw new Error('Erreur lors du chargement des récompenses')
  }
  return response.data.rewards ?? []
}

export const useAdminLuckyWheelRewards = (campaignId: string | null) =>
  useQuery<LuckyWheelReward[], Error>({
    queryKey: ADMIN_LUCKY_WHEEL_REWARDS_QUERY_KEY(campaignId ?? 'none'),
    queryFn: () => fetchAdminLuckyWheelRewards(campaignId as string),
    enabled: Boolean(campaignId),
  })

export const useAdminLuckyWheelRewardsPage = (campaignId: string | null, params: { cursor?: string | null; limit?: number } = {}) =>
  useQuery<ListResponse<LuckyWheelReward>, Error>({
    queryKey: [...ADMIN_LUCKY_WHEEL_REWARDS_QUERY_KEY(campaignId ?? 'none'), 'page', params],
    queryFn: async () => {
      const query = new URLSearchParams({ paginated: 'true', campaign_id: campaignId as string, limit: String(params.limit ?? 25) })
      if (params.cursor) query.set('cursor', params.cursor)
      const response = await axiosClient.get<{ rewards: LuckyWheelReward[]; page: { nextCursor: string | null; totalCount: number } }>(`/admin/lucky-wheel/rewards?${query.toString()}`)
      return { items: response.data.rewards ?? [], nextCursor: response.data.page.nextCursor, total: response.data.page.totalCount }
    },
    enabled: Boolean(campaignId),
  })

export const createAdminLuckyWheelReward = async (
  payload: LuckyWheelRewardPayload,
): Promise<LuckyWheelReward> => {
  const response = await axiosClient.post<{ reward: LuckyWheelReward }>('/admin/lucky-wheel/rewards', payload)
  if (!isSuccessStatus(response.status)) {
    throw new Error('Erreur lors de la création de la récompense')
  }
  return response.data.reward
}

export const updateAdminLuckyWheelReward = async (
  id: string,
  payload: Omit<LuckyWheelRewardPayload, 'campaign_id'>,
): Promise<LuckyWheelReward> => {
  const response = await axiosClient.put<{ reward: LuckyWheelReward }>(`/admin/lucky-wheel/rewards/${id}`, payload)
  if (!isSuccessStatus(response.status)) {
    throw new Error('Erreur lors de la mise à jour de la récompense')
  }
  return response.data.reward
}

export const deleteAdminLuckyWheelReward = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/admin/lucky-wheel/rewards/${id}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression de la récompense')
    }
    throw error
  }
}

export const adminLuckyWheelRewardsQueryKey = ADMIN_LUCKY_WHEEL_REWARDS_QUERY_KEY
