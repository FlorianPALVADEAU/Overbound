import type { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import type { EventTicket, Participant } from './types'
import ParticipantForm from './ParticipantForm'

interface ParticipantsStepProps {
  participants: Participant[]
  ticketMap: Record<string, EventTicket>
  onFieldChange: (participantId: string, field: keyof Participant, value: string) => void
  showErrors: boolean
  groupBanner?: ReactNode
}

export default function ParticipantsStep({
  participants,
  ticketMap,
  onFieldChange,
  showErrors,
  groupBanner,
}: ParticipantsStepProps) {
  return (
    <div className="space-y-4">
      {groupBanner}
      {participants.length === 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ajoutez au moins un billet pour renseigner les participants.
          </AlertDescription>
        </Alert>
      ) : null}

      {participants.map((participant, index) => (
        <ParticipantForm
          key={participant.id}
          participant={participant}
          index={index}
          ticket={ticketMap[participant.ticketId]}
          onFieldChange={onFieldChange}
          showErrors={showErrors}
        />
      ))}
    </div>
  )
}
