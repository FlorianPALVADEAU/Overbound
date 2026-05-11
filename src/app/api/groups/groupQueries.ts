'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Group } from '@/types/Group'
import { FAKE_MY_GROUP, FAKE_NO_GROUP } from '@/lib/groups/fakeData'

const USE_FAKE = process.env.NEXT_PUBLIC_FAKE_GROUPS === 'true'

const GROUP_QUERY_KEY = ['group', 'my'] as const

async function fetchMyGroup(): Promise<Group | null> {
  if (USE_FAKE) return FAKE_NO_GROUP
  const res = await fetch('/api/groups/my')
  if (!res.ok) throw new Error('Erreur chargement groupe')
  return res.json()
}

export function useMyGroup(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: GROUP_QUERY_KEY,
    queryFn: fetchMyGroup,
    enabled: options?.enabled ?? true,
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      if (USE_FAKE) {
        await new Promise((r) => setTimeout(r, 400))
        return { id: 'fake-group-new', invite_code: 'FAKE0001' }
      }
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur création')
      return json as { id: string; invite_code: string }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUP_QUERY_KEY }),
  })
}

export function useRenameGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (USE_FAKE) {
        await new Promise((r) => setTimeout(r, 300))
        return { ok: true }
      }
      const res = await fetch(`/api/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur renommage')
      return json
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUP_QUERY_KEY }),
  })
}

export function useDisbandGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_FAKE) {
        await new Promise((r) => setTimeout(r, 300))
        return { ok: true }
      }
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur dissolution')
      return json
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUP_QUERY_KEY }),
  })
}

export function useJoinGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (invite_code: string) => {
      if (USE_FAKE) {
        await new Promise((r) => setTimeout(r, 400))
        if (invite_code.toUpperCase() !== FAKE_MY_GROUP.invite_code) {
          throw new Error('Code d\'invitation invalide')
        }
        return { id: FAKE_MY_GROUP.id, name: FAKE_MY_GROUP.name, wave_reassigned: false }
      }
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Code invalide')
      return json as { id: string; name: string; wave_reassigned: boolean }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUP_QUERY_KEY }),
  })
}

export function useDelegateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, new_captain_id }: { id: string; new_captain_id: string }) => {
      if (USE_FAKE) {
        await new Promise((r) => setTimeout(r, 300))
        return { ok: true }
      }
      const res = await fetch(`/api/groups/${id}/delegate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_captain_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur délégation')
      return json
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUP_QUERY_KEY }),
  })
}

export function useLeaveGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_FAKE) {
        await new Promise((r) => setTimeout(r, 300))
        return { ok: true }
      }
      const res = await fetch(`/api/groups/${id}/leave`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur départ')
      return json
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUP_QUERY_KEY }),
  })
}
