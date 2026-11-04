import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'
import type {
  AdminAmbassadorHistoryResponse,
  AdminAmbassadorListResponse,
  AdminAmbassadorReferralsResponse,
  AdminAmbassadorSheetResponse,
} from '@/lib/admin/ambassadors/types'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'

/**
 * Every admin ambassador query and mutation lives under `['admin', 'ambassadors']`, so a write refreshes the
 * list, the sheets and the tabs at once. The season is part of the key, `current` when none is chosen.
 */
const AMBASSADORS_KEY = ['admin', 'ambassadors'] as const
const seasonKey = (season: number | null) => season ?? 'current'

export const ambassadorListKey = (season: number | null) => [...AMBASSADORS_KEY, 'list', seasonKey(season)] as const
export const ambassadorSheetKey = (ambassadorId: string, season: number | null) =>
  [...AMBASSADORS_KEY, ambassadorId, 'sheet', seasonKey(season)] as const
export const ambassadorReferralsKey = (ambassadorId: string) => [...AMBASSADORS_KEY, ambassadorId, 'referrals'] as const
export const ambassadorHistoryKey = (ambassadorId: string) => [...AMBASSADORS_KEY, ambassadorId, 'history'] as const
export const ambassadorCodesKey = (ambassadorId: string) => [...AMBASSADORS_KEY, ambassadorId, 'promo-codes'] as const
const PROMO_CODE_OPTIONS_KEY = [...AMBASSADORS_KEY, 'promo-code-options'] as const

const yearParams = (season: number | null) => (season ? { params: { year: season } } : undefined)

export const useAdminAmbassadors = (season: number | null) =>
  useQuery<AdminAmbassadorListResponse, Error>({
    queryKey: ambassadorListKey(season),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await axiosClient.get<AdminAmbassadorListResponse>('/admin/ambassadors', yearParams(season))
      return response.data
    },
  })

export const useAdminAmbassadorSheet = (ambassadorId: string, season: number | null) =>
  useQuery<AdminAmbassadorSheetResponse, Error>({
    queryKey: ambassadorSheetKey(ambassadorId, season),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await axiosClient.get<AdminAmbassadorSheetResponse>(`/admin/ambassadors/${ambassadorId}`, yearParams(season))
      return response.data
    },
  })

export const useAdminAmbassadorReferrals = (ambassadorId: string) =>
  useQuery<AdminAmbassadorReferralsResponse, Error>({
    queryKey: ambassadorReferralsKey(ambassadorId),
    queryFn: async () => {
      const response = await axiosClient.get<AdminAmbassadorReferralsResponse>(`/admin/ambassadors/${ambassadorId}/referrals`)
      return response.data
    },
  })

export const useAdminAmbassadorHistory = (ambassadorId: string) =>
  useQuery<AdminAmbassadorHistoryResponse, Error>({
    queryKey: ambassadorHistoryKey(ambassadorId),
    queryFn: async () => {
      const response = await axiosClient.get<AdminAmbassadorHistoryResponse>(`/admin/ambassadors/${ambassadorId}/history`)
      return response.data
    },
  })

/** Refreshes everything the admin ambassador screens show. Used by every write. */
const useInvalidateAmbassadors = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: AMBASSADORS_KEY })
}

export const useSetRewardStatus = () => {
  const invalidate = useInvalidateAmbassadors()
  return useMutation({
    mutationFn: async (payload: { rewardId: string; status: Exclude<AmbassadorRewardStatus, 'cancelled'> }) => {
      await axiosClient.patch(`/admin/ambassador-rewards/${payload.rewardId}`, { status: payload.status })
    },
    onSuccess: invalidate,
  })
}

export const useTransitionAmbassadorReward = () => {
  const invalidate = useInvalidateAmbassadors()
  return useMutation({
    mutationFn: async (payload: { rewardId: string; action: 'cancelled' | 'reopened'; reason: string; idempotency_key: string }) => {
      await axiosClient.patch(`/admin/ambassador-rewards/${payload.rewardId}`, {
        action: payload.action,
        reason: payload.reason,
        idempotency_key: payload.idempotency_key,
      })
    },
    onSuccess: invalidate,
  })
}

export interface UpdateAmbassadorPointsInput {
  ambassadorId: string
  total_points: number
  recruits_open: number
  recruits_ranked: number
  program_year: number
  reason: string
  idempotency_key: string
}

export const useUpdateAmbassadorPoints = () => {
  const invalidate = useInvalidateAmbassadors()
  return useMutation({
    mutationFn: async ({ ambassadorId, ...payload }: UpdateAmbassadorPointsInput) => {
      await axiosClient.patch(`/admin/ambassadors/${ambassadorId}/points`, payload)
    },
    onSuccess: invalidate,
  })
}

export interface AddManualReferralInput {
  ambassadorId: string
  referral_email: string
  points: number
  race_format: 'auto' | 'open' | 'ranked'
}

export interface AddManualReferralResult {
  success: boolean
  registration_id: string
  email: string
  points_credited: number
  already_credited: boolean
}

export const useAddManualReferral = () => {
  const invalidate = useInvalidateAmbassadors()
  return useMutation({
    mutationFn: async ({ ambassadorId, ...payload }: AddManualReferralInput) => {
      const response = await axiosClient.post<AddManualReferralResult>(`/admin/ambassadors/${ambassadorId}/referrals`, payload)
      return response.data
    },
    onSuccess: invalidate,
  })
}

export interface AmbassadorCodeRow {
  id: string
  promotional_code_id: string
  code: string | null
  name: string | null
  is_active: boolean
  is_current: boolean
  assigned_at: string
}

export interface PromoCodeOption {
  id: string
  code: string
  name: string | null
  is_active: boolean
  assigned_profile_id: string | null
}

export const useAmbassadorCodes = (ambassadorId: string) =>
  useQuery<{ codes: AmbassadorCodeRow[] }, Error>({
    queryKey: ambassadorCodesKey(ambassadorId),
    queryFn: async () => {
      const response = await axiosClient.get<{ codes: AmbassadorCodeRow[] }>(`/admin/ambassadors/${ambassadorId}/promo-codes`)
      return response.data
    },
  })

export const useAdminPromoCodeOptions = () =>
  useQuery<{ codes: PromoCodeOption[] }, Error>({
    queryKey: PROMO_CODE_OPTIONS_KEY,
    queryFn: async () => {
      const response = await axiosClient.get<{ codes: PromoCodeOption[] }>('/admin/ambassadors/promo-codes')
      return response.data
    },
  })

export const useAssignAmbassadorCode = () => {
  const invalidate = useInvalidateAmbassadors()
  return useMutation({
    mutationFn: async (payload: { ambassadorId: string; promotional_code_id: string; set_as_current: boolean }) => {
      await axiosClient.post(`/admin/ambassadors/${payload.ambassadorId}/promo-codes`, {
        promotional_code_id: payload.promotional_code_id,
        set_as_current: payload.set_as_current,
      })
    },
    onSuccess: invalidate,
  })
}

export const useSetCurrentAmbassadorCode = () => {
  const invalidate = useInvalidateAmbassadors()
  return useMutation({
    mutationFn: async (payload: { ambassadorId: string; junctionId: string }) => {
      await axiosClient.patch(`/admin/ambassadors/${payload.ambassadorId}/promo-codes/${payload.junctionId}`)
    },
    onSuccess: invalidate,
  })
}

export const useRemoveAmbassadorCode = () => {
  const invalidate = useInvalidateAmbassadors()
  return useMutation({
    mutationFn: async (payload: { ambassadorId: string; junctionId: string }) => {
      await axiosClient.delete(`/admin/ambassadors/${payload.ambassadorId}/promo-codes/${payload.junctionId}`)
    },
    onSuccess: invalidate,
  })
}
