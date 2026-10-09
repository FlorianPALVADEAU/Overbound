import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { Obstacle } from '@/types/Obstacle'

export interface AdminObstaclePayload {
  name: string
  description?: string | null
  image_url?: string | null
  video_url?: string | null
  difficulty: number
  type: Obstacle['type']
  metric_label?: string | null
  metric_value?: string | null
  weight_male?: string | null
  weight_female?: string | null
  penalty?: string | null
}

interface ObstaclesResponse {
  obstacles: Obstacle[]
  page?: { limit: number; totalCount: number; nextCursor: string | null }
}
export interface AdminObstaclesPage { obstacles: Obstacle[]; page: NonNullable<ObstaclesResponse['page']> }

interface ObstacleResponse {
  obstacle: Obstacle
}

const ADMIN_OBSTACLES_QUERY_KEY = ['admin', 'obstacles'] as const

const fetchAdminObstacles = async (): Promise<Obstacle[]> => {
  const response = await axiosClient.get<ObstaclesResponse>('/admin/obstacles')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des obstacles')
  }
  return response.data.obstacles ?? []
}

export const useAdminObstacles = () =>
  useQuery<Obstacle[], Error>({
    queryKey: ADMIN_OBSTACLES_QUERY_KEY,
    queryFn: fetchAdminObstacles,
  })

export interface AdminObstaclesPageParams {
  cursor?: string | null
  limit?: number
  query?: string
  type?: Obstacle['type']
  difficulty?: 'all' | '1-3' | '4-6' | '7-10'
  sort?: 'created_at' | 'updated_at' | 'name' | 'difficulty'
  direction?: 'asc' | 'desc'
}

const fetchAdminObstaclesPage = async (params: AdminObstaclesPageParams = {}): Promise<AdminObstaclesPage> => {
  const search = new URLSearchParams({ paginated: 'true' })
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  const response = await axiosClient.get<ObstaclesResponse>(`/admin/obstacles?${search.toString()}`)
  if (response.status !== 200 || !response.data.page) throw new Error('Erreur lors du chargement des obstacles')
  return { obstacles: response.data.obstacles ?? [], page: response.data.page }
}

export const useAdminObstaclesPage = (params: AdminObstaclesPageParams = {}) => useQuery<AdminObstaclesPage, Error>({
  queryKey: [...ADMIN_OBSTACLES_QUERY_KEY, 'page', params],
  queryFn: () => fetchAdminObstaclesPage(params),
})

export const createAdminObstacle = async (
  payload: AdminObstaclePayload
): Promise<Obstacle> => {
  const response = await axiosClient.post<ObstacleResponse>('/admin/obstacles', payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la création de l\'obstacle')
  }
  return response.data.obstacle
}

export const updateAdminObstacle = async (
  id: string,
  payload: AdminObstaclePayload
): Promise<Obstacle> => {
  const response = await axiosClient.put<ObstacleResponse>(`/admin/obstacles/${id}`, payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la mise à jour de l\'obstacle')
  }
  return response.data.obstacle
}

export const deleteAdminObstacle = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/admin/obstacles/${id}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
    throw error
  }
}

export const adminObstaclesQueryKey = ADMIN_OBSTACLES_QUERY_KEY
