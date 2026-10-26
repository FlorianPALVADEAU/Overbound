import { useMemo } from 'react'
import type { EventTicket, EventUpsell, Participant } from '@/components/registration/types'
import { buildOrderLines, type OrderLine } from '@/lib/checkout/orderLines'
import type { PricingSummary } from '@/lib/orderPricing'
import { joinName } from '@/lib/registration'
import type { UpsellSummaryItem } from '@/lib/upsells/summary'
import type { EventPriceTier } from '@/types/EventPriceTier'

interface CheckoutCatalog {
  tickets: EventTicket[]
  tiers: EventPriceTier[]
  upsells: EventUpsell[]
  participants: Participant[]
}

/** The checkout summary lines, named from the event catalog and the participants typed so far. */
export function useCheckoutOrderLines(
  summary: PricingSummary,
  upsellItems: UpsellSummaryItem[],
  { tickets, tiers, upsells, participants }: CheckoutCatalog,
): OrderLine[] {
  return useMemo(
    () =>
      buildOrderLines(summary, upsellItems, {
        ticket: (id) => tickets.find((ticket) => ticket.id === id)?.name ?? 'Billet',
        tier: (id) => tiers.find((tier) => tier.id === id)?.name ?? null,
        participant: (index) => {
          const participant = participants[index]
          return participant ? joinName(participant.firstName, participant.lastName) : ''
        },
        upsell: (id) => upsells.find((upsell) => upsell.id === id)?.name ?? 'option',
        assignee: (participantId) => {
          const participant = participants.find((entry) => entry.id === participantId)
          return participant ? { ticketId: participant.ticketId, name: joinName(participant.firstName, participant.lastName) } : null
        },
      }),
    [summary, upsellItems, tickets, tiers, upsells, participants],
  )
}
