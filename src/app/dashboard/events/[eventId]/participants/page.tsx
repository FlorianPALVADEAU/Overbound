'use client'

import { useParams } from 'next/navigation'
import { EventParticipantsList } from '@/components/admin/events/EventParticipantsList'

export default function EventParticipantsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  return <EventParticipantsList eventId={eventId} />
}
