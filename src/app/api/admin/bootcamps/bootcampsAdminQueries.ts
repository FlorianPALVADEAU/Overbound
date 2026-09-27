import { useQuery, useQueryClient } from '@tanstack/react-query'
import axiosClient from '@/app/api/axiosClient'
import type { Bootcamp, BootcampFormValues, BootcampWithRegistrants } from '@/types/Bootcamp'
import type { ListResponse } from '@/components/admin/operations'

export const adminBootcampsQueryKey = ['admin', 'bootcamps'] as const

export const useAdminBootcamps = () =>
  useQuery<BootcampWithRegistrants[], Error>({
    queryKey: adminBootcampsQueryKey,
    queryFn: async () => {
      const res = await axiosClient.get('/admin/bootcamps')
      return res.data
    },
  })

export interface AdminBootcampsPageParams {
  cursor?: string | null
  limit?: number
  search?: string
}

export const adminBootcampsPageQueryKey = (params: AdminBootcampsPageParams) =>
  [...adminBootcampsQueryKey, 'page', params] as const

export const useAdminBootcampsPage = (params: AdminBootcampsPageParams) =>
  useQuery<ListResponse<BootcampWithRegistrants>, Error>({
    queryKey: adminBootcampsPageQueryKey(params),
    queryFn: async () => {
      const search = new URLSearchParams()
      if (params.cursor) search.set('cursor', params.cursor)
      search.set('limit', String(params.limit ?? 25))
      if (params.search?.trim()) search.set('search', params.search.trim())
      const res = await axiosClient.get(`/admin/bootcamps?${search.toString()}`)
      return res.data
    },
  })

export const createAdminBootcamp = async (payload: BootcampFormValues): Promise<Bootcamp> => {
  const res = await axiosClient.post('/admin/bootcamps', payload)
  return res.data
}

export const updateAdminBootcamp = async (id: string, payload: Partial<BootcampFormValues>): Promise<Bootcamp> => {
  const res = await axiosClient.patch(`/admin/bootcamps/${id}`, payload)
  return res.data
}

export const deleteAdminBootcamp = async (id: string): Promise<void> => {
  await axiosClient.delete(`/admin/bootcamps/${id}`)
}
