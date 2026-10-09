'use client'

import { useMemo, useState } from 'react'
import { Download, Loader2, Wand2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  downloadVolunteerPlanning,
  useVolunteerPlanning,
  useVolunteerPlanningActions,
  type AutoAssignmentOutcome,
} from '@/app/api/admin/volunteers/planning/planningQueries'
import { PlanningBoard } from '@/lib/volunteers/planning/application/PlanningBoard'
import { zoneCatalog } from '@/lib/volunteers/planning/domain/Zone'
import { SHIFTS, SHIFT_LABELS, type Shift } from '@/lib/volunteers/shared/Shift'
import { UnassignedList } from './UnassignedList'
import { ZoneCard } from './ZoneCard'

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

export function VolunteerPlanningSection({ eventId }: { eventId?: string }) {
  const [shift, setShift] = useState<Shift>('morning')
  const [lastRun, setLastRun] = useState<AutoAssignmentOutcome | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useVolunteerPlanning(eventId)
  const { autoAssign, assign, remove, configureZone } = useVolunteerPlanningActions(eventId)
  const board = useMemo(() => (data ? new PlanningBoard(data, zoneCatalog) : null), [data])

  if (!eventId) {
    return (
      <Alert>
        <AlertTitle>Choisis un événement</AlertTitle>
        <AlertDescription>Le planning bénévoles se prépare événement par événement.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement du planning…
      </div>
    )
  }

  if (isError || !board) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Planning indisponible</AlertTitle>
        <AlertDescription>
          {error?.message ?? 'Erreur de chargement.'} Si les tables du planning n’existent pas encore, applique la
          migration 20260929100000_volunteer_planning.sql.
        </AlertDescription>
      </Alert>
    )
  }

  const handleExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      await downloadVolunteerPlanning(eventId)
    } catch {
      setExportError('Export impossible. Réessaie dans un instant.')
    } finally {
      setExporting(false)
    }
  }

  const missing = board.missingTotal(shift)
  const hasWriteError = autoAssign.isError || assign.isError || remove.isError || configureZone.isError || exportError

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Planning bénévoles</h2>
          <p className="text-sm text-muted-foreground">
            {plural(board.candidateCount, 'candidature')} · {plural(board.assignmentCount, 'affectation')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => autoAssign.mutate(undefined, { onSuccess: setLastRun })} disabled={autoAssign.isPending}>
            {autoAssign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Répartir automatiquement
          </Button>
          <Button type="button" variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exporter .xlsx
          </Button>
        </div>
      </div>

      {lastRun ? (
        <Alert>
          <AlertTitle>
            Répartition terminée : {plural(lastRun.added, 'ajout')}, {plural(lastRun.removed, 'retrait')}
          </AlertTitle>
          {lastRun.unplaced.length > 0 ? (
            <AlertDescription>
              {plural(lastRun.unplaced.length, 'placement')} impossible{lastRun.unplaced.length > 1 ? 's' : ''} (zone
              pleine ou poste sans zone) : à retrouver dans « À placer ».
            </AlertDescription>
          ) : null}
        </Alert>
      ) : null}

      {hasWriteError ? (
        <Alert variant="destructive">
          <AlertTitle>Action échouée</AlertTitle>
          <AlertDescription>{exportError ?? 'Une modification n’a pas pu être enregistrée.'}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {SHIFTS.map((value) => (
          <Button key={value} type="button" variant={value === shift ? 'default' : 'outline'} onClick={() => setShift(value)}>
            {SHIFT_LABELS[value]}
          </Button>
        ))}
        {missing > 0 ? <span className="text-sm text-destructive">{plural(missing, 'personne')} manquante{missing > 1 ? 's' : ''} sur ce créneau</span> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {board.zones().map((zone) => (
          <ZoneCard
            key={`${shift}-${zone.key}`}
            board={board}
            zone={zone}
            shift={shift}
            onCapacityChange={(capacity) =>
              configureZone.mutate({
                shift,
                zoneKey: zone.key,
                capacity,
                weight: data?.settings.find((s) => s.shift === shift && s.zoneKey === zone.key)?.weight ?? null,
              })
            }
            onMove={(person, zoneKey) =>
              assign.mutate({
                assignmentId: person.id,
                applicationId: person.applicationId,
                displayName: person.displayName,
                shift: person.shift,
                zoneKey,
                role: person.role,
              })
            }
            onChangeRole={(person, role) =>
              assign.mutate({
                assignmentId: person.id,
                applicationId: person.applicationId,
                displayName: person.displayName,
                shift: person.shift,
                zoneKey: person.zoneKey,
                role,
              })
            }
            onRemove={(person) => person.id && remove.mutate(person.id)}
            onAddPerson={(name, role) => assign.mutate({ applicationId: null, displayName: name, shift, zoneKey: zone.key, role })}
          />
        ))}
      </div>

      <UnassignedList
        board={board}
        shift={shift}
        onAssign={(candidate, zoneKey) =>
          assign.mutate({ applicationId: candidate.id, displayName: candidate.fullName, shift, zoneKey, role: 'member' })
        }
      />

      {board.withoutRecognizedAvailability().length > 0 ? (
        <Alert>
          <AlertTitle>Candidatures sans créneau reconnu ({board.withoutRecognizedAvailability().length})</AlertTitle>
          <AlertDescription>
            {board
              .withoutRecognizedAvailability()
              .map((candidate) => `${candidate.fullName} (${candidate.availability})`)
              .join(' · ')}
            . Elles ne sont pas placées automatiquement.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
