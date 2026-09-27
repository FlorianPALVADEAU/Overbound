import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { Upsell, UpsellImage } from '@/types/Upsell'

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
  images?: Array<Pick<UpsellImage, 'source' | 'external_url' | 'alt_text' | 'position'>>
  options?: Upsell['options'] | null
}

interface UpsellsResponse {
  upsells: Upsell[]
}
export interface AdminUpsellsPageParams { cursor?: string | null; limit?: 25 | 50 | 100; query?: string; status?: 'all' | 'active' | 'inactive'; eventId?: string; sort?: 'created_at' | 'name' | 'price_cents'; direction?: 'asc' | 'desc' }
export interface AdminUpsellsPageResponse extends UpsellsResponse { page: { limit: number; totalCount: number; nextCursor: string | null } }

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

export const useAdminUpsellsPage = (params: AdminUpsellsPageParams = {}) => useQuery<AdminUpsellsPageResponse, Error>({
  queryKey: [...ADMIN_UPSELLS_QUERY_KEY, 'page', params],
  queryFn: async () => {
    const search = new URLSearchParams({ paginated: 'true', limit: String(params.limit ?? 50), status: params.status ?? 'all', sort: params.sort ?? 'created_at', direction: params.direction ?? 'desc' })
    if (params.cursor) search.set('cursor', params.cursor)
    if (params.query?.trim()) search.set('query', params.query.trim())
    if (params.eventId) search.set('event_id', params.eventId)
    const response = await axiosClient.get<AdminUpsellsPageResponse>(`/admin/upsells?${search.toString()}`)
    if (response.status !== 200) throw new Error('Erreur lors du chargement des upsells')
    return response.data
  },
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
