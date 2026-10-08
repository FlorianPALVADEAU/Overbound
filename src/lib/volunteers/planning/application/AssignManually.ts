import { Assignment, type AssignmentRole } from '../domain/Assignment'
import { PlanningError } from '../domain/errors'
import type { Shift } from '../../shared/Shift'
import type { ZoneCatalog } from '../domain/Zone'
import type { PlanningRepository } from './ports'

export interface ManualAssignmentCommand {
  eventId: string
  // Renseigné pour déplacer une affectation existante (surtout un RESP/AIDE sans candidature).
  assignmentId?: string
  applicationId: string | null
  displayName: string
  shift: Shift
  zoneKey: string
  role: AssignmentRole
}

// Pose, déplace ou change le rôle de quelqu’un (bénévole, AIDE, RESP) à la main. Un bénévole
// promu garde le lien avec sa candidature. L’affectation est verrouillée : la répartition
// automatique ne la défait plus.
export class AssignManually {
  constructor(
    private readonly repository: PlanningRepository,
    private readonly zones: ZoneCatalog,
  ) {}

  async execute(command: ManualAssignmentCommand): Promise<void> {
    const displayName = command.displayName.trim()
    if (!displayName) throw new PlanningError('Le nom est requis.')
    if (!this.zones.has(command.zoneKey)) throw new PlanningError(`Zone inconnue : ${command.zoneKey}.`)

    await this.repository.saveAssignment(
      command.eventId,
      Assignment.manual({
        id: command.assignmentId,
        applicationId: command.applicationId,
        displayName,
        shift: command.shift,
        zoneKey: command.zoneKey,
        role: command.role,
      }),
    )
  }
}
