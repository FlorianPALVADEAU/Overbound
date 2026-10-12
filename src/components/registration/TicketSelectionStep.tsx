import type { ReactNode } from 'react'
import type { EventPriceTier } from '@/types/EventPriceTier'
import type { EventTicket } from './types'
import TicketCard from './TicketCard'

interface TicketSelectionStepProps {
  tickets: EventTicket[]
  ticketSelections: Record<string, number>
  onTicketQuantityChange: (ticketId: string, quantity: number) => void
  defaultCurrency: string
  activeTier: EventPriceTier | null
  hasActiveDiscount: boolean
  availableSpots: number
  groupBanner?: ReactNode
}

export default function TicketSelectionStep({
  tickets,
  ticketSelections,
  onTicketQuantityChange,
  defaultCurrency,
  activeTier,
  hasActiveDiscount,
  availableSpots,
  groupBanner,
}: TicketSelectionStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Réservé aux personnes majeures (18 ans et plus).</p>
      {groupBanner}

      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          quantity={ticketSelections[ticket.id] ?? 0}
          onQuantityChange={onTicketQuantityChange}
          defaultCurrency={defaultCurrency}
          activeTier={activeTier}
          hasActiveDiscount={hasActiveDiscount}
        />
      ))}

      {availableSpots <= 0 ? (
        <p className="text-sm font-medium text-destructive">
          L&apos;événement affiche complet. Tu peux rejoindre la liste d&apos;attente.
        </p>
      ) : null}
    </div>
  )
}
