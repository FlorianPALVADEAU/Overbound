import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Ticket as TicketIcon } from 'lucide-react'
import { FORMAT_LEVELS, type FormatLevelId } from '@/constants/formatLevels'
import { DISTANCE_MIN_KM, DISTANCE_MAX_KM } from '@/constants/registration'
import type { EventTicket, Participant } from './types'

interface ParticipantFormProps {
  participant: Participant
  index: number
  ticket: EventTicket | undefined
  onFieldChange: (participantId: string, field: keyof Participant, value: string) => void
  showErrors: boolean
}

export default function ParticipantForm({
  participant,
  index,
  ticket,
  onFieldChange,
  showErrors,
}: ParticipantFormProps) {
  const isUniversalRace = ticket?.race?.is_universal ?? true
  const errorClass = 'border-destructive focus-visible:ring-destructive'
  const hasError = (value: string) => showErrors && !value.trim()
  const distanceMinValue = Number(participant.distanceMinKm)
  const distanceIdealValue = Number(participant.distanceIdealKm)
  const distanceMinMissing = showErrors && !participant.distanceMinKm.trim()
  const distanceIdealMissing = showErrors && !participant.distanceIdealKm.trim()
  const distanceRangeError = (value: number) =>
    Number.isFinite(value) && (value < DISTANCE_MIN_KM || value > DISTANCE_MAX_KM)
  const distanceOrderError = showErrors &&
    Number.isFinite(distanceMinValue) &&
    Number.isFinite(distanceIdealValue) &&
    distanceIdealValue < distanceMinValue

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Participant {index + 1}</span>
          {ticket ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <TicketIcon className="h-3 w-3" />
              {ticket.name}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {!isUniversalRace && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${participant.id}-difficulty`} className="flex items-center gap-2">
              Niveau de difficulté <span className="text-destructive">*</span>
            </Label>
            <Select
              value={participant.difficultyLevel || ''}
              onValueChange={(value) =>
                onFieldChange(participant.id, 'difficultyLevel', value as FormatLevelId)
              }
            >
              <SelectTrigger
                id={`${participant.id}-difficulty`}
                className={showErrors && !participant.difficultyLevel ? errorClass : ''}
              >
                <SelectValue placeholder="Choisissez votre niveau de difficulté" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="font-medium">{FORMAT_LEVELS.low.name}</span>
                    <span className="text-xs text-muted-foreground">
                      - Obstacles classiques accessibles
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="mid">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="font-medium">{FORMAT_LEVELS.mid.name}</span>
                    <span className="text-xs text-muted-foreground">- Obstacles exigeants</span>
                  </div>
                </SelectItem>
                <SelectItem value="hard">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="font-medium">{FORMAT_LEVELS.hard.name}</span>
                    <span className="text-xs text-muted-foreground">
                      - Obstacles extrêmes + lests
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Même parcours, 3 défis différents. Innovation mondiale Overbound.
            </p>
          </div>
        )}
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
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${participant.id}-distance-min`} className="flex items-center gap-2">
            Distance minimale (km) <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            La distance que vous êtes sûr de faire.
          </p>
          <Input
            id={`${participant.id}-distance-min`}
            type="number"
            min={DISTANCE_MIN_KM}
            max={DISTANCE_MAX_KM}
            step={1}
            value={participant.distanceMinKm}
            onChange={(e) => onFieldChange(participant.id, 'distanceMinKm', e.target.value)}
            placeholder="10"
            required
            className={
              distanceMinMissing || distanceRangeError(distanceMinValue) || distanceOrderError
                ? errorClass
                : ''
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${participant.id}-distance-ideal`} className="flex items-center gap-2">
            Distance idéale (km) <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            La distance que vous aimeriez atteindre.
          </p>
          <Input
            id={`${participant.id}-distance-ideal`}
            type="number"
            min={DISTANCE_MIN_KM}
            max={DISTANCE_MAX_KM}
            step={1}
            value={participant.distanceIdealKm}
            onChange={(e) => onFieldChange(participant.id, 'distanceIdealKm', e.target.value)}
            placeholder="20"
            required
            className={
              distanceIdealMissing || distanceRangeError(distanceIdealValue) || distanceOrderError
                ? errorClass
                : ''
            }
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <p className="text-xs text-muted-foreground">
            Ces infos servent à attribuer automatiquement votre heure de départ.
          </p>
          {distanceOrderError ? (
            <p className="text-xs text-destructive font-medium">
              La distance idéale doit être supérieure ou égale à la distance minimale.
            </p>
          ) : null}
          {(distanceRangeError(distanceMinValue) || distanceRangeError(distanceIdealValue)) ? (
            <p className="text-xs text-destructive font-medium">
              La distance doit être comprise entre {DISTANCE_MIN_KM} et {DISTANCE_MAX_KM} km.
            </p>
          ) : null}
        </div>
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
      </CardContent>
    </Card>
  )
}
