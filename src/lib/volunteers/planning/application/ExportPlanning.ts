import type { PlanningSheet } from '../domain/PlanningSheet'
import type { PlanningRepository, PlanningWorkbookWriter } from './ports'

export interface PlanningFile {
  filename: string
  content: Uint8Array
}

export class ExportPlanning {
  constructor(
    private readonly repository: PlanningRepository,
    private readonly sheet: PlanningSheet,
    private readonly writer: PlanningWorkbookWriter,
  ) {}

  async execute(eventId: string): Promise<PlanningFile> {
    const [assignments, eventDate] = await Promise.all([
      this.repository.findAssignments(eventId),
      this.repository.findEventDate(eventId),
    ])

    const year = (eventDate ? new Date(eventDate) : new Date()).getFullYear()
    const content = await this.writer.write(`Planning bénévoles Overbound ${year}`, this.sheet.blocks(assignments))
    return { filename: `planning-benevoles-${year}.xlsx`, content }
  }
}
