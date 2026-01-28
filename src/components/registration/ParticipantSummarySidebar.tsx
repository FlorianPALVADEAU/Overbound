import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { joinName } from '@/lib/registration'
import type { EventTicket, Participant } from './types'

interface ParticipantSummarySidebarProps {
  participants: Participant[]
  ticketMap: Record<string, EventTicket>
}

export default function ParticipantSummarySidebar({
  participants,
  ticketMap,
}: ParticipantSummarySidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Participants</CardTitle>
        <CardDescription>Les informations seront visibles par l&apos;équipe Overbound.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {participants.length === 0 ? (
          <p className="text-muted-foreground">Aucun participant renseigné.</p>
        ) : (
          participants.map((participant) => {
            const ticket = ticketMap[participant.ticketId]
            return (
              <div key={participant.id} className="rounded-lg border border-muted/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {joinName(participant.firstName, participant.lastName) || 'Participant'}
                  </span>
                  {ticket ? <Badge variant="outline">{ticket.name}</Badge> : null}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {participant.email || 'Email à renseigner'}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
