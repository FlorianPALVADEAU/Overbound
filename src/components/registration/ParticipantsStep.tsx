import type { ReactNode } from 'react'
import type { EventTicket, Participant } from './types'
import ParticipantForm from './ParticipantForm'

interface ParticipantsStepProps {
  eventId: string
  participants: Participant[]
  ticketMap: Record<string, EventTicket>
  onFieldChange: (participantId: string, field: keyof Participant, value: string | boolean) => void
  onWaveSelect: (participantId: string, waveIndex: number | null) => void
  showErrors: boolean
  groupBanner?: ReactNode
  groupAnchor: { waveIndex: number; startTime: string } | null
}

export default function ParticipantsStep({
  eventId,
  participants,
  ticketMap,
  onFieldChange,
  onWaveSelect,
  showErrors,
  groupBanner,
  groupAnchor,
}: ParticipantsStepProps) {
  return (
    <div className="space-y-5">
      {groupBanner}
      {participants.map((participant, index) => (
        <ParticipantForm
          key={participant.id}
          eventId={eventId}
          participant={participant}
          index={index}
          ticket={ticketMap[participant.ticketId]}
          onFieldChange={onFieldChange}
          onWaveSelect={onWaveSelect}
          showErrors={showErrors}
          groupAnchor={groupAnchor}
        />
      ))}
    </div>
  )
}
