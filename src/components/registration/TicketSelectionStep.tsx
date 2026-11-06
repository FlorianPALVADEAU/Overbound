import type { ReactNode } from 'react'
import { TICKETS_SECTION_ID } from '@/lib/checkout/fieldIds'
import { ageRuleSentence } from '@/lib/events/minimumAge'
import { isOpenFormatTicket } from '@/lib/openSas'
import type { EventPriceTier } from '@/types/EventPriceTier'
import TicketCard from './TicketCard'
import type { EventTicket } from './types'

interface TicketSelectionStepProps {
  tickets: EventTicket[]
  ticketSelections: Record<string, number>
  onTicketQuantityChange: (ticketId: string, quantity: number) => void
  defaultCurrency: string
  /** Tier a new ticket is sold on right now, if any. */
  sellingTier: EventPriceTier | null
  availableSpots: number
  showErrors: boolean
  /** `events.minimum_age`: drives the age rule shown above the tickets. */
  minimumAge: number
  groupBanner?: ReactNode
}

export default function TicketSelectionStep({
  tickets,
  ticketSelections,
  onTicketQuantityChange,
  defaultCurrency,
  sellingTier,
  availableSpots,
  showErrors,
  minimumAge,
  groupBanner,
}: TicketSelectionStepProps) {
  // The group discount counts each format apart: OPEN bibs never add to RANKED bibs, and the reverse.
  const formatOf = (ticket: EventTicket) => isOpenFormatTicket(ticket.name, ticket.race?.name)
  const sameFormatCountExcluding = (ticket: EventTicket) =>
    tickets.reduce(
      (total, other) =>
        other.id !== ticket.id && formatOf(other) === formatOf(ticket) ? total + (ticketSelections[other.id] ?? 0) : total,
      0,
    )
  const nothingSelected = Object.values(ticketSelections).every((quantity) => !quantity)

  return (
    <div id={TICKETS_SECTION_ID} tabIndex={-1} className="space-y-3 outline-none">
      <p className="text-sm text-muted-foreground">{ageRuleSentence(minimumAge)}</p>
      {groupBanner}

      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          quantity={ticketSelections[ticket.id] ?? 0}
          onQuantityChange={onTicketQuantityChange}
          defaultCurrency={defaultCurrency}
          sellingTier={sellingTier}
          otherSameFormatCount={sameFormatCountExcluding(ticket)}
        />
      ))}

      {showErrors && nothingSelected ? (
        <p className="text-sm font-medium text-destructive">Choisis au moins un billet.</p>
      ) : null}
      {availableSpots <= 0 ? <p className="text-sm font-medium text-destructive">Cet événement est complet.</p> : null}
    </div>
  )
}
