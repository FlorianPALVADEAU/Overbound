import type { PlanningRepository } from '../application/ports'
import type { Assignment } from '../domain/Assignment'
import type { VolunteerCandidate } from '../domain/VolunteerCandidate'
import type { ZoneSetting } from '../domain/ZoneSetting'

// Double de test : même contrat que le dépôt Supabase, sans base de données.
export class InMemoryPlanningRepository implements PlanningRepository {
  private nextId = 1
  settings: ZoneSetting[] = []
  assignments: Assignment[] = []

  constructor(
    private readonly candidates: VolunteerCandidate[] = [],
    private readonly eventDate: string | null = null,
  ) {}

  async findCandidates() {
    return this.candidates
  }
  async findAssignments() {
    return this.assignments
  }
  async findZoneSettings() {
    return this.settings
  }
  async findEventDate() {
    return this.eventDate
  }

  async addAssignments(_eventId: string, assignments: readonly Assignment[]) {
    for (const assignment of assignments) await this.saveAssignment('', assignment, false)
  }

  async deleteAssignments(_eventId: string, ids: readonly string[]) {
    this.assignments = this.assignments.filter((a) => !a.id || !ids.includes(a.id))
  }

  async saveAssignment(_eventId: string, assignment: Assignment, replace = true) {
    const { Assignment: AssignmentClass } = await import('../domain/Assignment')
    const existing = replace
      ? this.assignments.find(
          (a) =>
            (assignment.id && a.id === assignment.id) ||
            (assignment.applicationId && a.concerns(assignment.applicationId, assignment.shift)),
        )
      : undefined
    const id = existing?.id ?? assignment.id ?? `a${this.nextId++}`
    const stored = new AssignmentClass({ ...assignment.toSnapshot(), id })
    this.assignments = [...this.assignments.filter((a) => a !== existing), stored]
  }

  async saveZoneSetting(_eventId: string, setting: ZoneSetting) {
    this.settings = [
      ...this.settings.filter((s) => !(s.shift === setting.shift && s.zoneKey === setting.zoneKey)),
      setting,
    ]
  }
}
