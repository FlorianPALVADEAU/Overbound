import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'
import type { AmbassadorPromoCode } from '@/app/api/admin/users/usersQueries'

export interface AdminGroupMember {
  id: string
  profile_id: string
  role: 'captain' | 'member'
  joined_at: string
  full_name: string | null
  email: string | null
}

export interface AdminGroup {
  id: string
  name: string
  captain_id: string
  invite_code: string
  anchor_event_id: string | null
  anchor_wave_index: number | null
  anchor_start_time: string | null
  anchor_initialized_by: 'creator' | 'member_join' | 'admin_manual' | null
  anchor_initialized_from_profile_id: string | null
  anchor_initialized_from_profile_name: string | null
  anchor_initialized_at: string | null
  created_at: string
  members: AdminGroupMember[]
}

interface AdminGroupsResponse {
  groups: AdminGroup[]
  total: number
}

interface AdminGroupsPromoCodesResponse {
  codes: Array<Pick<AmbassadorPromoCode, 'id' | 'code' | 'name' | 'is_active'>>
}

export const adminGroupsQueryKey = ['admin', 'groups'] as const

const fetchAdminGroups = async (): Promise<AdminGroupsResponse> => {
  const response = await axiosClient.get<AdminGroupsResponse>('/admin/groups')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des groupes')
  }
  return response.data
}

export const useAdminGroups = () =>
  useQuery<AdminGroupsResponse, Error>({
    queryKey: adminGroupsQueryKey,
    queryFn: fetchAdminGroups,
  })

const ADMIN_GROUPS_PROMO_CODES_QUERY_KEY = ['admin', 'groups', 'promo-codes'] as const

const fetchAdminGroupsPromoCodes = async (): Promise<AdminGroupsPromoCodesResponse> => {
  const response = await axiosClient.get<AdminGroupsPromoCodesResponse>('/admin/groups/promotional-codes')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des codes promo')
  }
  return response.data
}

export const useAdminGroupsPromoCodes = () =>
  useQuery<AdminGroupsPromoCodesResponse, Error>({
    queryKey: ADMIN_GROUPS_PROMO_CODES_QUERY_KEY,
    queryFn: fetchAdminGroupsPromoCodes,
  })

export const useAdminCreateGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, captain_profile_id }: { name: string; captain_profile_id: string }) => {
      const response = await axiosClient.post('/admin/groups', { name, captain_profile_id })
      if (response.status !== 201) {
        throw new Error('Erreur lors de la création')
      }
      return response.data as { id: string; invite_code: string; name: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGroupsQueryKey })
    },
  })
}

export const useAdminCreateGroupFromPromoCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      name,
      promotional_code,
      captain_profile_id,
    }: {
      name: string
      promotional_code: string
      captain_profile_id: string
    }) => {
      const response = await axiosClient.post('/admin/groups/from-promocode', {
        name,
        promotional_code,
        captain_profile_id,
      })
      if (response.status !== 201) {
        throw new Error('Erreur lors de la création depuis code promo')
      }
      return response.data as {
        id: string
        invite_code: string
        members_added: number
        members_skipped_already_in_group: number
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGroupsQueryKey })
    },
  })
}

export const useAdminImportGroupMembersFromPromoCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, promotional_code }: { id: string; promotional_code: string }) => {
      const response = await axiosClient.patch(`/admin/groups/${id}`, { promotional_code })
      if (response.status !== 200) {
        throw new Error('Erreur lors de l’import depuis code promo')
      }
      return response.data as {
        ok: boolean
        imported_from_promocode: boolean
        members_added: number
        members_skipped_already_in_other_group: number
        members_skipped_already_in_this_group: number
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGroupsQueryKey })
    },
  })
}

export const useAdminRenameGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const response = await axiosClient.patch(`/admin/groups/${id}`, { name })
      if (response.status !== 200) {
        throw new Error('Erreur lors du renommage')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGroupsQueryKey })
    },
  })
}

export const useAdminUpdateGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      id: string
      name?: string
      captain_id?: string
      anchor_event_id?: string | null
      anchor_wave_index?: number | null
    }) => {
      const { id, ...body } = payload
      const response = await axiosClient.patch(`/admin/groups/${id}`, body)
      if (response.status !== 200) {
        throw new Error('Erreur lors de la mise à jour du groupe')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGroupsQueryKey })
    },
  })
}

export const useAdminDeleteGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosClient.delete(`/admin/groups/${id}`)
      if (response.status !== 200) {
        throw new Error('Erreur lors de la suppression')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGroupsQueryKey })
    },
  })
}

export const useAdminDelegateGroupCaptain = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, new_captain_id }: { id: string; new_captain_id: string }) => {
      const response = await axiosClient.post(`/admin/groups/${id}/delegate`, { new_captain_id })
      if (response.status !== 200) {
        throw new Error('Erreur lors de la délégation')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGroupsQueryKey })
    },
  })
}

export const useAdminRemoveGroupMember = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      const response = await axiosClient.delete(`/admin/groups/${id}/members/${profileId}`)
      if (response.status !== 200) {
        throw new Error('Erreur lors de l’exclusion')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGroupsQueryKey })
    },
  })
}

export const useAdminAddGroupMember = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, profile_id }: { id: string; profile_id: string }) => {
      const response = await axiosClient.post(`/admin/groups/${id}/members`, { profile_id })
      if (response.status !== 201) {
        throw new Error('Erreur lors de l’ajout du membre')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGroupsQueryKey })
    },
  })
}
