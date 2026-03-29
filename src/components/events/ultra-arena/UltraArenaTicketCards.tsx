'use client'

import Link from 'next/link'
import { Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentTicketPrice, isPriceChangeImminent } from '@/lib/pricing'
import { getCurrentPriceTier } from '@/types/EventPriceTier'
import type { EventPriceTier } from '@/types/EventPriceTier'

interface EventUser {
  id: string
  email: string
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tickets: any[]
  eventPriceTiers: EventPriceTier[]
  priceCurrency: string
  isOnSale: boolean
  eventSlug: string
  user: EventUser | null
  onRegisterClick?: (payload: { ticketId: string; ticketName: string; raceType?: string | null }) => void
}

export function UltraArenaTicketCards({
  tickets,
  eventPriceTiers,
  priceCurrency,
  isOnSale,
  eventSlug,
  user,
  onRegisterClick,
}: Props) {
  const activeTier = getCurrentPriceTier(eventPriceTiers)
  const hasDiscount = activeTier && activeTier.discount_percentage > 0

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: (priceCurrency || 'EUR').toUpperCase(),
      minimumFractionDigits: 2,
    }).format(cents / 100)

  if (!tickets.length) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tickets.map((ticket) => {
        const currentPrice = getCurrentTicketPrice(ticket, eventPriceTiers)
        const basePrice = ticket.final_price_cents as number | undefined
        const priceImminent = isPriceChangeImminent(ticket, eventPriceTiers)
        const registerUrl = user
          ? `/events/${eventSlug}/register?ticket=${ticket.id}`
          : `/auth/login?next=${encodeURIComponent(`/events/${eventSlug}/register?ticket=${ticket.id}`)}`

        return (
          <Card
            key={ticket.id}
            className="group relative flex flex-col overflow-hidden border-2 border-border/60 bg-card/90 transition-all duration-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
          >
            <CardContent className="flex flex-1 flex-col gap-4 p-5">
              {/* Name + icon */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 shrink-0 text-primary" />
                  <h4 className="font-bold">{ticket.name}</h4>
                </div>
                {hasDiscount && activeTier && (
                  <Badge className="shrink-0 border-0 bg-green-500/15 text-green-600 text-[11px]">
                    -{activeTier.discount_percentage}%
                  </Badge>
                )}
              </div>

              {ticket.description && (
                <p className="text-xs text-muted-foreground">{ticket.description}</p>
              )}

              {/* Price block */}
              <div className="mt-auto space-y-1 pt-2">
                {hasDiscount && basePrice && basePrice !== currentPrice && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatCurrency(basePrice)}
                  </p>
                )}
                <p className="text-3xl font-black text-primary">
                  {currentPrice != null ? formatCurrency(currentPrice) : 'À venir'}
                </p>
                {priceImminent && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                    Prix en hausse bientôt
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="pt-1">
                {isOnSale ? (
                  <Button
                    asChild
                    size="lg"
                    className="w-full shadow-md transition-shadow hover:shadow-lg"
                    onClick={() =>
                      onRegisterClick?.({
                        ticketId: ticket.id,
                        ticketName: ticket.name,
                        raceType: ticket.race?.type ?? null,
                      })
                    }
                  >
                    <Link href={registerUrl}>Réserver ce format</Link>
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Inscriptions à venir
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
