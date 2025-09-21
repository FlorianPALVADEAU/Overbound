'use client'

import type { Ticket } from '@/types/Ticket'
import { TicketCard } from './TicketCard'

interface TicketListProps {
  tickets: Ticket[]
  onEdit: (ticket: Ticket) => void
  onDelete: (ticket: Ticket) => void
  deleteLoadingId?: string | null
}

export function TicketList({ tickets, onEdit, onDelete, deleteLoadingId }: TicketListProps) {
  return (
    <div className="grid gap-4">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={deleteLoadingId === ticket.id}
        />
      ))}
    </div>
  )
}
