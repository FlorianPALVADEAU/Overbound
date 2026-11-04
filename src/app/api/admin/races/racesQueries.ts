import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { Race } from '@/types/Race'

export interface AdminRacePayload {
  name: string
  logo_url?: string | null
  type: Race['type']
  difficulty: number
  target_public: Race['target_public']
  distance_km: number
  description?: string | null
  is_universal: boolean
  obstacle_ids: string[]
}

interface RacesResponse {
  races: Race[]
}
export interface AdminRacesPageParams { cursor?: string | null; limit?: 25 | 50 | 100; query?: string; type?: Race['type']; sort?: 'created_at' | 'name' | 'difficulty' | 'distance_km'; direction?: 'asc' | 'desc' }
export interface AdminRacesPageResponse extends RacesResponse { page: { limit: number; totalCount: number; nextCursor: string | null } }

interface RaceResponse {
  race: Race
}

const ADMIN_RACES_QUERY_KEY = ['admin', 'races'] as const

const fetchAdminRaces = async (): Promise<Race[]> => {
  const response = await axiosClient.get<RacesResponse>('/admin/races')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des courses')
  }
  return response.data.races ?? []
}

export const useAdminRaces = () =>
  useQuery<Race[], Error>({
    queryKey: ADMIN_RACES_QUERY_KEY,
    queryFn: fetchAdminRaces,
  })

export const useAdminRacesPage = (params: AdminRacesPageParams = {}) => useQuery<AdminRacesPageResponse, Error>({
  queryKey: [...ADMIN_RACES_QUERY_KEY, 'page', params],
  queryFn: async () => {
    const search = new URLSearchParams({ paginated: 'true', limit: String(params.limit ?? 50), sort: params.sort ?? 'created_at', direction: params.direction ?? 'desc' })
    if (params.cursor) search.set('cursor', params.cursor)
    if (params.query?.trim()) search.set('query', params.query.trim())
    if (params.type) search.set('type', params.type)
    const response = await axiosClient.get<AdminRacesPageResponse>(`/admin/races?${search.toString()}`)
    if (response.status !== 200) throw new Error('Erreur lors du chargement des courses')
    return response.data
  },
})

export const createAdminRace = async (
  payload: AdminRacePayload
): Promise<Race> => {
  const response = await axiosClient.post<RaceResponse>('/admin/races', payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la création de la course')
  }
  return response.data.race
}

export const updateAdminRace = async (
  id: string,
  payload: AdminRacePayload
): Promise<Race> => {
  const response = await axiosClient.put<RaceResponse>(`/admin/races/${id}`, payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la mise à jour de la course')
  }
  return response.data.race
}

export const deleteAdminRace = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/admin/races/${id}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
    throw error
  }
}

export const adminRacesQueryKey = ADMIN_RACES_QUERY_KEY
