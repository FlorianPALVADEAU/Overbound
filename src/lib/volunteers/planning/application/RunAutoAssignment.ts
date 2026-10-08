import type { UnplacedVolunteer, VolunteerPlanner } from '../domain/VolunteerPlanner'
import type { PlanningRepository } from './ports'

export interface AutoAssignmentOutcome {
  added: number
  removed: number
  unplaced: UnplacedVolunteer[]
}

export class RunAutoAssignment {
  constructor(
    private readonly repository: PlanningRepository,
    private readonly planner: VolunteerPlanner,
  ) {}

  async execute(eventId: string): Promise<AutoAssignmentOutcome> {
    const [candidates, existing, settings] = await Promise.all([
      this.repository.findCandidates(eventId),
      this.repository.findAssignments(eventId),
      this.repository.findZoneSettings(eventId),
    ])

    const plan = this.planner.plan({ candidates, settings, existing })

    const removedIds = plan.removed.flatMap((assignment) => (assignment.id ? [assignment.id] : []))
    if (removedIds.length > 0) await this.repository.deleteAssignments(eventId, removedIds)
    if (plan.added.length > 0) await this.repository.addAssignments(eventId, plan.added)

    return { added: plan.added.length, removed: plan.removed.length, unplaced: plan.unplaced }
  }
}
