import { useQuery } from '@tanstack/react-query'

export interface ClaimableRegistration {
  id: string
  user_id: string | null
  transfer_token: string | null
  claim_status: string
  qr_code_token: string | null
  ticket: {
    id: string
    name: string | null
  } | null
  event: {
    id: string
    title: string | null
    date: string | null
    location: string | null
  } | null
}

export interface ClaimDetailsResponse {
  registration: ClaimableRegistration
}

export const CLAIM_DETAILS_QUERY_KEY = (token: string) => ['account', 'claim-details', token] as const

const fetchClaimDetails = async (token: string): Promise<ClaimDetailsResponse> => {
  const params = new URLSearchParams({ token })
  const response = await fetch(`/api/account/tickets/claim?${params.toString()}`, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer ce billet')
  }
  return (await response.json()) as ClaimDetailsResponse
}

export const useClaimDetails = (token: string, enabled: boolean) =>
  useQuery<ClaimDetailsResponse, Error>({
    queryKey: CLAIM_DETAILS_QUERY_KEY(token),
    queryFn: () => fetchClaimDetails(token),
    enabled,
  })
