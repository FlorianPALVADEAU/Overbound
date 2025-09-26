'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import {
  AlertTriangle,
  Mountain,
  Star,
  Target,
  Zap,
} from 'lucide-react'

interface EventTicket extends Ticket {
  race?: Ticket['race'] & {
    type?: string | null
    target_public?: string | null
    description?: string | null
    obstacles?: Array<{
      order_position: number
      is_mandatory: boolean
      obstacle: {
        id: string
        name: string
      }
    }>
  }
}

interface EventUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
  }
}

interface Props {
  event: Event
  tickets: EventTicket[]
  availableSpots: number
  user: EventUser | null
}

const difficultyBadge = (difficulty: number) => {
  if (difficulty <= 3) return 'bg-green-100 text-green-800'
  if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const typeBadge = (type: string) => {
  switch (type) {
    case 'trail':
      return 'bg-blue-100 text-blue-800'
    case 'obstacle':
      return 'bg-orange-100 text-orange-800'
    case 'urbain':
      return 'bg-purple-100 text-purple-800'
    case 'nature':
      return 'bg-green-100 text-green-800'
    case 'extreme':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const publicBadge = (target: string) => {
  switch (target) {
    case 'débutant':
      return 'bg-emerald-100 text-emerald-800'
    case 'intermédiaire':
      return 'bg-amber-100 text-amber-800'
    case 'expert':
      return 'bg-red-100 text-red-800'
    case 'famille':
      return 'bg-pink-100 text-pink-800'
    case 'pro':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function EventTicketListWithRegistration({
  event,
  tickets,
  availableSpots,
  user,
}: Props) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Formats disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {tickets.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-muted p-4 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Aucun billet n'est disponible pour le moment.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold">{ticket.name}</h3>
                      {ticket.requires_document ? (
                        <Badge variant="secondary">Document requis</Badge>
                      ) : null}
                    </div>

                    {ticket.description ? (
                      <p className="text-muted-foreground">{ticket.description}</p>
                    ) : null}

                    {ticket.race ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {ticket.race.type ? (
                            <Badge variant="outline" className={typeBadge(ticket.race.type)}>
                              {ticket.race.type === 'trail'
                                ? 'Trail'
                                : ticket.race.type === 'obstacle'
                                  ? "Course d'obstacles"
                                  : ticket.race.type === 'urbain'
                                    ? 'Course urbaine'
                                    : ticket.race.type === 'nature'
                                      ? 'Course nature'
                                      : ticket.race.type === 'extreme'
                                        ? 'Course extrême'
                                        : ticket.race.type}
                            </Badge>
                          ) : null}
                          {typeof ticket.race.difficulty === 'number' ? (
                            <Badge variant="outline" className={difficultyBadge(ticket.race.difficulty)}>
                              <Star className="h-3 w-3 mr-1" />
                              Difficulté {ticket.race.difficulty}/10
                            </Badge>
                          ) : null}
                          {ticket.race.target_public ? (
                            <Badge variant="outline" className={publicBadge(ticket.race.target_public)}>
                              <Target className="h-3 w-3 mr-1" />
                              {ticket.race.target_public}
                            </Badge>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {ticket.race.distance_km ? (
                            <div className="flex items-center gap-2">
                              <Mountain className="h-4 w-4 text-muted-foreground" />
                              Distance : {ticket.race.distance_km} km
                            </div>
                          ) : null}
                          {ticket.race.obstacles && ticket.race.obstacles.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                              {ticket.race.obstacles.length} obstacles
                            </div>
                          ) : null}
                        </div>

                        {ticket.race.description ? (
                          <p className="text-sm text-muted-foreground italic">{ticket.race.description}</p>
                        ) : null}

                        {ticket.race.obstacles && ticket.race.obstacles.length > 0 ? (
                          <div>
                            <p className="text-sm font-medium mb-2">Obstacles inclus :</p>
                            <div className="flex flex-wrap gap-1">
                              {ticket.race.obstacles
                                .sort((a, b) => a.order_position - b.order_position)
                                .slice(0, 5)
                                .map((obstacleWrapper) => (
                                  <Badge key={obstacleWrapper.obstacle.id} variant="secondary" className="text-xs">
                                    {obstacleWrapper.obstacle.name}
                                  </Badge>
                                ))}
                              {ticket.race.obstacles.length > 5 ? (
                                <Badge variant="outline" className="text-xs">
                                  +{ticket.race.obstacles.length - 5} autres
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {ticket.requires_document && ticket.document_types && ticket.document_types.length > 0 ? (
                      <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                        <p className="font-medium text-orange-800 mb-2">Documents requis :</p>
                        <ul className="space-y-1">
                          {ticket.document_types.map((type) => (
                            <li key={type}>• {type}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex w-full max-w-xs flex-col gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {ticket.base_price_cents != null && ticket.currency
                          ? (ticket.base_price_cents / 100).toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: ticket.currency.toUpperCase(),
                            })
                          : 'Tarif à venir'}
                      </p>
                      {ticket.max_participants > 0 ? (
                        <p className="text-xs text-muted-foreground">Max {ticket.max_participants} participants</p>
                      ) : null}
                    </div>

                    {availableSpots <= 0 ? (
                      <Button className="w-full" disabled>
                        Complet
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <Link
                          href={user
                            ? `/events/${event.id}/register?ticket=${ticket.id}`
                            : `/auth/login?next=${encodeURIComponent(`/events/${event.id}/register?ticket=${ticket.id}`)}`}
                        >
                          S'inscrire
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}
