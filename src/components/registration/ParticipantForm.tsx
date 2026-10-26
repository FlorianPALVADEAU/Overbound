import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { isRankedFormatTicket, formatWaveStartTime } from '@/lib/openSas'
import { ticketUsesWaveSelection } from '@/lib/tickets/operationsProfile'
import { HEALTH_DATA_CONSENT_LABEL, needsHealthDataConsent } from '@/lib/legal/healthData'
import { FLEXIBLE_REFUND_DEADLINE_DAYS, FLEXIBLE_TICKET_FEE_CENTS } from '@/lib/tickets/flexibleTicket'
import { useSelectableOpenWaves } from '@/hooks/registration/useSelectableOpenWaves'
import { RANKED_FORMAT_RULES } from '@/constants/raceFormatRules'
import { participantFieldId, type ParticipantField } from '@/lib/checkout/fieldIds'
import type { ParticipantErrors } from '@/lib/checkout/checkoutValidation'
import type { EventTicket, Participant } from './types'

interface ParticipantFormProps {
  eventId: string
  participant: Participant
  ticket: EventTicket | undefined
  onFieldChange: (participantId: string, field: keyof Participant, value: string | boolean) => void
  onWaveSelect: (participantId: string, waveIndex: number | null) => void
  /** Shown only once the visitor has tried to pay. */
  errors: ParticipantErrors
  groupAnchor: { waveIndex: number; startTime: string } | null
}

export default function ParticipantForm({
  eventId,
  participant,
  ticket,
  onFieldChange,
  onWaveSelect,
  errors,
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
  const idOf = (field: ParticipantField) => participantFieldId(participant.id, field)
  const errorId = (field: ParticipantField) => `${idOf(field)}-error`
  const errorText = (field: ParticipantField) =>
    errors[field] ? (
      <p id={errorId(field)} className="text-xs font-medium text-destructive">
        {errors[field]}
      </p>
    ) : null

  const field = (
    key: 'firstName' | 'lastName' | 'email' | 'birthDate' | 'emergencyContactName' | 'emergencyContactPhone',
    label: string,
    props: { type?: string; placeholder?: string; autoComplete?: string; inputMode?: 'tel' | 'email' } = {},
  ) => (
    <div className="space-y-2">
      <Label htmlFor={idOf(key)}>
        {label} <span className="text-destructive" aria-hidden>*</span>
      </Label>
      <Input
        id={idOf(key)}
        type={props.type}
        value={participant[key]}
        onChange={(e) => onFieldChange(participant.id, key, e.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        required
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? errorId(key) : undefined}
        className={cn('h-11', errors[key] && errorClass)}
      />
      {errorText(key)}
    </div>
  )

  return (
    <div className="space-y-8 p-5">
        <div className="space-y-4">
          <h3 className="text-eyebrow font-semibold uppercase text-subtle">Participant</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('firstName', 'Prénom', { placeholder: 'Camille', autoComplete: 'given-name' })}
            {field('lastName', 'Nom', { placeholder: 'Martin', autoComplete: 'family-name' })}
            {field('email', 'Email', { type: 'email', placeholder: 'camille.martin@email.com', autoComplete: 'email', inputMode: 'email' })}
            {field('birthDate', 'Date de naissance', { type: 'date', autoComplete: 'bday' })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-eyebrow font-semibold uppercase text-subtle">En cas d&apos;urgence</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('emergencyContactName', 'Personne à prévenir', { placeholder: 'Nom et prénom' })}
            {field('emergencyContactPhone', 'Son téléphone', { type: 'tel', placeholder: '06 12 34 56 78', autoComplete: 'tel', inputMode: 'tel' })}
          </div>
        </div>

        {usesWaveSelection ? (
          <div className="space-y-4">
            <h3 className="text-eyebrow font-semibold uppercase text-subtle">Heure de départ</h3>
            {groupAnchor ? (
              <p className="text-sm">
                Départ fixé par ton groupe : <span className="font-semibold">{formatWaveStartTime(groupAnchor.startTime)}</span>
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={idOf('wave')}>
                  SAS de départ <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <Select
                  value={participant.selectedWaveIndex ? String(participant.selectedWaveIndex) : ''}
                  onValueChange={(value) => onWaveSelect(participant.id, Number(value))}
                  disabled={wavesLoading}
                >
                  <SelectTrigger
                    id={idOf('wave')}
                    size="lg"
                    aria-invalid={Boolean(errors.wave)}
                    aria-describedby={errors.wave ? errorId('wave') : undefined}
                    className={cn('w-full sm:max-w-sm', errors.wave && errorClass)}
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
                {wavesError ? <p className="text-xs font-medium text-destructive">{wavesError}</p> : null}
                {errorText('wave')}
              </div>
            )}
          </div>
        ) : null}
        {isRankedFormat ? (
          <p className="text-sm text-muted-foreground">Format RANKED : départ unique à {RANKED_FORMAT_RULES.departure}, rien à choisir.</p>
        ) : null}

        <div className="space-y-4">
          <h3 className="text-eyebrow font-semibold uppercase text-subtle">Santé</h3>
          <div className="space-y-2">
            <Label htmlFor={`${participant.id}-medical`}>Informations médicales (facultatif)</Label>
            <Textarea
              id={`${participant.id}-medical`}
              rows={2}
              value={participant.medicalInfo}
              onChange={(e) => onFieldChange(participant.id, 'medicalInfo', e.target.value)}
              placeholder="Allergies, traitement en cours, etc."
            />
            <p className="text-xs text-muted-foreground">
              Ces informations ne sont enregistrées qu&apos;avec ton accord, et uniquement pour les secours.
            </p>
          </div>
          {needsHealthDataConsent(participant.medicalInfo) ? (
            <Label
              htmlFor={idOf('healthDataConsent')}
              className={cn(
                'flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-muted p-4 text-sm font-normal leading-relaxed',
                errors.healthDataConsent && 'ring-2 ring-destructive',
              )}
            >
              <Checkbox
                id={idOf('healthDataConsent')}
                checked={participant.healthDataConsent === true}
                onCheckedChange={(checked) => onFieldChange(participant.id, 'healthDataConsent', checked === true)}
                className="mt-0.5"
              />
              <span className="block">
                {HEALTH_DATA_CONSENT_LABEL}{' '}
                <span className="text-muted-foreground">Sans cet accord, ces informations ne sont pas enregistrées.</span>
                <span className="text-destructive" aria-hidden> *</span>
              </span>
            </Label>
          ) : null}
          {errorText('healthDataConsent')}
        </div>

        <div className="border-t border-border pt-6">
          <Label htmlFor={`${participant.id}-flexible`} className="flex min-h-11 cursor-pointer items-start gap-3 font-normal leading-relaxed">
            <Checkbox
              id={`${participant.id}-flexible`}
              checked={participant.flexible === true}
              onCheckedChange={(checked) => onFieldChange(participant.id, 'flexible', checked === true)}
              className="mt-0.5"
            />
            <span className="block space-y-1">
              <span className="block text-sm font-semibold">
                Billet flexible (+{formatFlexibleFee()}) : annulable sans justificatif
              </span>
              <span className="block text-xs text-muted-foreground">
                Remboursé jusqu&apos;à {FLEXIBLE_REFUND_DEADLINE_DAYS} jours avant l&apos;événement, depuis ton espace. Les
                frais de l&apos;option ne sont pas remboursés, et elle est perdue si le billet est transféré.
              </span>
            </span>
          </Label>
        </div>
    </div>
  )
}

const formatFlexibleFee = () =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(FLEXIBLE_TICKET_FEE_CENTS / 100)
