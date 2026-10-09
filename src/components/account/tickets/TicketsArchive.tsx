'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckIcon, ChevronRightIcon, DownloadIcon, SendIcon, TicketIcon } from 'lucide-react'
import { AccountDataBoundary, type AuthenticatedAccountData } from '@/components/account/AccountDataBoundary'
import { AccountScreen, Eyebrow } from '@/components/account/AccountScreen'
import { Button } from '@/components/ui/button'
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'
import { useTicketTransfer, type TransferUiState } from '@/hooks/account/useTicketTransfer'
import { formatLongDate } from '@/lib/account/format'
import {
  canShowTicketQr,
  getEventPhase,
  getTransferState,
  groupTicketsByEvent,
  type EventTicketGroup,
} from '@/lib/account/tickets'
import { cn } from '@/lib/utils'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'
import { TicketQrSheet } from './TicketQrSheet'
import { TransferConsentDialog } from './TransferConsentDialog'
import { bibLabel, createTicketContext, describeHolder, getTicketFacts, type TicketContext } from './ticketPresentation'

/** Legacy `/account/ticket/[id]` links redirect here with `?ticket=`; honour them by opening that bib. */
const readRequestedTicketId = () =>
  typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('ticket')

interface TicketRowProps {
  ticket: AccountRegistrationItem
  context: TicketContext
  transferState: TransferUiState
  onOpenQr: (ticket: AccountRegistrationItem) => void
  onTransfer: (ticket: AccountRegistrationItem) => void
}

function TicketRow({ ticket, context, transferState, onOpenQr, onTransfer }: TicketRowProps) {
  const { now } = context
  const qrAvailable = canShowTicketQr(ticket, now)
  const transfer = getTransferState(ticket, now)
  const bib = bibLabel(ticket.bib_number)
  const phase = getEventPhase(ticket.event_date, now)
  const holder = describeHolder(ticket, context.identify(ticket))
  const details = [
    holder,
    ...getTicketFacts(ticket).map((fact) => `${fact.label} ${fact.value}`),
  ].filter(Boolean)
  const status = ticket.checked_in ? 'Présent' : phase === 'past' ? 'Terminé' : null

  const body = (
    <>
      <span className="flex w-[4.5rem] shrink-0 items-center text-4xl font-black leading-none tracking-tighter tabular-nums">
        {bib ?? <TicketIcon className="size-7 text-muted-foreground" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{ticket.ticket_name ?? 'Billet'}</span>
        <span className="block truncate text-xs text-muted-foreground">{details.join(' · ')}</span>
      </span>
      {status ? (
        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {ticket.checked_in ? <CheckIcon className="size-3.5 text-primary" strokeWidth={3} /> : null}
          {status}
        </span>
      ) : qrAvailable ? (
        <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
      ) : null}
    </>
  )

  return (
    <li className="flex items-stretch gap-1 border-t border-border first:border-t-0">
      {qrAvailable ? (
        <button type="button" onClick={() => onOpenQr(ticket)} className="flex min-h-16 flex-1 items-center gap-3 py-3 text-left">
          {body}
        </button>
      ) : (
        <div className="flex min-h-16 flex-1 items-center gap-3 py-3">{body}</div>
      )}
      {transfer.available ? (
        <button
          type="button"
          onClick={() => onTransfer(ticket)}
          disabled={transferState === 'pending'}
          className="flex min-h-11 items-center gap-1.5 self-center rounded-lg px-2 text-xs font-bold text-primary disabled:opacity-50"
        >
          {transferState === 'copied' ? <CheckIcon className="size-4" /> : <SendIcon className="size-4" />}
          {transferState === 'copied' ? 'Copié' : transfer.unlocked ? 'Envoyer' : 'Transférer'}
        </button>
      ) : null}
    </li>
  )
}

function EventTicketList({ group, context }: { group: EventTicketGroup; context: TicketContext }) {
  const { now } = context
  const { transfer, stateFor, error: transferError, consentTicket, confirmConsent, cancelConsent } = useTicketTransfer()
  const [openId, setOpenId] = useState<string | null>(() => {
    const requested = readRequestedTicketId()
    return group.tickets.some((ticket) => ticket.registration_id === requested) ? requested : null
  })
  const qrTickets = useMemo(() => group.tickets.filter((ticket) => canShowTicketQr(ticket, now)), [group.tickets, now])
  const invoices = Array.from(new Set(group.tickets.map((ticket) => ticket.invoice_url).filter((url): url is string => Boolean(url))))

  return (
    <section className="border-t border-border pt-5">
      <header className="mb-2">
        <h2 className="text-2xl font-black leading-tight tracking-tight">{group.title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground first-letter:uppercase">{formatLongDate(group.date)}</p>
      </header>

      <ul>
        {group.tickets.map((ticket) => (
          <TicketRow
            key={ticket.registration_id}
            ticket={ticket}
            context={context}
            transferState={stateFor(ticket.registration_id)}
            onOpenQr={(selected) => setOpenId(selected.registration_id)}
            onTransfer={transfer}
          />
        ))}
      </ul>

      {transferError ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {transferError}
        </p>
      ) : null}

      {invoices.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {invoices.map((url, index) => (
            <Link
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
            >
              <DownloadIcon className="size-4" />
              Facture{invoices.length > 1 ? ` ${index + 1}` : ''}
            </Link>
          ))}
        </div>
      ) : null}

      <TicketQrSheet tickets={qrTickets} openId={openId} context={context} onOpenChange={setOpenId} />
      <TransferConsentDialog ticket={consentTicket} onConfirm={confirmConsent} onCancel={cancelConsent} />
    </section>
  )
}

function TicketsArchiveContent({ user, profile, registrations }: AuthenticatedAccountData) {
  const now = useMemo(() => new Date(), [])
  const context = useMemo(() => createTicketContext(user, profile, now), [user, profile, now])
  const groups = useMemo(() => groupTicketsByEvent(registrations, now, user.email), [registrations, now, user.email])

  return (
    <AccountScreen>
      <header className="mb-8">
        <Eyebrow>Mes billets</Eyebrow>
        <h1 className="mt-2 text-[2.5rem] font-black leading-[0.95] tracking-tight">Tous mes dossards</h1>
      </header>

      {groups.length === 0 ? (
        <div className="space-y-4 border-t border-border pt-6">
          <p className="text-muted-foreground">Aucun billet pour le moment.</p>
          <Button asChild variant="outline" className="h-11">
            <Link href="/account">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8 md:space-y-10">
          {groups.map((group) => (
            <EventTicketList key={group.key} group={group} context={context} />
          ))}
        </div>
      )}

      <p className="mt-10 border-t border-border pt-5 text-sm text-muted-foreground">
        <Link href={OFFICIAL_RULEBOOK_PDF_PATH} target="_blank" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Règlement officiel
        </Link>{' '}
        (PDF)
      </p>
    </AccountScreen>
  )
}

export function TicketsArchive() {
  return <AccountDataBoundary>{(data) => <TicketsArchiveContent {...data} />}</AccountDataBoundary>
}
