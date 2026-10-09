import type { AssignmentSnapshot } from '../domain/Assignment'
import { ZoneOccupancy, type ZoneSummary } from '../domain/ZoneOccupancy'
import type { VolunteerCandidateSnapshot } from '../domain/VolunteerCandidate'
import type { ZoneCatalog } from '../domain/Zone'
import type { ZoneSetting } from '../domain/ZoneSetting'
import type { PlanningRepository } from './ports'

export interface PlanningView {
  candidates: VolunteerCandidateSnapshot[]
  assignments: AssignmentSnapshot[]
  settings: ZoneSetting[]
  summary: ZoneSummary[]
}

export class GetPlanning {
  constructor(
    private readonly repository: PlanningRepository,
    private readonly zones: ZoneCatalog,
  ) {}

  async execute(eventId: string): Promise<PlanningView> {
    const [candidates, assignments, settings] = await Promise.all([
      this.repository.findCandidates(eventId),
      this.repository.findAssignments(eventId),
      this.repository.findZoneSettings(eventId),
    ])

    return {
      candidates: candidates.map((candidate) => candidate.toSnapshot()),
      assignments: assignments.map((assignment) => assignment.toSnapshot()),
      settings,
      summary: new ZoneOccupancy(this.zones, settings, assignments).summary(),
    }
  }
}
