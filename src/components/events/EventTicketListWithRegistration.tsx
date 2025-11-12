'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import Link from 'next/link'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import {
  AlertTriangle,
  Mountain,
  Star,
  Target,
  Zap,
  Clock,
} from 'lucide-react'
import { getCurrentTicketPrice, isPriceChangeImminent } from '@/lib/pricing'
import type { EventPriceTier } from '@/types/EventPriceTier'
import { getCurrentPriceTier } from '@/types/EventPriceTier'

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
  eventPriceTiers?: EventPriceTier[]
}

export default function EventTicketListWithRegistration({
  event,
  tickets,
  availableSpots,
  user,
  eventPriceTiers = [],
}: Props) {
  // Group tickets by race name (or ticket name if no race)
  const groupedTickets = tickets.reduce((groups, ticket) => {
    const groupKey = ticket.race?.name || ticket.name
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(ticket)
    return groups
  }, {} as Record<string, EventTicket[]>)

  const formatCurrency = (value: number, currency?: string | null) => {
    const fraction = Math.abs(value) % 100
    const useCents = fraction !== 0
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: (currency ?? 'EUR').toUpperCase(),
      minimumFractionDigits: useCents ? 2 : 0,
      maximumFractionDigits: useCents ? 2 : 0,
    }).format(value / 100)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Formats disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-muted p-4 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Aucun billet n'est disponible pour le moment.
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-3 py-6">
              {Object.entries(groupedTickets).map(([raceName, raceTickets]) => {
                // Use the first ticket's race data for the header
                const referenceTicket = raceTickets[0]

                // Find the lowest price across all variants
                const lowestPrice = Math.min(
                  ...raceTickets.map(ticket => getCurrentTicketPrice(ticket, eventPriceTiers) ?? Infinity)
                )

                // Check if there's an active discount
                const activeTier = getCurrentPriceTier(eventPriceTiers)
                const hasDiscount = activeTier && activeTier.discount_percentage > 0

                return (
                  <AccordionItem
                    key={raceName}
                    value={raceName}
                    className="border-2 rounded-xl px-6 hover:border-primary/30 transition-all"
                  >
                    <AccordionTrigger className="hover:no-underline py-5">
                      <div className="flex items-center justify-between w-full pr-4">
                        {/* Left: Race info */}
                        <div className="flex flex-col items-start gap-3 text-left flex-1">
                          {/* Race name */}
                          <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            {raceName}
                          </h3>

                          {/* Race info badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {referenceTicket.race?.distance_km && (
                              <Badge variant="secondary" className="gap-1 font-semibold">
                                <Mountain className="h-3.5 w-3.5" />
                                {referenceTicket.race.distance_km} km
                              </Badge>
                            )}
                            {typeof referenceTicket.race?.difficulty === 'number' && (
                              <Badge variant="secondary" className="gap-1 font-semibold">
                                <Star className="h-3.5 w-3.5" />
                                Niveau {referenceTicket.race.difficulty}/10
                              </Badge>
                            )}
                            {referenceTicket.race?.target_public && (
                              <Badge variant="outline" className="font-semibold">
                                <Target className="h-3.5 w-3.5 mr-1" />
                                {referenceTicket.race.target_public}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Right: Price badge */}
                        {lowestPrice !== Infinity && (
                          <div className="flex flex-col items-end gap-1 ml-4">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              À partir de
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-primary">
                                {formatCurrency(lowestPrice, referenceTicket.currency)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-4 pb-4">
                      {/* Race description */}
                      {referenceTicket.race?.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {referenceTicket.race.description}
                        </p>
                      )}

                      {/* Ticket variants grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {raceTickets.map((ticket) => {
                          const currentPrice = getCurrentTicketPrice(ticket, eventPriceTiers)
                          const priceImminent = isPriceChangeImminent(ticket, eventPriceTiers)
                          const ticketHasDiscount = hasDiscount

                          return (
                            <div
                              key={ticket.id}
                              className="relative border-2 rounded-xl p-5 hover:border-primary/60 transition-all hover:shadow-lg space-y-4 bg-gradient-to-br from-background to-muted/20"
                            >
                              {/* Variant name */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-5 w-5 text-primary" />
                                  <h4 className="font-bold text-lg">{ticket.name}</h4>
                                </div>
                                {ticket.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 pl-7">
                                    {ticket.description}
                                  </p>
                                )}
                              </div>

                              {/* Price */}
                              <div className="space-y-1 pt-2">
                                {ticketHasDiscount && (
                                  <div className="text-sm font-medium text-muted-foreground line-through">
                                    {formatCurrency(ticket.final_price_cents, ticket.currency)}
                                  </div>
                                )}
                                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                  {currentPrice != null && ticket.currency
                                    ? formatCurrency(currentPrice, ticket.currency)
                                    : 'Tarif à venir'}
                                </div>
                                {ticketHasDiscount && activeTier && (
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-md w-fit">
                                    -{activeTier.discount_percentage}% ({activeTier.name})
                                  </div>
                                )}
                                {priceImminent && (
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-md w-fit">
                                    <Clock className="h-3.5 w-3.5" />
                                    Prix en hausse bientôt
                                  </div>
                                )}
                              </div>

                              {/* CTA */}
                              {availableSpots <= 0 ? (
                                <Button className="w-full" size="lg" disabled>
                                  Complet
                                </Button>
                              ) : (
                                <Button asChild className="w-full shadow-md hover:shadow-lg transition-shadow" size="lg">
                                  <Link
                                    href={user
                                      ? `/events/${event.id}/register?ticket=${ticket.id}`
                                      : `/auth/login?next=${encodeURIComponent(`/events/${event.id}/register?ticket=${ticket.id}`)}`}
                                  >
                                    Réserver maintenant
                                  </Link>
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </>
  )
}
