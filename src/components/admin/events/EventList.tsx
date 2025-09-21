'use client'

import { EventCard } from './EventCard'
import type { Event } from '@/types/Event'

interface EventListProps {
  events: Event[]
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
  deleteLoadingId?: string | null
}

export function EventList({ events, onEdit, onDelete, deleteLoadingId }: EventListProps) {
  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={deleteLoadingId === event.id}
        />
      ))}
    </div>
  )
}
