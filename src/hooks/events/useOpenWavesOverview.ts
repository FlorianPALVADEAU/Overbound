import { useQuery } from '@tanstack/react-query'

export interface OverviewWave {
  wave_index: number
  start_time: string
  remaining: number
}

export interface OverviewTicket {
  ticket_id: string
  ticket_name: string
  waves: OverviewWave[]
}

export const useOpenWavesOverview = (eventId: string) =>
  useQuery<OverviewTicket[], Error>({
    queryKey: ['events', eventId, 'open-waves-overview'],
    enabled: Boolean(eventId),
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/open-waves/overview`)
      if (!response.ok) throw new Error('Impossible de récupérer les départs')
      const body = (await response.json()) as { tickets: OverviewTicket[] }
      return body.tickets
    },
  })
