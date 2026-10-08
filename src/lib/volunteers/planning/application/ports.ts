import type { Assignment } from '../domain/Assignment'
import type { ShiftBlock } from '../domain/PlanningSheet'
import type { VolunteerCandidate } from '../domain/VolunteerCandidate'
import type { ZoneSetting } from '../domain/ZoneSetting'

// Accès aux données du planning. L’implémentation (Supabase) vit dans `infrastructure/` ;
// les cas d’usage ne connaissent que ce contrat, ce qui les rend testables sans base.
export interface PlanningRepository {
  // Candidatures de l’événement, plus celles sans événement précis.
  findCandidates(eventId: string): Promise<VolunteerCandidate[]>
  findAssignments(eventId: string): Promise<Assignment[]>
  findZoneSettings(eventId: string): Promise<ZoneSetting[]>
  findEventDate(eventId: string): Promise<string | null>

  addAssignments(eventId: string, assignments: readonly Assignment[]): Promise<void>
  deleteAssignments(eventId: string, ids: readonly string[]): Promise<void>
  // Crée l’affectation, ou remplace celle de la même candidature sur le même créneau.
  saveAssignment(eventId: string, assignment: Assignment): Promise<void>
  saveZoneSetting(eventId: string, setting: ZoneSetting): Promise<void>
}

// Produit le fichier du planning à partir des blocs déjà mis en forme.
export interface PlanningWorkbookWriter {
  write(title: string, blocks: readonly ShiftBlock[]): Promise<Uint8Array>
}
