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
}

interface ObstaclesResponse {
  obstacles: Obstacle[]
}

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
