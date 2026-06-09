import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosClient from '../axiosClient'
import type { Bootcamp } from '@/types/Bootcamp'

const QUERY_KEY = ['bootcamps'] as const

const fetchBootcamps = async (): Promise<Bootcamp[]> => {
  const res = await axiosClient.get('/bootcamps')
  if (res.status !== 200) throw new Error('Erreur lors du chargement des bootcamps')
  return res.data
}

export const useGetBootcamps = () =>
  useQuery<Bootcamp[], Error>({
    queryKey: QUERY_KEY,
    queryFn: fetchBootcamps,
  })

export const useRegisterBootcamp = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (bootcampId: string) => {
      await axiosClient.post(`/bootcamps/${bootcampId}/register`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export const useUnregisterBootcamp = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (bootcampId: string) => {
      await axiosClient.delete(`/bootcamps/${bootcampId}/register`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
