'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPinIcon } from 'lucide-react'
import { Eyebrow } from '@/components/account/AccountScreen'
import { useTicketTransfer } from '@/hooks/account/useTicketTransfer'
import { buildMapsUrl, formatLongDate } from '@/lib/account/format'
import {
  canShowTicketQr,
  countdownDisplay,
  getDaysUntilEvent,
  getEventPhase,
  type EventTicketGroup,
} from '@/lib/account/tickets'
import { TicketQrSheet } from './TicketQrSheet'
import { TransferConsentDialog } from './TransferConsentDialog'
import { TicketWallet } from './TicketWallet'
import type { TicketContext } from './ticketPresentation'

const PHASE_EYEBROW = { today: "C'est aujourd'hui", upcoming: 'Prochain départ', past: 'Édition passée' } as const

interface EventTicketsProps {
  group: EventTicketGroup
  context: TicketContext
}

/** Event heading + the wallet of bibs + the QR sheet: the whole "my race" block. */
export function EventTickets({ group, context }: EventTicketsProps) {
  const { now } = context
  const { transfer, stateFor, error: transferError, consentTicket, confirmConsent, cancelConsent } = useTicketTransfer()
  const [openId, setOpenId] = useState<string | null>(null)

  const phase = getEventPhase(group.date, now)
  const days = getDaysUntilEvent(group.date, now)
  const countdown = countdownDisplay(days)
  const qrTickets = useMemo(() => group.tickets.filter((ticket) => canShowTicketQr(ticket, now)), [group.tickets, now])
  const dateLabel = formatLongDate(group.date)

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow className="text-primary">{PHASE_EYEBROW[phase]}</Eyebrow>
        <h1 className="mt-2 text-balance text-[2.5rem] font-black leading-[0.95] tracking-tight md:text-5xl">{group.title}</h1>

        <dl className="mt-5 flex divide-x divide-border border-y border-border py-4">
          {countdown ? (
            <div className="pr-5">
              <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{countdown.caption}</dt>
              <dd className="mt-1 text-3xl font-black leading-none tracking-tighter tabular-nums text-primary">{countdown.value}</dd>
            </div>
          ) : null}
          {dateLabel ? (
            <div className="min-w-0 px-5 first:pl-0">
              <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Date</dt>
              <dd className="mt-1 text-base font-bold leading-tight first-letter:uppercase">{dateLabel}</dd>
            </div>
          ) : null}
        </dl>

        {group.location ? (
          <Link
            href={buildMapsUrl(group.location)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <MapPinIcon className="size-4 shrink-0" />
            {group.location}
          </Link>
        ) : null}
      </header>

      <TicketWallet
        tickets={group.tickets}
        context={context}
        transferStateFor={stateFor}
        onOpenQr={(ticket) => setOpenId(ticket.registration_id)}
        onTransfer={transfer}
      />

      {transferError ? (
        <p role="alert" className="text-sm text-destructive">
          {transferError}
        </p>
      ) : null}

      <TicketQrSheet tickets={qrTickets} openId={openId} context={context} onOpenChange={setOpenId} />
      <TransferConsentDialog ticket={consentTicket} onConfirm={confirmConsent} onCancel={cancelConsent} />
    </div>
  )
}
