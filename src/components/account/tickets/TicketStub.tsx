import { CheckIcon, QrCodeIcon, SendIcon } from 'lucide-react'
import { UserAvatar } from '@/components/account/UserAvatar'
import { canShowTicketQr, getEventPhase, getTransferState } from '@/lib/account/tickets'
import { cn } from '@/lib/utils'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'
import { bibLabel, describeHolder, getTicketFacts, type TicketContext } from './ticketPresentation'

interface TicketStubProps {
  ticket: AccountRegistrationItem
  context: TicketContext
  /** Label of the transfer state for this bib (idle, copied, redirecting to payment…). */
  transferState: 'idle' | 'copied' | 'pending'
  onOpenQr: (ticket: AccountRegistrationItem) => void
  onTransfer: (ticket: AccountRegistrationItem) => void
  className?: string
}

/**
 * A bib printed like one: the number is the hero (or the ticket name while no
 * number is assigned), the participant and practical facts sit under the
 * tear-off line, and the two actions are labelled buttons.
 */
export function TicketStub({ ticket, context, transferState, onOpenQr, onTransfer, className }: TicketStubProps) {
  const { now } = context
  const identity = context.identify(ticket)
  const holder = describeHolder(ticket, identity)
  const facts = getTicketFacts(ticket)
  const phase = getEventPhase(ticket.event_date, now)
  const qrAvailable = canShowTicketQr(ticket, now)
  const transfer = getTransferState(ticket, now)
  const bib = bibLabel(ticket.bib_number)

  const status = ticket.checked_in
    ? { label: 'Présent', tone: 'text-emerald-700' }
    : phase === 'past'
      ? { label: 'Terminé', tone: 'text-background/50' }
      : ticket.claim_status === 'claimed'
        ? { label: 'Reçu', tone: 'text-background/60' }
        : null

  return (
    <article className={cn('flex h-full flex-col overflow-hidden rounded-2xl bg-foreground text-background shadow-lg shadow-black/25', className)}>
      <div className="px-5 pb-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.16em] text-background/60">
            {bib ? (ticket.ticket_name ?? 'Billet') : 'Billet'}
          </p>
          {status ? (
            <p className={cn('flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wider', status.tone)}>
              {ticket.checked_in ? <CheckIcon className="size-3.5" strokeWidth={3} /> : null}
              {status.label}
            </p>
          ) : null}
        </div>

        {bib ? (
          <p className="mt-2 text-[72px] font-black leading-[0.82] tracking-tighter tabular-nums">{bib}</p>
        ) : (
          <p className="mt-2 text-balance text-[2rem] font-black leading-[0.95] tracking-tight">{ticket.ticket_name ?? 'Dossard'}</p>
        )}
        <div className="mt-3 flex min-h-6 items-center gap-2">
          {identity.avatarUrl ? <UserAvatar src={identity.avatarUrl} name={identity.name} className="size-6 shrink-0 text-[9px]" /> : null}
          <p className="min-w-0 truncate text-sm font-semibold">{holder ?? ''}</p>
        </div>
      </div>

      {/* Tear-off line with its two notches */}
      <div className="relative" aria-hidden>
        <div className="mx-5 border-t-2 border-dashed border-background/20" />
        <span className="absolute -left-3 -top-3 size-6 rounded-full bg-background" />
        <span className="absolute -right-3 -top-3 size-6 rounded-full bg-background" />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 px-5 pb-5 pt-4">
        {facts.length > 0 ? (
          <dl className="flex divide-x divide-background/15">
            {facts.map((fact) => (
              <div key={fact.label} className="flex-1 px-3 first:pl-0 last:pr-0">
                <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-background/50">{fact.label}</dt>
                <dd className="mt-0.5 text-xl font-black leading-none tabular-nums">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {qrAvailable || transfer.available ? (
          <div className="grid grid-flow-row gap-2 sm:grid-flow-col sm:auto-cols-fr">
            {qrAvailable ? (
              <button
                type="button"
                onClick={() => onOpenQr(ticket)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground active:scale-[0.98]"
              >
                <QrCodeIcon className="size-4" />
                QR code
              </button>
            ) : null}
            {transfer.available ? (
              <button
                type="button"
                onClick={() => onTransfer(ticket)}
                disabled={transferState === 'pending'}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-background/20 px-3 text-sm font-bold active:scale-[0.98] disabled:opacity-60"
              >
                {transferState === 'copied' ? <CheckIcon className="size-4" /> : <SendIcon className="size-4" />}
                {transferState === 'copied'
                  ? 'Lien copié'
                  : transferState === 'pending'
                    ? 'Redirection…'
                    : transfer.unlocked
                      ? 'Envoyer'
                      : 'Transférer'}
              </button>
            ) : null}
          </div>
        ) : transfer.closedByDeadline ? (
          <p className="text-xs text-background/50">Transfert clos : possible jusqu&apos;à la veille de l&apos;événement.</p>
        ) : null}
      </div>
    </article>
  )
}
