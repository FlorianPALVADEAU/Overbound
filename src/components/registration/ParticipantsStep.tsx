import type { ReactNode } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParticipantErrors } from '@/lib/checkout/checkoutValidation'
import { participantsToAlign } from '@/lib/checkout/sharedWave'
import { joinName } from '@/lib/registration'
import ParticipantForm from './ParticipantForm'
import type { EventTicket, Participant } from './types'

interface ParticipantsStepProps {
  eventId: string
  participants: Participant[]
  ticketMap: Record<string, EventTicket>
  onFieldChange: (participantId: string, field: keyof Participant, value: string | boolean) => void
  onWaveSelect: (participantId: string, waveIndex: number | null) => void
  /** Errors per participant id, empty until the visitor tries to pay. */
  errorsByParticipant: Record<string, ParticipantErrors>
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
  groupBanner,
  groupAnchor,
}: ParticipantsStepProps) {
  // One shortcut at a time: under the first participant others could follow.
  const leader = groupAnchor ? undefined : participants.find((participant) => participantsToAlign(participants, participant.id).length > 0)
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
      {participants.map((participant, index) => {
        const followers = participant.id === leader?.id ? participantsToAlign(participants, participant.id) : []
        return (
          <div key={participant.id} className="space-y-2">
            <ParticipantForm
              eventId={eventId}
              participant={participant}
              index={index}
              ticket={ticketMap[participant.ticketId]}
              onFieldChange={onFieldChange}
              onWaveSelect={onWaveSelect}
              errors={errorsByParticipant[participant.id] ?? {}}
              groupAnchor={groupAnchor}
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
