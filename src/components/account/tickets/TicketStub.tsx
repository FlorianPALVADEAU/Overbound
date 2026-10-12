import { CheckIcon, QrCodeIcon, RotateCcwIcon, SendIcon } from 'lucide-react'
import { UserAvatar } from '@/components/account/UserAvatar'
import { formatLongDate, formatPrice } from '@/lib/account/format'
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
  /** Cancel a "billet flexible" bib; only offered while a refund is possible. */
  onCancel?: (ticket: AccountRegistrationItem) => void
  className?: string
}

/**
 * A bib printed like one: the number is the hero (or the ticket name while no
 * number is assigned), the participant and practical facts sit under the
 * tear-off line, and the two actions are labelled buttons.
 */
export function TicketStub({ ticket, context, transferState, onOpenQr, onTransfer, onCancel, className }: TicketStubProps) {
  const { now } = context
  const identity = context.identify(ticket)
  const holder = describeHolder(ticket, identity)
  const facts = getTicketFacts(ticket)
  const phase = getEventPhase(ticket.event_date, now)
  const qrAvailable = canShowTicketQr(ticket, now)
  const transfer = getTransferState(ticket, now)
  const bib = bibLabel(ticket.bib_number)
  const refundLabel = formatPrice(ticket.flexible_refund_amount_cents ?? null, ticket.currency)
  const refundDeadline = formatLongDate(ticket.flexible_refund_deadline ?? null)

  const status = ticket.checked_in
    ? { label: 'Présent', tone: 'text-emerald-700' }
    : phase === 'past'
      ? { label: 'Terminé', tone: 'text-background/50' }
      : ticket.claim_status === 'claimed'
        ? { label: 'Reçu', tone: 'text-background/60' }
        : null

  const showActions = qrAvailable || transfer.available || transfer.closedByDeadline

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-2xl bg-foreground text-background shadow-lg shadow-black/25 ring-1 ring-background/10',
        className,
      )}
    >
      <div className="h-1.5 bg-primary" aria-hidden />
      <div className="px-5 pb-5 pt-4">
        <div className="flex min-h-5 items-start justify-between gap-3">
          <p className="min-w-0 truncate text-label font-bold uppercase text-background/60">
            {bib ? `Dossard · ${ticket.ticket_name ?? 'Billet'}` : 'Billet'}
          </p>
          {status ? (
            <p className={cn('flex shrink-0 items-center gap-1 text-label font-bold uppercase tracking-wider', status.tone)}>
              {ticket.checked_in ? <CheckIcon className="size-3.5" strokeWidth={3} /> : null}
              {status.label}
            </p>
          ) : null}
        </div>

        <div className="mt-2 flex h-16 items-end">
          {bib ? (
            <p className="text-display-lg font-bold leading-[0.82] tracking-tighter tabular-nums">{bib}</p>
          ) : (
            <p className="line-clamp-2 text-balance break-words text-title font-bold tracking-tight">{ticket.ticket_name ?? 'Dossard'}</p>
          )}
        </div>
        <div className="mt-3 flex h-6 items-center gap-2">
          {identity.avatarUrl ? <UserAvatar src={identity.avatarUrl} name={identity.name} className="size-6 shrink-0 text-label" /> : null}
          <p className="min-w-0 truncate text-sm font-semibold text-background/80">{holder ?? ''}</p>
        </div>
      </div>

      {/* Tear-off line with its two notches */}
      <div className="relative" aria-hidden>
        <div className="mx-5 border-t-2 border-dashed border-background/20" />
        <span className="absolute -left-3 -top-3 size-6 rounded-full bg-background" />
        <span className="absolute -right-3 -top-3 size-6 rounded-full bg-background" />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-5">
        <dl className="grid h-12 grid-cols-3 divide-x divide-background/15">
          {(['Départ', 'SAS', 'Format'] as const).map((label) => {
            const value = facts.find((fact) => fact.label === label)?.value
            return (
              <div key={label} className="flex min-w-0 flex-col justify-center px-4 first:pl-0">
                <dt className="text-label font-bold uppercase text-background/50">{label}</dt>
                <dd className={cn('mt-1.5 truncate text-xl font-bold leading-none tabular-nums', !value && 'text-background/30')}>
                  {value ?? '—'}
                </dd>
              </div>
            )
          })}
        </dl>

        {showActions ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenQr(ticket)}
              disabled={!qrAvailable}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
            >
              <QrCodeIcon className="size-4" />
              QR code
            </button>
            <button
              type="button"
              onClick={() => onTransfer(ticket)}
              disabled={!transfer.available || transferState === 'pending'}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-background/20 px-3 text-sm font-bold active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
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
          </div>
        ) : null}
        {transfer.closedByDeadline ? (
          <p className="text-xs text-background/50">Transfert clos : possible jusqu&apos;à la veille de l&apos;événement.</p>
        ) : null}

        {ticket.flexible_refund ? (
          <div className="mt-auto rounded-xl bg-background/10 p-3">
            <p className="flex items-center gap-1.5 text-label font-bold uppercase text-background/60">
              <RotateCcwIcon className="size-3.5" />
              Billet flexible
            </p>
            {onCancel && refundLabel ? (
              <>
                <p className="mt-1 text-sm text-background/80">
                  Remboursable sans justificatif{refundDeadline ? ` jusqu'au ${refundDeadline}` : ''}.
                </p>
                <button
                  type="button"
                  onClick={() => onCancel(ticket)}
                  className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-background px-3 text-center text-sm font-bold text-foreground active:scale-[0.98]"
                >
                  Me faire rembourser {refundLabel}
                </button>
              </>
            ) : (
              <p className="mt-1 text-sm text-background/60">Le délai de remboursement est dépassé.</p>
            )}
          </div>
        ) : null}
      </div>
    </article>
  )
}
