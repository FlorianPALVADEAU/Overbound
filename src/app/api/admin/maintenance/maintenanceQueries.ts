'use client'

import { useQuery } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'

export interface AdminMaintenance {
  enabled: boolean
  message: string | null
  estimated_end: string | null
  updated_at: string | null
}

export interface AdminMaintenancePayload {
  enabled: boolean
  message: string | null
  estimated_end: string | null
}

export const adminMaintenanceQueryKey = ['admin', 'maintenance'] as const

export const useAdminMaintenance = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery<AdminMaintenance, Error>({
    queryKey: adminMaintenanceQueryKey,
    enabled,
    refetchInterval: 60_000,
    queryFn: async () => {
      const response = await axiosClient.get<{ maintenance: AdminMaintenance }>('/admin/maintenance')
      return response.data.maintenance
    },
  })

export const updateAdminMaintenance = async (payload: AdminMaintenancePayload): Promise<AdminMaintenance> => {
  const response = await axiosClient.put<{ maintenance: AdminMaintenance }>('/admin/maintenance', payload)
  return response.data.maintenance
}
