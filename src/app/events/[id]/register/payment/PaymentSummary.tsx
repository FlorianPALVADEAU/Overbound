'use client'

import { useMemo } from 'react'
import { Separator } from '@/components/ui/separator'
import { OrderLines, OrderTotal, RefundNotice } from '@/components/registration/summary'
import { buildOrderLines } from '@/lib/checkout/orderLines'
import { joinName } from '@/lib/registration'
import { summarizeUpsells } from '@/lib/upsells/summary'
import type { RegistrationDraft } from '@/store/useRegistrationStore'
import type { EventPriceTier } from '@/types/EventPriceTier'
import type { Ticket } from '@/types/Ticket'
import type { Upsell } from '@/types/Upsell'

interface PaymentSummaryProps {
  draft: RegistrationDraft
  tickets: Ticket[]
  tiers: EventPriceTier[]
  upsells: Upsell[]
}

/** The order about to be paid: who runs, what is bought, and the same lines as the checkout summary. */
export default function PaymentSummary({ draft, tickets, tiers, upsells }: PaymentSummaryProps) {
  const lines = useMemo(() => {
    const participantName = (index: number) => {
      const participant = draft.participants[index]
      return participant ? joinName(participant.firstName, participant.lastName) : ''
    }
    const upsellItems = summarizeUpsells(
      Object.fromEntries(draft.upsells.map((item) => [item.upsellId, { quantity: item.quantity, meta: item.meta }])),
      upsells,
      (participantId) => participantName(draft.participants.findIndex((participant) => participant.id === participantId)),
      draft.summary.currency,
    )
    return buildOrderLines(draft.summary, upsellItems, {
      ticket: (id) => tickets.find((ticket) => ticket.id === id)?.name ?? 'Billet',
      tier: (id) => tiers.find((tier) => tier.id === id)?.name ?? null,
      participant: participantName,
      upsell: (id) => upsells.find((upsell) => upsell.id === id)?.name ?? 'option',
    })
  }, [draft, tickets, tiers, upsells])

  return (
    <section aria-labelledby="payment-summary-title" className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 id="payment-summary-title" className="text-lg font-semibold">
        Ta commande
      </h2>

      <ul className="space-y-2 text-sm">
        {draft.participants.map((participant, index) => (
          <li key={participant.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{joinName(participant.firstName, participant.lastName) || `Participant ${index + 1}`}</p>
              <p className="truncate text-xs text-muted-foreground">{participant.email}</p>
            </div>
            <span className="shrink-0 text-muted-foreground">
              {tickets.find((ticket) => ticket.id === participant.ticketId)?.name ?? 'Billet'}
            </span>
          </li>
        ))}
      </ul>

      <Separator />
      <OrderLines lines={lines} currency={draft.summary.currency} />
      <Separator />
      <OrderTotal totalCents={draft.summary.totalDue} currency={draft.summary.currency} />
      <RefundNotice hasFlexible={draft.participants.some((participant) => participant.flexible === true)} />
    </section>
  )
}
