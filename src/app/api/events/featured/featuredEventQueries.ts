import { useQuery } from '@tanstack/react-query'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import type { EventPriceTier } from '@/types/EventPriceTier'

export interface FeaturedEventResponse {
  event: (Event & { tickets?: Ticket[]; price_tiers?: EventPriceTier[] }) | null
  availableSpots?: number
}

const fetchFeaturedEvent = async (): Promise<FeaturedEventResponse> => {
  const response = await fetch('/api/events/featured', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error("Impossible de récupérer l'événement à venir")
  }
  return (await response.json()) as FeaturedEventResponse
}

export const useFeaturedEvent = () =>
  useQuery<FeaturedEventResponse, Error>({
    queryKey: ['events', 'featured'],
    queryFn: fetchFeaturedEvent,
    staleTime: 60 * 1000,
  })
