import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'

export interface AdminAmbassadorCodeRow {
  id: string
  promotional_code_id: string
  code: string | null
  name: string | null
  is_active: boolean
  is_current: boolean
  assigned_at: string
}

export interface AdminAmbassadorCodesResponse {
  codes: AdminAmbassadorCodeRow[]
}

export interface AdminPromoCodeOption {
  id: string
  code: string
  name: string | null
  is_active: boolean
  assigned_profile_id: string | null
}

export interface AdminPromoCodesResponse {
  codes: AdminPromoCodeOption[]
}

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

export const ambassadorCodesQueryKey = (ambassadorId: string) =>
  ['admin', 'ambassadors', ambassadorId, 'promo-codes'] as const

export const useAmbassadorCodes = (ambassadorId: string | null) =>
  useQuery<AdminAmbassadorCodesResponse, Error>({
    queryKey: ambassadorCodesQueryKey(ambassadorId ?? ''),
    enabled: Boolean(ambassadorId),
    queryFn: async () => {
      const response = await axiosClient.get<AdminAmbassadorCodesResponse>(
        `/admin/ambassadors/${ambassadorId}/promo-codes`,
      )
      if (response.status !== 200) throw new Error('Erreur lors du chargement des codes')
      return response.data
    },
  })

const ADMIN_PROMO_CODES_QUERY_KEY = ['admin', 'ambassadors', 'promo-codes'] as const

export const useAdminPromoCodes = () =>
  useQuery<AdminPromoCodesResponse, Error>({
    queryKey: ADMIN_PROMO_CODES_QUERY_KEY,
    queryFn: async () => {
      const response = await axiosClient.get<AdminPromoCodesResponse>('/admin/ambassadors/promo-codes')
      if (response.status !== 200) throw new Error('Erreur lors du chargement des codes promo')
      return response.data
    },
  })

export const useAssignAmbassadorCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      ambassador_id: string
      promotional_code_id: string
      set_as_current: boolean
    }) => {
      const response = await axiosClient.post<{ code: AdminAmbassadorCodeRow }>(
        `/admin/ambassadors/${payload.ambassador_id}/promo-codes`,
        {
          promotional_code_id: payload.promotional_code_id,
          set_as_current: payload.set_as_current,
        },
      )
      if (response.status !== 200) throw new Error('Erreur lors de l\'assignation du code')
      return response.data.code
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ambassadorCodesQueryKey(variables.ambassador_id) })
      queryClient.invalidateQueries({ queryKey: ADMIN_AMBASSADOR_POINTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ADMIN_PROMO_CODES_QUERY_KEY })
    },
  })
}

export const useSetCurrentAmbassadorCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { ambassador_id: string; junction_id: string }) => {
      const response = await axiosClient.patch<{ code: AdminAmbassadorCodeRow }>(
        `/admin/ambassadors/${payload.ambassador_id}/promo-codes/${payload.junction_id}`,
      )
      if (response.status !== 200) throw new Error('Erreur lors de la mise à jour du code courant')
      return response.data.code
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ambassadorCodesQueryKey(variables.ambassador_id) })
      queryClient.invalidateQueries({ queryKey: ADMIN_AMBASSADOR_POINTS_QUERY_KEY })
    },
  })
}

export const useRemoveAmbassadorCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { ambassador_id: string; junction_id: string }) => {
      const response = await axiosClient.delete(
        `/admin/ambassadors/${payload.ambassador_id}/promo-codes/${payload.junction_id}`,
      )
      if (response.status !== 200) throw new Error('Erreur lors de la suppression du code')
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ambassadorCodesQueryKey(variables.ambassador_id) })
      queryClient.invalidateQueries({ queryKey: ADMIN_AMBASSADOR_POINTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ADMIN_PROMO_CODES_QUERY_KEY })
    },
  })
}

export const useAddManualReferralWithPoints = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      ambassador_id: string
      referral_email: string
      points: number
      race_format?: 'auto' | 'open' | 'ranked'
    }) => {
      const response = await axiosClient.post<{
        success: boolean
        registration_id: string
        email: string
        points_credited: number
        already_credited: boolean
      }>('/admin/ambassadors/manual-referrals', {
        ...payload,
        race_format: payload.race_format ?? 'auto',
      })
      if (response.status !== 200) {
        throw new Error('Erreur lors de l’ajout du filleul manuel')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_AMBASSADOR_POINTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ADMIN_AMBASSADORS_QUERY_KEY })
    },
  })
}
