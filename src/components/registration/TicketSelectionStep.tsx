import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
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
}

export default function TicketSelectionStep({
  tickets,
  ticketSelections,
  onTicketQuantityChange,
  defaultCurrency,
  activeTier,
  hasActiveDiscount,
  availableSpots,
}: TicketSelectionStepProps) {
  return (
    <div className="space-y-4">
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

      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {availableSpots > 0
            ? "Places limitées sur l'événement. Dépêchez-vous !"
            : "L'événement affiche complet. Vous pouvez rejoindre la liste d'attente."}
        </AlertDescription>
      </Alert>
    </div>
  )
}
