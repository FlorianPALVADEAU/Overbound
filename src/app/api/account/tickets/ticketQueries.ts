import { useQuery } from '@tanstack/react-query'

export interface TicketDetailResponse {
  registration: {
    id: string
    qr_code_token: string | null
    tickets: Array<{
      name: string | null
      events: Array<{
        title: string | null
        date: string | null
        location: string | null
      } | null> | null
    } | null> | null
  }
  qr_code_data_url: string | null
}

export const TICKET_DETAIL_QUERY_KEY = (id: string) => ['account', 'ticket', id] as const

const fetchTicketDetail = async (id: string): Promise<TicketDetailResponse> => {
  const response = await fetch(`/api/account/tickets/${id}`, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Billet introuvable')
  }
  return (await response.json()) as TicketDetailResponse
}

export const useTicketDetail = (id: string, enabled: boolean) =>
  useQuery<TicketDetailResponse, Error>({
    queryKey: TICKET_DETAIL_QUERY_KEY(id),
    queryFn: () => fetchTicketDetail(id),
    enabled,
  })
