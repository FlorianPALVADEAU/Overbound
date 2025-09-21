'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Event } from '@/types/Event'
import { Calendar, MapPin, Users } from 'lucide-react'
import { Edit, Trash2 } from 'lucide-react'
import { Clock } from 'lucide-react'
import { ReactNode } from 'react'

interface EventCardProps {
  event: Event
  actions?: ReactNode
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
  isDeleting?: boolean
}

function getStatusBadgeVariant(status: Event['status']) {
  switch (status) {
    case 'draft':
      return 'secondary' as const
    case 'on_sale':
      return 'default' as const
    case 'sold_out':
      return 'destructive' as const
    case 'closed':
      return 'outline' as const
    default:
      return 'secondary' as const
  }
}

function getStatusLabel(status: Event['status']) {
  switch (status) {
    case 'draft':
      return 'Brouillon'
    case 'on_sale':
      return 'En vente'
    case 'sold_out':
      return 'Complet'
    case 'closed':
      return 'Fermé'
    case 'cancelled':
      return 'Annulé'
    case 'completed':
      return 'Terminé'
    default:
      return status
  }
}

export function EventCard({ event, onEdit, onDelete, isDeleting, actions }: EventCardProps) {
  const eventDate = new Date(event.date)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold truncate">{event.title}</h3>
              <Badge variant={getStatusBadgeVariant(event.status)}>
                {getStatusLabel(event.status)}
              </Badge>
            </div>

            {event.subtitle && (
              <p className="text-sm text-muted-foreground mb-3">{event.subtitle}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {eventDate.toLocaleString('fr-FR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{event.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{event.capacity} places</span>
              </div>
            </div>

            {(event.latitude ?? null) !== null && (event.longitude ?? null) !== null && (
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium">Coordonnées :</span> {event.latitude}, {event.longitude}
              </div>
            )}

            {event.external_provider && (
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium">Prestataire externe :</span> {event.external_provider}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {actions}
            <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(event)}
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
