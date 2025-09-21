import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { PromotionalCode } from '@/types/PromotionalCode'

export interface AdminPromotionalCodePayload {
  code: string
  name: string
  description?: string | null
  discount_percent?: number | null
  discount_amount?: number | null
  currency: PromotionalCode['currency']
  valid_from: string
  valid_until: string
  usage_limit?: number | null
  is_active: boolean
  event_ids: string[]
}

interface PromotionalCodesResponse {
  promotionalCodes: PromotionalCode[]
}

interface PromotionalCodeResponse {
  promotionalCode: PromotionalCode
}

const ADMIN_PROMO_CODES_QUERY_KEY = ['admin', 'promotional-codes'] as const

const fetchAdminPromotionalCodes = async (): Promise<PromotionalCode[]> => {
  const response = await axiosClient.get<PromotionalCodesResponse>('/admin/promotional-codes')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des codes promotionnels')
  }
  return response.data.promotionalCodes ?? []
}

export const useAdminPromotionalCodes = () =>
  useQuery<PromotionalCode[], Error>({
    queryKey: ADMIN_PROMO_CODES_QUERY_KEY,
    queryFn: fetchAdminPromotionalCodes,
  })

export const createAdminPromotionalCode = async (
  payload: AdminPromotionalCodePayload
): Promise<PromotionalCode> => {
  const response = await axiosClient.post<PromotionalCodeResponse>(
    '/admin/promotional-codes',
    payload
  )
  if (response.status !== 200) {
    throw new Error('Erreur lors de la création du code promotionnel')
  }
  return response.data.promotionalCode
}

export const updateAdminPromotionalCode = async (
  id: string,
  payload: AdminPromotionalCodePayload
): Promise<PromotionalCode> => {
  const response = await axiosClient.put<PromotionalCodeResponse>(
    `/admin/promotional-codes/${id}`,
    payload
  )
  if (response.status !== 200) {
    throw new Error('Erreur lors de la mise à jour du code promotionnel')
  }
  return response.data.promotionalCode
}

export const deleteAdminPromotionalCode = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/admin/promotional-codes/${id}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
    throw error
  }
}

export const adminPromotionalCodesQueryKey = ADMIN_PROMO_CODES_QUERY_KEY
