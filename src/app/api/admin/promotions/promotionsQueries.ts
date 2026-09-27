'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { Promotion, PromotionType, PopupConfig } from '@/types/Promotion'

export interface AdminPromotionPayload {
  type: PromotionType
  title: string
  description: string
  link_url: string
  link_text: string
  starts_at: string
  ends_at: string
  is_active: boolean
  popup_config: PopupConfig | null
}

interface PromotionsResponse {
  promotions: Promotion[]
  page?: { limit: number; totalCount: number; nextCursor: string | null }
}
export interface AdminPromotionsPage { promotions: Promotion[]; page: NonNullable<PromotionsResponse['page']> }

interface PromotionResponse {
  promotion: Promotion
}

export const adminPromotionsQueryKey = ['admin', 'promotions'] as const

const fetchAdminPromotions = async (): Promise<Promotion[]> => {
  const response = await axiosClient.get<PromotionsResponse>('/admin/promotions')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des promotions')
  }
  return response.data.promotions ?? []
}

export const useAdminPromotions = () =>
  useQuery<Promotion[], Error>({
    queryKey: adminPromotionsQueryKey,
    queryFn: fetchAdminPromotions,
  })

export interface AdminPromotionsPageParams { cursor?: string | null; limit?: number; query?: string; status?: 'all' | 'running' | 'upcoming' | 'expired' | 'inactive'; sort?: 'starts_at' | 'ends_at' | 'created_at' | 'title'; direction?: 'asc' | 'desc' }
const fetchAdminPromotionsPage = async (params: AdminPromotionsPageParams = {}): Promise<AdminPromotionsPage> => { const search = new URLSearchParams({ paginated: 'true' }); for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') search.set(key, String(value)); const response = await axiosClient.get<PromotionsResponse>(`/admin/promotions?${search}`); if (response.status !== 200 || !response.data.page) throw new Error('Erreur lors du chargement des promotions'); return { promotions: response.data.promotions ?? [], page: response.data.page } }
export const useAdminPromotionsPage = (params: AdminPromotionsPageParams = {}) => useQuery<AdminPromotionsPage, Error>({ queryKey: [...adminPromotionsQueryKey, 'page', params], queryFn: () => fetchAdminPromotionsPage(params) })

export const createAdminPromotion = async (
  payload: AdminPromotionPayload,
): Promise<Promotion> => {
  const response = await axiosClient.post<PromotionResponse>('/admin/promotions', payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la création de la promotion')
  }
  return response.data.promotion
}

export const updateAdminPromotion = async (
  id: string,
  payload: AdminPromotionPayload,
): Promise<Promotion> => {
  const response = await axiosClient.put<PromotionResponse>(`/admin/promotions/${id}`, payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la mise à jour de la promotion')
  }
  return response.data.promotion
}

export const deleteAdminPromotion = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/admin/promotions/${id}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
    throw error
  }
}
