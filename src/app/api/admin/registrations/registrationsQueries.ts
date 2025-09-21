import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type {
  AdminRegistration,
  RegistrationApprovalStatus,
} from '@/types/Registration'

interface RegistrationsResponse {
  registrations: AdminRegistration[]
  totalCount: number
}

export interface AdminRegistrationsParams {
  eventId?: string
  approvalFilter?: RegistrationApprovalStatus | 'all'
  searchTerm?: string
  limit?: number
  offset?: number
}

const ADMIN_REGISTRATIONS_QUERY_BASE_KEY = ['admin', 'registrations'] as const

const buildQueryKey = (params: AdminRegistrationsParams) => [
  ...ADMIN_REGISTRATIONS_QUERY_BASE_KEY,
  params.eventId ?? null,
  params.approvalFilter ?? 'all',
  params.searchTerm ?? '',
  params.limit ?? null,
  params.offset ?? null,
] as const

const fetchAdminRegistrations = async (
  params: AdminRegistrationsParams
): Promise<RegistrationsResponse> => {
  const searchParams = new URLSearchParams()

  if (params.eventId) searchParams.set('event_id', params.eventId)
  if (params.approvalFilter && params.approvalFilter !== 'all') {
    searchParams.set('approval_filter', params.approvalFilter)
  }
  if (params.approvalFilter === 'all') {
    searchParams.set('approval_filter', 'all')
  }
  if (params.searchTerm) searchParams.set('search_term', params.searchTerm)
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit))
  if (typeof params.offset === 'number') searchParams.set('offset', String(params.offset))

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const response = await axiosClient.get<RegistrationsResponse>(
    `/admin/registrations${suffix}`
  )

  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des inscriptions')
  }

  return response.data
}

export const useAdminRegistrations = (params: AdminRegistrationsParams) =>
  useQuery<RegistrationsResponse, Error>({
    queryKey: buildQueryKey(params),
    queryFn: () => fetchAdminRegistrations(params),
  })

export const updateAdminRegistrationApproval = async (
  registrationId: string,
  status: Exclude<RegistrationApprovalStatus, 'pending'>,
  reason?: string
): Promise<void> => {
  try {
    await axiosClient.post('/admin/registrations/approval', {
      registration_id: registrationId,
      status,
      reason: reason || null,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la mise à jour du statut')
    }
    throw error
  }
}

export const adminRegistrationsQueryKeyBase = ADMIN_REGISTRATIONS_QUERY_BASE_KEY
export const adminRegistrationsBuildKey = buildQueryKey
