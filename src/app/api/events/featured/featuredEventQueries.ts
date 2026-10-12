import { useQuery } from '@tanstack/react-query'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import type { EventPriceTier } from '@/types/EventPriceTier'

export interface FeaturedEventResponse {
  event: (Event & { tickets?: Ticket[]; price_tiers?: EventPriceTier[] }) | null
  availableSpots?: number
}

export const FEATURED_EVENT_QUERY_KEY = ['events', 'featured'] as const

const fetchFeaturedEvent = async (): Promise<FeaturedEventResponse> => {
  const response = await fetch('/api/events/featured')
  if (!response.ok) {
    throw new Error("Impossible de récupérer l'événement à venir")
  }
  return (await response.json()) as FeaturedEventResponse
}

export const useFeaturedEvent = () =>
  useQuery<FeaturedEventResponse, Error>({
    queryKey: FEATURED_EVENT_QUERY_KEY,
    queryFn: fetchFeaturedEvent,
    staleTime: 60 * 1000,
  })
