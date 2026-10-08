import { podCatalog } from '../../shared/Pod'
import { AssignManually } from '../application/AssignManually'
import { ConfigureZone } from '../application/ConfigureZone'
import { ExportPlanning } from '../application/ExportPlanning'
import { GetPlanning } from '../application/GetPlanning'
import { RemoveAssignment } from '../application/RemoveAssignment'
import { RunAutoAssignment } from '../application/RunAutoAssignment'
import { PlanningSheet } from '../domain/PlanningSheet'
import { VolunteerPlanner } from '../domain/VolunteerPlanner'
import { zoneCatalog } from '../domain/Zone'
import { ExcelPlanningWorkbookWriter } from './ExcelPlanningWorkbookWriter'
import { SupabasePlanningRepository } from './SupabasePlanningRepository'

// Point d’assemblage : les routes API appellent ces cas d’usage et rien d’autre.
export const createPlanningServices = () => {
  const repository = new SupabasePlanningRepository(podCatalog)
  return {
    getPlanning: new GetPlanning(repository, zoneCatalog),
    runAutoAssignment: new RunAutoAssignment(repository, new VolunteerPlanner(zoneCatalog)),
    assignManually: new AssignManually(repository, zoneCatalog),
    removeAssignment: new RemoveAssignment(repository),
    configureZone: new ConfigureZone(repository, zoneCatalog),
    exportPlanning: new ExportPlanning(repository, new PlanningSheet(zoneCatalog), new ExcelPlanningWorkbookWriter()),
  }
}
