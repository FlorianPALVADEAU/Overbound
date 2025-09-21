import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { Upsell } from '@/types/Upsell'

export interface AdminUpsellPayload {
  name: string
  description?: string | null
  price_cents: number
  currency: Upsell['currency']
  type: Upsell['type']
  event_id?: string | null
  is_active: boolean
  stock_quantity?: number | null
  image_url?: string | null
}

interface UpsellsResponse {
  upsells: Upsell[]
}

interface UpsellResponse {
  upsell: Upsell
}

const ADMIN_UPSELLS_QUERY_KEY = ['admin', 'upsells'] as const

const fetchAdminUpsells = async (): Promise<Upsell[]> => {
  const response = await axiosClient.get<UpsellsResponse>('/admin/upsells')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des upsells')
  }
  return response.data.upsells ?? []
}

export const useAdminUpsells = () =>
  useQuery<Upsell[], Error>({
    queryKey: ADMIN_UPSELLS_QUERY_KEY,
    queryFn: fetchAdminUpsells,
  })

export const createAdminUpsell = async (
  payload: AdminUpsellPayload
): Promise<Upsell> => {
  const response = await axiosClient.post<UpsellResponse>('/admin/upsells', payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la création de l\'upsell')
  }
  return response.data.upsell
}

export const updateAdminUpsell = async (
  id: string,
  payload: AdminUpsellPayload
): Promise<Upsell> => {
  const response = await axiosClient.put<UpsellResponse>(`/admin/upsells/${id}`, payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la mise à jour de l\'upsell')
  }
  return response.data.upsell
}

export const deleteAdminUpsell = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/admin/upsells/${id}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
    throw error
  }
}

export const adminUpsellsQueryKey = ADMIN_UPSELLS_QUERY_KEY
