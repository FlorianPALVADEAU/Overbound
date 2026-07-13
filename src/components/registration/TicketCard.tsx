import { Badge } from '@/components/ui/badge'
import { Ticket as TicketIcon, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventPriceTier } from '@/types/EventPriceTier'
import { calculateCurrentPrice } from '@/types/EventPriceTier'
import { formatPrice } from '@/lib/registration'
import type { EventTicket } from './types'
import QuantityPicker from './QuantityPicker'

interface TicketCardProps {
  ticket: EventTicket
  quantity: number
  onQuantityChange: (ticketId: string, quantity: number) => void
  defaultCurrency: string
  activeTier: EventPriceTier | null
  hasActiveDiscount: boolean
}

export default function TicketCard({
  ticket,
  quantity,
  onQuantityChange,
  defaultCurrency,
  activeTier,
  hasActiveDiscount,
}: TicketCardProps) {
  const isSelected = quantity > 0
  const currency = (ticket.currency || defaultCurrency).toLowerCase()

  const currentPrice =
    hasActiveDiscount && ticket.final_price_cents
      ? calculateCurrentPrice(ticket.final_price_cents, activeTier!)
      : ticket.final_price_cents

  const currentRegistrations = ticket.current_registrations ?? 0
  const maxParticipants = ticket.max_participants ?? 0
  const isSoldOut = maxParticipants > 0 && currentRegistrations >= maxParticipants

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isSoldOut
          ? 'opacity-60 bg-muted/50'
          : isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 text-base font-semibold">
            <TicketIcon
              className={cn('h-4 w-4', isSoldOut ? 'text-muted-foreground' : 'text-primary')}
            />
            {ticket.name}
            {isSoldOut && (
              <Badge variant="destructive" className="ml-1">
                Complet
              </Badge>
            )}
          </div>
          {ticket.description && (
            <p className="text-sm text-muted-foreground">{ticket.description}</p>
          )}
          {ticket.race?.distance_km ? (
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {ticket.race.distance_km} km
            </Badge>
          ) : null}
          {isSoldOut && (
            <p className="text-xs font-medium text-destructive">
              Complet — plus aucune place disponible.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
          <div className="space-y-0.5 text-right">
            {hasActiveDiscount &&
              ticket.final_price_cents !== null &&
              ticket.final_price_cents !== undefined && (
                <div className="text-sm font-medium text-muted-foreground line-through">
                  {formatPrice(ticket.final_price_cents, currency)}
                </div>
              )}
            <div
              className={cn('text-lg font-semibold', isSoldOut ? 'text-muted-foreground' : 'text-primary')}
            >
              {currentPrice !== null && currentPrice !== undefined
                ? formatPrice(currentPrice, currency)
                : 'Tarif à venir'}
            </div>
          </div>
          <QuantityPicker
            value={quantity}
            onDecrement={() => onQuantityChange(ticket.id, quantity - 1)}
            onIncrement={() => onQuantityChange(ticket.id, quantity + 1)}
            disableDecrement={quantity === 0 || isSoldOut}
            disableIncrement={isSoldOut}
          />
        </div>
      </div>
    </div>
  )
}
