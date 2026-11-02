'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminEventPicker } from '@/components/admin/events/AdminEventPicker'

function ParticipantsEntry() {
  const router = useRouter()
  const eventId = useSearchParams().get('event')

  // One canonical address per event: /dashboard/events/[id]/participants.
  useEffect(() => {
    if (eventId) router.replace(`/dashboard/events/${eventId}/participants`)
  }, [eventId, router])

  if (eventId) return <p className="text-sm text-muted-foreground">Chargement…</p>
  return (
    <AdminEventPicker
      title="Participants"
      description="Choisis l’événement dont tu veux gérer les inscrits."
      hrefFor={(id) => `/dashboard/events/${id}/participants`}
    />
  )
}

export default function ParticipantsPage() {
  return (
    <Suspense fallback={null}>
      <ParticipantsEntry />
    </Suspense>
  )
}
