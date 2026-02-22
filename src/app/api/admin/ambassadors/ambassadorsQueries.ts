import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'

export interface AdminAmbassadorReward {
  id: string
  ambassador_id: string
  ambassador_name: string
  ambassador_code: string | null
  profile_id: string | null
  reward_level: number
  reward_name: string
  status: AmbassadorRewardStatus
  earned_at: string
  claimed_at: string | null
  fulfilled_at: string | null
}

export interface AdminAmbassadorsResponse {
  rewards: AdminAmbassadorReward[]
}

const ADMIN_AMBASSADORS_QUERY_KEY = ['admin', 'ambassadors'] as const

export const useAdminAmbassadors = () =>
  useQuery<AdminAmbassadorsResponse, Error>({
    queryKey: ADMIN_AMBASSADORS_QUERY_KEY,
    queryFn: async () => {
      const response = await axiosClient.get<AdminAmbassadorsResponse>('/admin/ambassadors')
      if (response.status !== 200) {
        throw new Error('Erreur lors du chargement des ambassadeurs')
      }
      return response.data
    },
  })

export const useUpdateAmbassadorReward = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: string; status: AmbassadorRewardStatus }) => {
      const response = await axiosClient.patch<{ reward: AdminAmbassadorReward }>(
        `/admin/ambassadors/${payload.id}`,
        { status: payload.status },
      )
      if (response.status !== 200) {
        throw new Error('Erreur lors de la mise à jour de la récompense')
      }
      return response.data.reward
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_AMBASSADORS_QUERY_KEY })
    },
  })
}

export const adminAmbassadorsQueryKey = ADMIN_AMBASSADORS_QUERY_KEY

export interface AdminAmbassadorPointsRow {
  ambassador_id: string
  profile_id: string
  ambassador_name: string
  ambassador_code: string | null
  is_active: boolean
  total_points: number
  recruits_open: number
  recruits_ranked: number
}

export interface AdminAmbassadorPointsResponse {
  ambassadors: AdminAmbassadorPointsRow[]
}

const ADMIN_AMBASSADOR_POINTS_QUERY_KEY = ['admin', 'ambassadors', 'points'] as const

export const useAdminAmbassadorPoints = () =>
  useQuery<AdminAmbassadorPointsResponse, Error>({
    queryKey: ADMIN_AMBASSADOR_POINTS_QUERY_KEY,
    queryFn: async () => {
      const response = await axiosClient.get<AdminAmbassadorPointsResponse>('/admin/ambassadors/points')
      if (response.status !== 200) {
        throw new Error('Erreur lors du chargement des points ambassadeurs')
      }
      return response.data
    },
  })

export const useUpdateAmbassadorPoints = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      ambassador_id: string
      total_points: number
      recruits_open: number
      recruits_ranked: number
    }) => {
      const response = await axiosClient.patch<{ points: AdminAmbassadorPointsRow }>(
        `/admin/ambassadors/points/${payload.ambassador_id}`,
        {
          total_points: payload.total_points,
          recruits_open: payload.recruits_open,
          recruits_ranked: payload.recruits_ranked,
        },
      )
      if (response.status !== 200) {
        throw new Error('Erreur lors de la mise à jour des points')
      }
      return response.data.points
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_AMBASSADOR_POINTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ADMIN_AMBASSADORS_QUERY_KEY })
    },
  })
}
