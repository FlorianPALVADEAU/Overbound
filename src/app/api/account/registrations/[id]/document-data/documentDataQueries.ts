import { useQuery } from '@tanstack/react-query'
import type { Registration } from '@/types/Registration'

export interface RegistrationDocumentResponse {
  registration: Registration & {
    ticket: any
    event: any
  }
}

const registrationDocumentKey = (id: string) => ['account', 'registration', id, 'document'] as const

const fetchRegistrationDocument = async (id: string) => {
  const response = await fetch(`/api/account/registrations/${id}/document-data`, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer cette inscription')
  }
  return (await response.json()) as RegistrationDocumentResponse
}

export const useRegistrationDocument = (id: string, options?: { enabled?: boolean }) =>
  useQuery<RegistrationDocumentResponse, Error>({
    queryKey: registrationDocumentKey(id),
    queryFn: () => fetchRegistrationDocument(id),
    enabled: options?.enabled ?? Boolean(id),
  })
