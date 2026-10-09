import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axiosClient from '../../../axiosClient'
import type { Shift } from '@/lib/volunteers/shared/Shift'
import type { AssignmentRole } from '@/lib/volunteers/planning/domain/Assignment'
import type { AutoAssignmentOutcome } from '@/lib/volunteers/planning/application/RunAutoAssignment'
import type { PlanningView } from '@/lib/volunteers/planning/application/GetPlanning'
import type { ZoneSetting } from '@/lib/volunteers/planning/domain/ZoneSetting'

export type { AutoAssignmentOutcome, PlanningView }

export interface AssignCommand {
  assignmentId?: string
  applicationId: string | null
  displayName: string
  shift: Shift
  zoneKey: string
  role: AssignmentRole
}

const planningKey = (eventId?: string) => ['admin', 'volunteers', 'planning', eventId] as const

export const useVolunteerPlanning = (eventId?: string) =>
  useQuery<PlanningView, Error>({
    queryKey: planningKey(eventId),
    enabled: Boolean(eventId),
    queryFn: async () => (await axiosClient.get<PlanningView>('/admin/volunteers/planning', { params: { eventId } })).data,
  })

export const useVolunteerPlanningActions = (eventId?: string) => {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: planningKey(eventId) })

  const autoAssign = useMutation<AutoAssignmentOutcome, Error, void>({
    mutationFn: async () =>
      (await axiosClient.post<AutoAssignmentOutcome>('/admin/volunteers/planning/auto', { eventId })).data,
    onSuccess: refresh,
  })

  const assign = useMutation<void, Error, AssignCommand>({
    mutationFn: async (command) => {
      await axiosClient.post('/admin/volunteers/planning/assignments', { action: 'assign', eventId, ...command })
    },
    onSuccess: refresh,
  })

  const remove = useMutation<void, Error, string>({
    mutationFn: async (assignmentId) => {
      await axiosClient.post('/admin/volunteers/planning/assignments', { action: 'remove', eventId, assignmentId })
    },
    onSuccess: refresh,
  })

  const configureZone = useMutation<void, Error, ZoneSetting>({
    mutationFn: async (setting) => {
      await axiosClient.put('/admin/volunteers/planning/settings', { eventId, ...setting })
    },
    onSuccess: refresh,
  })

  return { autoAssign, assign, remove, configureZone }
}

export const downloadVolunteerPlanning = async (eventId: string) => {
  const response = await axiosClient.get<Blob>('/admin/volunteers/planning/export', {
    params: { eventId },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = 'planning-benevoles.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}
