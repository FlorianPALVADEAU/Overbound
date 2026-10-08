import type { PlanningRepository } from './ports'

export class RemoveAssignment {
  constructor(private readonly repository: PlanningRepository) {}

  async execute(eventId: string, assignmentId: string): Promise<void> {
    await this.repository.deleteAssignments(eventId, [assignmentId])
  }
}
