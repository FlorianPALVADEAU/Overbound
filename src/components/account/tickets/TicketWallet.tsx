'use client'

import type { TransferUiState } from '@/hooks/account/useTicketTransfer'
import { useSnapIndex } from '@/hooks/account/useSnapIndex'
import { cn } from '@/lib/utils'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'
import { TicketStub } from './TicketStub'
import type { TicketContext } from './ticketPresentation'

interface TicketWalletProps {
  tickets: AccountRegistrationItem[]
  context: TicketContext
  transferStateFor: (registrationId: string) => TransferUiState
  onOpenQr: (ticket: AccountRegistrationItem) => void
  onTransfer: (ticket: AccountRegistrationItem) => void
}

/**
 * Every bib of one event. On a phone: a scroll-snap row (next bib peeking,
 * swipe or drag). From tablet up: a plain grid, nothing to slide.
 */
export function TicketWallet({ tickets, context, transferStateFor, onOpenQr, onTransfer }: TicketWalletProps) {
  const { ref, index, onScroll, scrollTo, dragHandlers } = useSnapIndex()
  const many = tickets.length > 1

  return (
    <div>
      <div
        ref={ref}
        onScroll={many ? onScroll : undefined}
        {...(many ? dragHandlers : {})}
        className={cn(
          '-mx-5 flex gap-3 px-5 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] md:gap-4 md:overflow-visible md:px-0',
          many &&
            'snap-x snap-mandatory overflow-x-auto scroll-px-5 pb-1 [scrollbar-width:none] md:snap-none md:pb-0 [&::-webkit-scrollbar]:hidden',
        )}
      >
        {tickets.map((ticket) => (
          <div
            key={ticket.registration_id}
            className={cn('snap-center md:w-auto md:max-w-[20rem]', many ? 'w-[82%] shrink-0 select-none sm:w-[20rem]' : 'w-full')}
          >
            <TicketStub
              ticket={ticket}
              context={context}
              transferState={transferStateFor(ticket.registration_id)}
              onOpenQr={onOpenQr}
              onTransfer={onTransfer}
            />
          </div>
        ))}
      </div>

      {many ? (
        <div className="mt-4 flex items-center justify-between md:hidden">
          <p className="text-xs font-semibold tabular-nums text-muted-foreground">
            <span className="text-foreground">{index + 1}</span> / {tickets.length} dossards
          </p>
          <div className="flex gap-1.5" role="tablist" aria-label="Choisir un dossard">
            {tickets.map((ticket, dotIndex) => (
              <button
                key={ticket.registration_id}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`Dossard ${dotIndex + 1}`}
                onClick={() => scrollTo(dotIndex)}
                className="flex size-6 items-center justify-center"
              >
                <span className={cn('h-1.5 rounded-full transition-all', dotIndex === index ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/40')} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
