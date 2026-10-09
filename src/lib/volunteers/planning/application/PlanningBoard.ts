import type { Shift } from '../../shared/Shift'
import type { AssignmentSnapshot } from '../domain/Assignment'
import type { VolunteerCandidateSnapshot } from '../domain/VolunteerCandidate'
import type { Zone, ZoneCatalog } from '../domain/Zone'
import type { ZoneSummary } from '../domain/ZoneOccupancy'
import type { PlanningView } from './GetPlanning'

// Ce que l’écran d’administration affiche, déduit de la vue du planning : qui est dans quelle zone,
// quelles zones sont pleines ou en manque, qui reste à placer. Aucune règle n’est dans les composants.
export class PlanningBoard {
  constructor(
    private readonly view: PlanningView,
    private readonly zoneCatalog: ZoneCatalog,
  ) {}

  zones(): readonly Zone[] {
    return this.zoneCatalog.all()
  }

  // RESP et AIDE d’abord, puis les bénévoles par ordre alphabétique.
  people(shift: Shift, zoneKey: string): AssignmentSnapshot[] {
    return this.view.assignments
      .filter((assignment) => assignment.shift === shift && assignment.zoneKey === zoneKey)
      .sort(
        (a, b) =>
          Number(a.role === 'member') - Number(b.role === 'member') || a.displayName.localeCompare(b.displayName, 'fr'),
      )
  }

  summaryOf(shift: Shift, zoneKey: string): ZoneSummary {
    return (
      this.view.summary.find((row) => row.shift === shift && row.zoneKey === zoneKey) ?? {
        shift,
        zoneKey,
        count: 0,
        capacity: null,
        missing: 0,
        full: false,
      }
    )
  }

  isFull(shift: Shift, zoneKey: string): boolean {
    return this.summaryOf(shift, zoneKey).full
  }

  // Bénévoles disponibles sur ce créneau qui n’ont pas encore de zone.
  unassigned(shift: Shift): VolunteerCandidateSnapshot[] {
    return this.view.candidates.filter(
      (candidate) =>
        candidate.shifts.includes(shift) &&
        !this.view.assignments.some((a) => a.applicationId === candidate.id && a.shift === shift),
    )
  }

  // Disponibilité non reconnue : jamais placés automatiquement.
  withoutRecognizedAvailability(): VolunteerCandidateSnapshot[] {
    return this.view.candidates.filter((candidate) => candidate.shifts.length === 0)
  }

  missingTotal(shift: Shift): number {
    return this.view.summary.filter((row) => row.shift === shift).reduce((sum, row) => sum + row.missing, 0)
  }

  get candidateCount(): number {
    return this.view.candidates.length
  }

  get assignmentCount(): number {
    return this.view.assignments.length
  }
}
