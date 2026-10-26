import { useId } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { joinName } from '@/lib/registration'
import { cn } from '@/lib/utils'
import ParticipantForm from './ParticipantForm'
import type { ParticipantErrors } from '@/lib/checkout/checkoutValidation'
import type { EventTicket, Participant } from './types'

interface ParticipantPanelProps {
  eventId: string
  participant: Participant
  index: number
  ticket: EventTicket | undefined
  onFieldChange: (participantId: string, field: keyof Participant, value: string | boolean) => void
  onWaveSelect: (participantId: string, waveIndex: number | null) => void
  errors: ParticipantErrors
  groupAnchor: { waveIndex: number; startTime: string } | null
  /** False for a lone participant: the form is simply shown. */
  collapsible: boolean
  open: boolean
  onToggle: () => void
  isComplete: boolean
  /** Opens the next incomplete participant; absent when none is left. */
  onNext?: () => void
}

export const participantPanelId = (participantId: string) => `participant-panel-${participantId}`

/** One participant of the order: a header that folds the form, with its status visible when folded. */
export default function ParticipantPanel({
  collapsible,
  open,
  onToggle,
  isComplete,
  onNext,
  index,
  participant,
  ticket,
  ...formProps
}: ParticipantPanelProps) {
  const bodyId = useId()
  const hasErrors = Object.keys(formProps.errors).length > 0
  const name = joinName(participant.firstName, participant.lastName) || `Participant ${index + 1}`
  const status = hasErrors ? 'À corriger' : isComplete ? 'Complet' : 'À compléter'

  const title = (
    <>
      <span
        aria-hidden
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
          isComplete ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground',
        )}
      >
        {isComplete ? <Check className="h-4 w-4" /> : index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold">{name}</span>
        {ticket ? <span className="block truncate text-sm text-muted-foreground">{ticket.name}</span> : null}
      </span>
    </>
  )

  return (
    <section id={participantPanelId(participant.id)} className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card" aria-label={name}>
      {collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center gap-3 bg-muted px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
        >
          {title}
          <span className={cn('shrink-0 text-sm font-medium', hasErrors ? 'text-destructive' : isComplete ? 'text-primary' : 'text-muted-foreground')}>
            {status}
          </span>
          <ChevronDown aria-hidden className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-standard', open && 'rotate-180')} />
        </button>
      ) : (
        <div className="flex items-center gap-3 bg-muted px-4 py-3 sm:px-5">{title}</div>
      )}

      {open ? (
        <div id={bodyId} className="border-t border-border">
          <ParticipantForm participant={participant} ticket={ticket} {...formProps} />
          {collapsible && onNext ? (
            <div className="border-t border-border p-4 sm:px-5">
              <button
                type="button"
                onClick={onNext}
                className="min-h-11 w-full rounded-xl border border-border px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
              >
                Participant suivant à compléter
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
