import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EventPriceTier } from '@/types/EventPriceTier'
import { applyTierDiscount } from '@/lib/orderPricing'
import { formatPrice } from '@/lib/registration'
import type { EventTicket } from './types'
import TicketQuantitySelect from './TicketQuantitySelect'

interface TicketCardProps {
  ticket: EventTicket
  quantity: number
  onQuantityChange: (ticketId: string, quantity: number) => void
  defaultCurrency: string
  sellingTier: EventPriceTier | null
  /** Bibs chosen on the other tickets, any format: they count toward the group discount. */
  otherTicketCount: number
}

export default function TicketCard({
  ticket,
  quantity,
  onQuantityChange,
  defaultCurrency,
  sellingTier,
  otherTicketCount,
}: TicketCardProps) {
  const isSelected = quantity > 0
  const currency = (ticket.currency || defaultCurrency).toLowerCase()

  const hasActiveDiscount = Boolean(sellingTier && sellingTier.discount_percentage > 0)
  const currentPrice =
    sellingTier && ticket.final_price_cents
      ? applyTierDiscount(ticket.final_price_cents, sellingTier.discount_percentage)
      : ticket.final_price_cents

  const currentRegistrations = ticket.current_registrations ?? 0
  const maxParticipants = ticket.max_participants ?? 0
  const isSoldOut = maxParticipants > 0 && currentRegistrations >= maxParticipants

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-colors',
        isSoldOut
          ? 'border-border bg-muted opacity-60'
          : isSelected
            ? 'border-primary bg-card ring-1 ring-primary'
            : 'border-border bg-card',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 text-lg font-semibold">
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
          {isSoldOut && (
            <p className="text-xs font-medium text-destructive">
              Complet — plus aucune place disponible.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="space-y-0.5 md:text-right">
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
          <TicketQuantitySelect
            ticketName={ticket.name}
            quantity={quantity}
            onChange={(next) => onQuantityChange(ticket.id, next)}
            unitCents={currentPrice ?? null}
            otherTicketCount={otherTicketCount}
            disabled={isSoldOut}
          />
        </div>
      </div>
    </div>
  )
}
