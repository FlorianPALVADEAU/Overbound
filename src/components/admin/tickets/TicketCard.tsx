'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Ticket } from '@/types/Ticket'
import { Calendar, FileText, Ticket as TicketIcon, Users } from 'lucide-react'
import { Clock, Edit, Trash2 } from 'lucide-react'

interface TicketCardProps {
  ticket: Ticket
  onEdit: (ticket: Ticket) => void
  onDelete: (ticket: Ticket) => void
  isDeleting?: boolean
}

function formatCurrency(value: number | null | undefined, currency: Ticket['currency']) {
  if (value === null || value === undefined) return '—'
  const amount = value / 100
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${currency?.toUpperCase() || 'EUR'}`
}

export function TicketCard({ ticket, onEdit, onDelete, isDeleting }: TicketCardProps) {
  const requiresDoc = ticket.requires_document && ticket.document_types && ticket.document_types.length > 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold truncate">{ticket.name}</h3>
              <Badge variant="secondary">{ticket.currency?.toUpperCase() || 'EUR'}</Badge>
              {ticket.race && <Badge variant="outline">{ticket.race.name}</Badge>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TicketIcon className="h-4 w-4 text-muted-foreground" />
                <span>{formatCurrency(ticket.final_price_cents, ticket.currency)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{ticket.max_participants} places max</span>
              </div>
              {ticket.event && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{ticket.event.title}</span>
                </div>
              )}
            </div>

            {ticket.description && <p className="text-sm text-muted-foreground">{ticket.description}</p>}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button variant="outline" size="sm" onClick={() => onEdit(ticket)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(ticket)}
              disabled={isDeleting}
            >
              {isDeleting ? <Clock className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
