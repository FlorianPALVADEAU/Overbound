import { useQuery } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'

export interface AdminUser {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  role: 'user' | 'volunteer' | 'admin'
  phone: string | null
  profile_created_at: string | null
  date_of_birth: string | null
  marketing_opt_in: boolean | null
}

interface AdminUsersResponse {
  users: AdminUser[]
  total: number
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
  payload: Partial<Pick<AdminUser, 'role' | 'full_name' | 'phone' | 'date_of_birth' | 'marketing_opt_in'>>,
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
