'use client'

import { useQuery } from '@tanstack/react-query'
import axiosClient from '../axiosClient'
import type { Promotion } from '@/types/Promotion'

interface PromotionsResponse {
  promotions: Promotion[]
}

const PROMOTIONS_QUERY_KEY = ['site', 'promotions'] as const

const fetchPromotions = async (): Promise<Promotion[]> => {
  const response = await axiosClient.get<PromotionsResponse>('/promotions')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des promotions')
  }
  return response.data.promotions ?? []
}

export const usePromotions = () =>
  useQuery<Promotion[], Error>({
    queryKey: PROMOTIONS_QUERY_KEY,
    queryFn: fetchPromotions,
    staleTime: 1000 * 60,
  })

export const promotionsQueryKey = PROMOTIONS_QUERY_KEY
