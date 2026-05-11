import { useQuery } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'

export interface AdminUser {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  role: 'user' | 'volunteer' | 'admin' | 'ambassador'
  phone: string | null
  profile_created_at: string | null
  date_of_birth: string | null
  marketing_opt_in: boolean | null
  ambassador_promotional_code_id?: string | null
  ambassador_code?: string | null
  ambassador_code_is_active?: boolean | null
  group_id?: string | null
  group_name?: string | null
  group_invite_code?: string | null
}

interface AdminUsersResponse {
  users: AdminUser[]
  total: number
}

export interface AmbassadorPromoCode {
  id: string
  code: string
  name: string | null
  is_active: boolean
  assigned_profile_id: string | null
}

const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const

const fetchAdminUsers = async (): Promise<AdminUsersResponse> => {
  const response = await axiosClient.get<AdminUsersResponse>('/admin/users')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des utilisateurs')
  }
  return response.data
}

export const useAdminUsers = () =>
  useQuery<AdminUsersResponse, Error>({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: fetchAdminUsers,
  })

export const updateAdminUser = async (
  id: string,
  payload: Partial<Pick<AdminUser, 'role' | 'full_name' | 'phone' | 'date_of_birth' | 'marketing_opt_in' | 'ambassador_promotional_code_id'>>,
) => {
  const response = await axiosClient.patch<{ profile: AdminUser }>(`/admin/users/${id}`, payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la mise à jour de l’utilisateur')
  }
  return response.data.profile
}

export const updateAdminUserRole = async (id: string, role: AdminUser['role']) =>
  updateAdminUser(id, { role })

export const deleteAdminUser = async (id: string): Promise<void> => {
  const response = await axiosClient.delete(`/admin/users/${id}`)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la suppression de l’utilisateur')
  }
}

export const adminUsersQueryKey = ADMIN_USERS_QUERY_KEY

const ADMIN_AMBASSADOR_CODES_QUERY_KEY = ['admin', 'ambassadors', 'promo-codes'] as const

const fetchAmbassadorPromoCodes = async (): Promise<{ codes: AmbassadorPromoCode[] }> => {
  const response = await axiosClient.get<{ codes: AmbassadorPromoCode[] }>('/admin/ambassadors/promo-codes')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des codes promo')
  }
  return response.data
}

export const useAmbassadorPromoCodes = () =>
  useQuery<{ codes: AmbassadorPromoCode[] }, Error>({
    queryKey: ADMIN_AMBASSADOR_CODES_QUERY_KEY,
    queryFn: fetchAmbassadorPromoCodes,
  })
