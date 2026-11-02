'use client'

import { useParams } from 'next/navigation'
import { AdminParticipantsPage } from '@/components/admin/events/AdminParticipantsPage'

export default function EventParticipantsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  return <AdminParticipantsPage eventId={eventId} />
}
