import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Ticket as TicketIcon } from 'lucide-react'
import { isRankedFormatTicket, formatWaveStartTime } from '@/lib/openSas'
import { ticketUsesWaveSelection } from '@/lib/tickets/operationsProfile'
import { useSelectableOpenWaves } from '@/hooks/registration/useSelectableOpenWaves'
import type { EventTicket, Participant } from './types'

interface ParticipantFormProps {
  eventId: string
  participant: Participant
  index: number
  ticket: EventTicket | undefined
  onFieldChange: (participantId: string, field: keyof Participant, value: string) => void
  onWaveSelect: (participantId: string, waveIndex: number | null) => void
  showErrors: boolean
  groupAnchor: { waveIndex: number; startTime: string } | null
}

export default function ParticipantForm({
  eventId,
  participant,
  index,
  ticket,
  onFieldChange,
  onWaveSelect,
  showErrors,
  groupAnchor,
}: ParticipantFormProps) {
  const usesWaveSelection = ticket ? ticketUsesWaveSelection(ticket) : false
  const isRankedFormat = isRankedFormatTicket(ticket?.name, ticket?.race?.name)
  const { waves: selectableWaves, isLoading: wavesLoading, error: wavesError } = useSelectableOpenWaves(
    eventId,
    ticket?.id,
    usesWaveSelection && !groupAnchor,
  )
  const errorClass = 'border-destructive focus-visible:ring-destructive'
  const hasError = (value: string) => showErrors && !value.trim()
  const requiredMessage = 'Ce champ est obligatoire.'

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between text-base font-semibold">
        <span>Participant {index + 1}</span>
        {ticket ? (
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <TicketIcon className="h-3 w-3" />
            {ticket.name}
          </Badge>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${participant.id}-firstName`} className="flex items-center gap-2">
            Prénom <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${participant.id}-firstName`}
            value={participant.firstName}
            onChange={(e) => onFieldChange(participant.id, 'firstName', e.target.value)}
            placeholder="Camille"
            required
            className={hasError(participant.firstName) ? errorClass : ''}
          />
          {hasError(participant.firstName) ? (
            <p className="text-xs text-destructive font-medium">{requiredMessage}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${participant.id}-lastName`} className="flex items-center gap-2">
            Nom <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${participant.id}-lastName`}
            value={participant.lastName}
            onChange={(e) => onFieldChange(participant.id, 'lastName', e.target.value)}
            placeholder="Martin"
            required
            className={hasError(participant.lastName) ? errorClass : ''}
          />
          {hasError(participant.lastName) ? (
            <p className="text-xs text-destructive font-medium">{requiredMessage}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${participant.id}-email`} className="flex items-center gap-2">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${participant.id}-email`}
            type="email"
            value={participant.email}
            onChange={(e) => onFieldChange(participant.id, 'email', e.target.value)}
            placeholder="camille.martin@email.com"
            required
            className={hasError(participant.email) ? errorClass : ''}
          />
          {hasError(participant.email) ? (
            <p className="text-xs text-destructive font-medium">{requiredMessage}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${participant.id}-birthDate`} className="flex items-center gap-2">
            Date de naissance <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${participant.id}-birthDate`}
            type="date"
            value={participant.birthDate}
            onChange={(e) => onFieldChange(participant.id, 'birthDate', e.target.value)}
            required
            className={hasError(participant.birthDate) ? errorClass : ''}
          />
          {hasError(participant.birthDate) ? (
            <p className="text-xs text-destructive font-medium">{requiredMessage}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${participant.id}-emergency`} className="flex items-center gap-2">
            Contact d'urgence <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${participant.id}-emergency`}
            value={participant.emergencyContactName}
            onChange={(e) => onFieldChange(participant.id, 'emergencyContactName', e.target.value)}
            placeholder="Nom et prénom"
            required
            className={hasError(participant.emergencyContactName) ? errorClass : ''}
          />
          {hasError(participant.emergencyContactName) ? (
            <p className="text-xs text-destructive font-medium">{requiredMessage}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${participant.id}-emergencyPhone`} className="flex items-center gap-2">
            Téléphone d'urgence <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${participant.id}-emergencyPhone`}
            value={participant.emergencyContactPhone}
            onChange={(e) =>
              onFieldChange(participant.id, 'emergencyContactPhone', e.target.value)
            }
            placeholder="06 xx xx xx xx"
            required
            className={hasError(participant.emergencyContactPhone) ? errorClass : ''}
          />
          {hasError(participant.emergencyContactPhone) ? (
            <p className="text-xs text-destructive font-medium">{requiredMessage}</p>
          ) : null}
        </div>
        {usesWaveSelection ? (
          <>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`${participant.id}-wave`} className="flex items-center gap-2">
                SAS de départ <span className="text-destructive">*</span>
              </Label>
              {groupAnchor ? (
                <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  Départ fixé par ton groupe : <span className="font-semibold">{formatWaveStartTime(groupAnchor.startTime)}</span>
                </p>
              ) : (
                <>
                  <Select
                    value={participant.selectedWaveIndex ? String(participant.selectedWaveIndex) : ''}
                    onValueChange={(value) => onWaveSelect(participant.id, Number(value))}
                    disabled={wavesLoading}
                  >
                    <SelectTrigger
                      id={`${participant.id}-wave`}
                      className={showErrors && !participant.selectedWaveIndex ? errorClass : ''}
                    >
                      <SelectValue
                        placeholder={
                          wavesLoading
                            ? 'Chargement des SAS...'
                            : selectableWaves.length === 0
                              ? 'Aucun SAS disponible'
                              : 'Choisis ton SAS de départ'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableWaves.map((wave) => (
                        <SelectItem key={wave.wave_index} value={String(wave.wave_index)}>
                          {formatWaveStartTime(wave.start_time)} — {wave.remaining} place{wave.remaining > 1 ? 's' : ''} restante{wave.remaining > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {wavesError ? (
                    <p className="text-xs text-destructive font-medium">{wavesError}</p>
                  ) : null}
                  {showErrors && !participant.selectedWaveIndex ? (
                    <p className="text-xs text-destructive font-medium">{requiredMessage}</p>
                  ) : null}
                </>
              )}
            </div>
          </>
        ) : null}
        {isRankedFormat ? (
          <div className="space-y-2 md:col-span-2">
            <p className="text-xs text-muted-foreground">
              Format RANKED : départ unique automatique à 08:00.
            </p>
          </div>
        ) : null}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`${participant.id}-medical`}>Informations médicales (optionnel)</Label>
          <Textarea
            id={`${participant.id}-medical`}
            rows={3}
            value={participant.medicalInfo}
            onChange={(e) => onFieldChange(participant.id, 'medicalInfo', e.target.value)}
            placeholder="Allergies, traitement en cours, etc."
          />
        </div>
      </div>
    </div>
  )
}
