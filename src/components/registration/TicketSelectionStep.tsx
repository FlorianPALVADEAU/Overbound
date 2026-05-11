import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, UserX } from 'lucide-react'
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
    <div className="space-y-4">
      <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300">
        <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-xs leading-relaxed">
          <span className="font-semibold">Réservé aux personnes majeures (18 ans et plus).</span>
          {' '}Les mineurs ne sont pas autorisés à participer à cette édition.
          La prochaine édition sera ouverte aux mineurs accompagnés.
        </AlertDescription>
      </Alert>
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
