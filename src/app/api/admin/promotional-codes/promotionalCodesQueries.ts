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
  tier_order?: number | null
  auto_activate?: boolean
}

interface PromotionalCodesResponse {
  promotionalCodes: PromotionalCode[]
  page?: { limit: number; totalCount: number; nextCursor: string | null }
}
export interface AdminPromotionalCodesPage { promotionalCodes: PromotionalCode[]; page: NonNullable<PromotionalCodesResponse['page']> }

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

export interface AdminPromotionalCodesPageParams { cursor?: string | null; limit?: number; query?: string; status?: 'all' | 'active' | 'inactive'; sort?: 'created_at' | 'valid_from' | 'valid_until' | 'code' | 'name'; direction?: 'asc' | 'desc' }
const fetchAdminPromotionalCodesPage = async (params: AdminPromotionalCodesPageParams = {}): Promise<AdminPromotionalCodesPage> => { const search = new URLSearchParams({ paginated: 'true' }); for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') search.set(key, String(value)); const response = await axiosClient.get<PromotionalCodesResponse>(`/admin/promotional-codes?${search}`); if (response.status !== 200 || !response.data.page) throw new Error('Erreur lors du chargement des codes promotionnels'); return { promotionalCodes: response.data.promotionalCodes ?? [], page: response.data.page } }
export const useAdminPromotionalCodesPage = (params: AdminPromotionalCodesPageParams = {}) => useQuery<AdminPromotionalCodesPage, Error>({ queryKey: [...ADMIN_PROMO_CODES_QUERY_KEY, 'page', params], queryFn: () => fetchAdminPromotionalCodesPage(params) })

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
