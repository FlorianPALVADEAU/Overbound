'use client'

import { useSearchParams } from 'next/navigation'
import { AdminEventPicker } from '@/components/admin/events/AdminEventPicker'
import { VolunteerPlanningSection } from '@/components/admin/volunteers/VolunteerPlanningSection'

export default function VolunteersPage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event')

  // The volunteer planning is built one event at a time: pick the event first, as on the participants page.
  if (!eventId) {
    return (
      <AdminEventPicker
        eyebrow="Terrain"
        title="Planning bénévoles"
        description="Choisis l’événement dont tu veux organiser les bénévoles."
        hrefFor={(id) => `/dashboard/volunteers?event=${encodeURIComponent(id)}`}
      />
    )
  }

  return <VolunteerPlanningSection eventId={eventId} />
}
