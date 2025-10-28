'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { Promotion } from '@/types/Promotion'

export interface AdminPromotionPayload {
  title: string
  description: string
  link_url: string
  link_text: string
  starts_at: string
  ends_at: string
  is_active: boolean
}

interface PromotionsResponse {
  promotions: Promotion[]
}

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
