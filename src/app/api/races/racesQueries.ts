import { useQuery } from '@tanstack/react-query'

export interface RaceListItem {
  id: string
  name: string
  logo_url?: string | null
  type: string
  difficulty: number
  target_public: string
  distance_km: number | null
  description?: string | null
  obstacles?: Array<{
    order_position: number
    is_mandatory: boolean
    obstacle: {
      id: string
      name: string
      type: string
      difficulty: number
    }
  }>
}

const fetchRaces = async (): Promise<RaceListItem[]> => {
  const response = await fetch('/api/races', { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer les courses')
  }
  return (await response.json()) as RaceListItem[]
}

export const useRaces = () =>
  useQuery<RaceListItem[], Error>({
    queryKey: ['races'],
    queryFn: fetchRaces,
    staleTime: 60 * 1000,
  })
