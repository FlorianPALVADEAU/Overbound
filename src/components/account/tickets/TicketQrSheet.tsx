'use client'

import { useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatLongDate } from '@/lib/account/format'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'
import { bibLabel, describeHolder, getTicketFacts, type TicketContext } from './ticketPresentation'

const SWIPE_THRESHOLD_PX = 56

interface TicketQrSheetProps {
  /** The QR-ready bibs of the event, in display order. */
  tickets: AccountRegistrationItem[]
  openId: string | null
  context: TicketContext
  onOpenChange: (id: string | null) => void
}

/**
 * Full-screen, white, built to be scanned: the QR is as large as the screen
 * allows and you flick sideways to the next friend's bib.
 */
export function TicketQrSheet({ tickets, openId, context, onOpenChange }: TicketQrSheetProps) {
  const touchStartX = useRef<number | null>(null)
  const index = tickets.findIndex((ticket) => ticket.registration_id === openId)
  const ticket = index >= 0 ? tickets[index] : null
  const identity = ticket ? context.identify(ticket) : { name: null, age: null, avatarUrl: null }

  const go = (delta: number) => {
    const next = tickets[index + delta]
    if (next) onOpenChange(next.registration_id)
  }

  return (
    <Dialog open={ticket !== null} onOpenChange={(open) => !open && onOpenChange(null)}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-foreground p-0 text-background sm:max-w-none"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current
          touchStartX.current = null
          const end = event.changedTouches[0]?.clientX
          if (start === null || end === undefined) return
          const delta = end - start
          if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) go(delta < 0 ? 1 : -1)
        }}
      >
        {ticket ? (
          <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
            <DialogTitle className="sr-only">
              Billet {bibLabel(ticket.bib_number) ?? ticket.ticket_name ?? ''} — {ticket.event_title ?? 'Overbound'}
            </DialogTitle>
            <DialogDescription className="sr-only">QR code à présenter au check-in.</DialogDescription>

            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-background/60">
                {tickets.length > 1 ? `Dossard ${index + 1} sur ${tickets.length}` : 'Check-in'}
              </p>
              <DialogClose className="flex size-11 items-center justify-center rounded-full bg-background/10" aria-label="Fermer">
                <XIcon className="size-5" />
              </DialogClose>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-5">
              {ticket.qr_code_data_url ? (
                <img
                  src={ticket.qr_code_data_url}
                  alt={`QR code ${bibLabel(ticket.bib_number) ? `du dossard ${bibLabel(ticket.bib_number)}` : 'du billet'}`}
                  className="aspect-square w-[min(78vw,22rem)] rounded-2xl bg-white p-2"
                />
              ) : null}

              <div className="text-center">
                {bibLabel(ticket.bib_number) ? (
                  <p className="text-7xl font-black leading-none tracking-tighter tabular-nums">{bibLabel(ticket.bib_number)}</p>
                ) : (
                  <p className="text-balance text-3xl font-black leading-tight tracking-tight">{ticket.ticket_name ?? 'Billet'}</p>
                )}
                <p className="mt-2 text-base font-semibold">{describeHolder(ticket, identity) ?? ''}</p>
                <p className="mt-1 text-sm text-background/60">
                  {[bibLabel(ticket.bib_number) ? ticket.ticket_name : null, ...getTicketFacts(ticket).map((fact) => `${fact.label} ${fact.value}`)].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-1 text-xs text-background/50">{formatLongDate(ticket.event_date)}</p>
              </div>
            </div>

            {tickets.length > 1 ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={index === 0}
                  className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-background/10 text-sm font-bold disabled:opacity-30"
                >
                  <ChevronLeftIcon className="size-5" /> Précédent
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={index === tickets.length - 1}
                  className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-background text-sm font-bold text-foreground disabled:opacity-30"
                >
                  Suivant <ChevronRightIcon className="size-5" />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
