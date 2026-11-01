import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatWaveStartTime } from '@/lib/openSas'
import { formatPrice } from '@/lib/pricing'
import { useSelectableOpenWaves } from '@/hooks/registration/useSelectableOpenWaves'
import {
  COMPANION_WAVE_MESSAGES,
  getCompanionWaveAvailability,
  type CompanionOffer,
} from '@/lib/tickets/openCompanion'
import { participantFieldId } from '@/lib/checkout/fieldIds'
import type { Participant } from './types'

interface CompanionOptionProps {
  eventId: string
  participant: Participant
  offer: CompanionOffer
  currency: string
  onToggle: (participantId: string, enabled: boolean) => void
  onWaveSelect: (participantId: string, waveIndex: number | null) => void
  /** Shown only once the visitor has tried to pay. */
  error?: string
}

/** "Option OPEN" of a RANKED bib: a second bib on the OPEN ticket, with its own SAS. */
export default function CompanionOption({ eventId, participant, offer, currency, onToggle, onWaveSelect, error }: CompanionOptionProps) {
  const enabled = participant.companion === true
  const { waves, isLoading, error: wavesError } = useSelectableOpenWaves(eventId, offer.openTicketId, enabled, {
    includeFull: true,
  })
  const checkboxId = `${participant.id}-companion`
  const waveId = participantFieldId(participant.id, 'companionWave')
  const errorId = `${waveId}-error`
  const hasSavings = offer.fullPriceCents != null && offer.fullPriceCents > offer.priceCents

  return (
    <div className="space-y-4 rounded-xl bg-muted p-4">
      <Label htmlFor={checkboxId} className="flex min-h-11 cursor-pointer items-start gap-3 font-normal leading-relaxed">
        <Checkbox
          id={checkboxId}
          checked={enabled}
          onCheckedChange={(checked) => onToggle(participant.id, checked === true)}
          className="mt-0.5"
        />
        <span className="block space-y-1">
          <span className="block text-sm font-semibold">
            Cours aussi le format OPEN (+{formatPrice(offer.priceCents, currency)})
            {hasSavings ? (
              <span className="ml-2 font-normal text-muted-foreground line-through">
                {formatPrice(offer.fullPriceCents as number, currency)}
              </span>
            ) : null}
          </span>
          <span className="block text-xs text-muted-foreground">
            Un second dossard et une seconde médaille, avec ton propre départ après ton RANKED. Il suit ton billet RANKED :
            annulation et transfert comprennent les deux, et il ne se rembourse pas seul.
          </span>
        </span>
      </Label>

      {enabled ? (
        <div className="space-y-2">
          <Label htmlFor={waveId}>
            SAS OPEN <span className="text-destructive" aria-hidden>*</span>
          </Label>
          <Select
            value={participant.companionWaveIndex ? String(participant.companionWaveIndex) : ''}
            onValueChange={(value) => onWaveSelect(participant.id, Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger
              id={waveId}
              size="lg"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className={cn('w-full bg-background sm:max-w-sm', error && 'border-destructive focus-visible:ring-destructive')}
            >
              <SelectValue placeholder={isLoading ? 'Chargement des SAS...' : 'Choisis ton SAS OPEN'} />
            </SelectTrigger>
            <SelectContent>
              {waves.map((wave) => {
                const availability = getCompanionWaveAvailability(
                  { startTime: wave.start_time, capacity: wave.capacity, assignedCount: wave.capacity - wave.remaining },
                  offer.earliestStart,
                )
                return (
                  <SelectItem key={wave.wave_index} value={String(wave.wave_index)} disabled={!availability.selectable}>
                    {formatWaveStartTime(wave.start_time)}
                    {availability.selectable
                      ? `, ${wave.remaining} place${wave.remaining > 1 ? 's' : ''} restante${wave.remaining > 1 ? 's' : ''}`
                      : `, ${COMPANION_WAVE_MESSAGES[availability.reason]}`}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Départ possible à partir de {formatWaveStartTime(offer.earliestStart.toISOString())}, le temps de finir ton RANKED
            et de récupérer.
          </p>
          {wavesError ? <p className="text-xs font-medium text-destructive">{wavesError}</p> : null}
          {error ? (
            <p id={errorId} className="text-xs font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
