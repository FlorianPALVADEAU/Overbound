import { SHIFTS, type Shift } from '../../shared/Shift'
import type { Assignment } from './Assignment'
import type { ZoneCatalog } from './Zone'
import type { ZoneSetting } from './ZoneSetting'

export interface ZoneSummary {
  shift: Shift
  zoneKey: string
  count: number
  capacity: number | null
  missing: number
  full: boolean
}

// Effectif de chaque zone, par créneau, face à son effectif cible. Tout le monde compte :
// RESP, AIDE et bénévoles.
export class ZoneOccupancy {
  private readonly counts = new Map<string, number>()
  private readonly settings = new Map<string, ZoneSetting>()

  constructor(
    private readonly zones: ZoneCatalog,
    settings: readonly ZoneSetting[],
    assignments: readonly Assignment[] = [],
  ) {
    settings.forEach((setting) => this.settings.set(this.keyOf(setting.shift, setting.zoneKey), setting))
    assignments.forEach((assignment) => this.add(assignment))
  }

  add(assignment: Assignment): void {
    const key = this.keyOf(assignment.shift, assignment.zoneKey)
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1)
  }

  count(shift: Shift, zoneKey: string): number {
    return this.counts.get(this.keyOf(shift, zoneKey)) ?? 0
  }

  // null = pas de limite.
  capacityOf(shift: Shift, zoneKey: string): number | null {
    return this.settings.get(this.keyOf(shift, zoneKey))?.capacity ?? null
  }

  weightOf(shift: Shift, zoneKey: string): number {
    const configured = this.settings.get(this.keyOf(shift, zoneKey))?.weight
    return configured && configured > 0 ? configured : (this.zones.find(zoneKey)?.defaultWeight ?? 1)
  }

  isFull(shift: Shift, zoneKey: string): boolean {
    const capacity = this.capacityOf(shift, zoneKey)
    return capacity !== null && this.count(shift, zoneKey) >= capacity
  }

  // Places encore à pourvoir pour atteindre l’effectif cible (0 si pas de cible).
  missing(shift: Shift, zoneKey: string): number {
    const capacity = this.capacityOf(shift, zoneKey)
    return capacity === null ? 0 : Math.max(capacity - this.count(shift, zoneKey), 0)
  }

  // Taux de remplissage pondéré : sert à répartir un pod sur plusieurs zones.
  fillRatio(shift: Shift, zoneKey: string): number {
    return this.count(shift, zoneKey) / this.weightOf(shift, zoneKey)
  }

  summary(): ZoneSummary[] {
    return SHIFTS.flatMap((shift) =>
      this.zones.all().map((zone) => ({
        shift,
        zoneKey: zone.key,
        count: this.count(shift, zone.key),
        capacity: this.capacityOf(shift, zone.key),
        missing: this.missing(shift, zone.key),
        full: this.isFull(shift, zone.key),
      })),
    )
  }

  private keyOf(shift: Shift, zoneKey: string): string {
    return `${shift}:${zoneKey}`
  }
}
