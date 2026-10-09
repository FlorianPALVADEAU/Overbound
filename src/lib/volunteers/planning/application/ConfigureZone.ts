import { PlanningError } from '../domain/errors'
import type { ZoneCatalog } from '../domain/Zone'
import type { ZoneSetting } from '../domain/ZoneSetting'
import type { PlanningRepository } from './ports'

export class ConfigureZone {
  constructor(
    private readonly repository: PlanningRepository,
    private readonly zones: ZoneCatalog,
  ) {}

  async execute(eventId: string, setting: ZoneSetting): Promise<void> {
    if (!this.zones.has(setting.zoneKey)) throw new PlanningError(`Zone inconnue : ${setting.zoneKey}.`)
    if (setting.capacity !== null && (!Number.isInteger(setting.capacity) || setting.capacity < 0)) {
      throw new PlanningError('L’effectif cible doit être un entier positif ou nul.')
    }
    if (setting.weight !== null && (!Number.isInteger(setting.weight) || setting.weight < 1)) {
      throw new PlanningError('Le poids doit être un entier supérieur ou égal à 1.')
    }
    await this.repository.saveZoneSetting(eventId, setting)
  }
}
