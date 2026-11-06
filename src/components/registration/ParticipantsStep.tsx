import { emergencyContactToReuse } from '@/lib/checkout/emergencyContact'
import { useState, type ReactNode } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParticipantErrors } from '@/lib/checkout/checkoutValidation'
import { participantsToAlign } from '@/lib/checkout/sharedWave'
import { joinName } from '@/lib/registration'
import { isMinorOnEventDate } from '@/lib/checkout/participantAge'
import { countComplete, nextIncompleteParticipantId } from '@/lib/checkout/participantProgress'
import ParticipantPanel, { participantPanelId } from './ParticipantPanel'
import { resolveCompanionOffer } from '@/lib/tickets/openCompanion'
import { isParticipantOffered, type TshirtOffer } from '@/lib/tshirtOffer'
import { TshirtOfferNote } from '@/components/tshirt/TshirtOfferNote'
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
  eventDate: string
  /** Age refusals per participant id, known as soon as the birth date is typed. */
  birthDateRefusals: Record<string, string>
  currency: string
  onCompanionToggle: (participantId: string, enabled: boolean) => void
  onCompanionWaveSelect: (participantId: string, waveIndex: number | null) => void
  /** Free T-shirt offer: the first participants it covers get a size field. */
  tshirtOffer?: TshirtOffer | null
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
  eventDate,
  birthDateRefusals,
  currency,
  onCompanionToggle,
  onCompanionWaveSelect,
  tshirtOffer = null,
}: ParticipantsStepProps) {
  // A participant stays locked until a valid birth date: no other field, SAS or option until then.
  const isLocked = (participant: Participant) => !participant.birthDate.trim() || Boolean(birthDateRefusals[participant.id])
  const lockedCount = participants.filter(isLocked).length
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
      {lockedCount > 0 ? (
        <p role="status" className="rounded-xl border border-primary/40 bg-card p-3 text-sm font-medium text-foreground">
          Date de naissance d&apos;abord : tant que la date de naissance de chaque participant n&apos;est pas valide, le reste de
          l&apos;inscription est bloqué. {lockedCount > 1 ? `${lockedCount} participants restent à compléter.` : null}
        </p>
      ) : null}
      {groupBanner}
      <TshirtOfferNote
        offer={tshirtOffer}
        hint={participants.length > 1 ? 'La taille se choisit dans la fiche de chaque participant concerné.' : undefined}
      />
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
        const ageRefusal = birthDateRefusals[participant.id]
        const errors = ageRefusal
          ? { ...errorsByParticipant[participant.id], birthDate: ageRefusal }
          : (errorsByParticipant[participant.id] ?? {})
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
              emergencyContactSuggestion={emergencyContactToReuse(participants, participant.id)}
              companionOffer={resolveCompanionOffer(ticketMap[participant.ticketId] ?? {}, Object.values(ticketMap), eventDate)}
              currency={currency}
              tshirtOffered={isParticipantOffered(tshirtOffer, index)}
              isMinor={isMinorOnEventDate(participant.birthDate, eventDate)}
              locked={isLocked(participant)}
              onCompanionToggle={onCompanionToggle}
              onCompanionWaveSelect={onCompanionWaveSelect}
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
