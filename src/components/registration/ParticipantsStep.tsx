import { useState, type ReactNode } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParticipantErrors } from '@/lib/checkout/checkoutValidation'
import { participantsToAlign } from '@/lib/checkout/sharedWave'
import { joinName } from '@/lib/registration'
import { countComplete, nextIncompleteParticipantId } from '@/lib/checkout/participantProgress'
import ParticipantPanel, { participantPanelId } from './ParticipantPanel'
import type { EventTicket, Participant } from './types'

interface ParticipantsStepProps {
  eventId: string
  participants: Participant[]
  ticketMap: Record<string, EventTicket>
  onFieldChange: (participantId: string, field: keyof Participant, value: string | boolean) => void
  onWaveSelect: (participantId: string, waveIndex: number | null) => void
  /** Errors per participant id, empty until the visitor tries to pay. */
  errorsByParticipant: Record<string, ParticipantErrors>
  /** Whether each participant's form is filled in correctly, shown or not. */
  completeById: Record<string, boolean>
  groupBanner?: ReactNode
  groupAnchor: { waveIndex: number; startTime: string } | null
}

export default function ParticipantsStep({
  eventId,
  participants,
  ticketMap,
  onFieldChange,
  onWaveSelect,
  errorsByParticipant,
  completeById,
  groupBanner,
  groupAnchor,
}: ParticipantsStepProps) {
  // One shortcut at a time: under the first participant others could follow.
  const leader = groupAnchor ? undefined : participants.find((participant) => participantsToAlign(participants, participant.id).length > 0)
  const ids = participants.map((participant) => participant.id)
  const collapsible = participants.length > 1
  // undefined: nothing chosen yet, the first participant is open. null: all folded by the visitor.
  const [chosenId, setChosenId] = useState<string | null | undefined>(undefined)
  const openId = chosenId === undefined ? (ids[0] ?? null) : chosenId
  const complete = countComplete(ids, completeById)

  const openParticipant = (id: string | null) => {
    setChosenId(id)
    if (!id) return
    requestAnimationFrame(() => document.getElementById(participantPanelId(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const alignOn = (source: Participant) => {
    for (const id of participantsToAlign(participants, source.id)) onWaveSelect(id, source.selectedWaveIndex ?? null)
  }

  return (
    <div className="space-y-5">
      {groupBanner}
      {participants.length > 1 && !groupAnchor ? (
        <p className="text-sm text-muted-foreground">
          Pour partir ensemble, choisis le même SAS pour chacun, ou crée un groupe en haut de page.
        </p>
      ) : null}
      {collapsible ? (
        <div className="flex flex-wrap items-center justify-between gap-3" aria-live="polite">
          <p className="text-sm font-medium">
            {complete} / {participants.length} complet{complete > 1 ? 's' : ''}
          </p>
          {complete < participants.length ? (
            <button
              type="button"
              onClick={() => openParticipant(nextIncompleteParticipantId(ids, completeById, null))}
              className="min-h-11 rounded-xl border border-border px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              Aller au prochain à compléter
            </button>
          ) : null}
        </div>
      ) : null}
      {participants.map((participant, index) => {
        const followers = participant.id === leader?.id ? participantsToAlign(participants, participant.id) : []
        const errors = errorsByParticipant[participant.id] ?? {}
        const next = nextIncompleteParticipantId(ids, completeById, participant.id)
        return (
          <div key={participant.id} className="space-y-2">
            <ParticipantPanel
              eventId={eventId}
              participant={participant}
              index={index}
              ticket={ticketMap[participant.ticketId]}
              onFieldChange={onFieldChange}
              onWaveSelect={onWaveSelect}
              errors={errors}
              groupAnchor={groupAnchor}
              collapsible={collapsible}
              // Errors revealed on pay: the panel must be open for the page to focus the field.
              open={!collapsible || openId === participant.id || Object.keys(errors).length > 0}
              onToggle={() => setChosenId(openId === participant.id ? null : participant.id)}
              isComplete={completeById[participant.id] === true}
              onNext={next ? () => openParticipant(next) : undefined}
            />
            {followers.length > 0 ? (
              <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={() => alignOn(participant)}>
                <Users className="mr-2 h-4 w-4" aria-hidden />
                Même SAS que {joinName(participant.firstName, participant.lastName) || `Participant ${index + 1}`} pour{' '}
                {followers.length > 1 ? `les ${followers.length} autres` : "l'autre participant"}
              </Button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
