import { SHIFTS, type Shift } from '../../shared/Shift'
import { Assignment } from './Assignment'
import { TieBreaker } from './TieBreaker'
import type { VolunteerCandidate } from './VolunteerCandidate'
import type { Zone, ZoneCatalog } from './Zone'
import { ZoneOccupancy } from './ZoneOccupancy'
import type { ZoneSetting } from './ZoneSetting'

export interface UnplacedVolunteer {
  applicationId: string
  shift: Shift
  reason: 'zone_full' | 'no_zone'
}

export interface PlanInput {
  candidates: readonly VolunteerCandidate[]
  settings: readonly ZoneSetting[]
  existing: readonly Assignment[]
}

export interface Plan {
  assignments: Assignment[]
  added: Assignment[]
  removed: Assignment[]
  unplaced: UnplacedVolunteer[]
}

// Répartit les bénévoles dans les zones selon leur poste, leur créneau et l’effectif cible.
// Ne défait jamais ce qui est déjà en place : seuls les nouveaux candidats sont placés.
export class VolunteerPlanner {
  constructor(
    private readonly zones: ZoneCatalog,
    private readonly tieBreaker: TieBreaker = new TieBreaker(),
  ) {}

  plan({ candidates, settings, existing }: PlanInput): Plan {
    const { kept, removed } = this.retainExisting(existing, candidates)
    const occupancy = new ZoneOccupancy(this.zones, settings, kept)

    const added: Assignment[] = []
    const unplaced: UnplacedVolunteer[] = []
    const placed = [...kept]

    const ordered = [...candidates].sort((a, b) => a.id.localeCompare(b.id))
    for (const shift of SHIFTS) {
      for (const candidate of ordered) {
        if (!candidate.isAvailableFor(shift) || placed.some((a) => a.concerns(candidate.id, shift))) continue

        const zone = this.chooseZone(candidate, shift, placed, occupancy)
        if (!zone) {
          unplaced.push({ applicationId: candidate.id, shift, reason: this.unplacedReason(candidate) })
          continue
        }

        const assignment = Assignment.automatic(candidate.id, candidate.fullName, shift, zone.key)
        added.push(assignment)
        placed.push(assignment)
        occupancy.add(assignment)
      }
    }

    return { assignments: placed, added, removed, unplaced }
  }

  // Garde le manuel, et l’automatique encore valide (candidat présent, disponible, zone existante).
  private retainExisting(existing: readonly Assignment[], candidates: readonly VolunteerCandidate[]) {
    const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]))
    const kept: Assignment[] = []
    const removed: Assignment[] = []

    for (const assignment of existing) {
      const candidate = assignment.applicationId ? byId.get(assignment.applicationId) : undefined
      const stillValid = this.zones.has(assignment.zoneKey) && candidate?.isAvailableFor(assignment.shift) === true
      if (assignment.isManual || stillValid) kept.push(assignment)
      else removed.push(assignment)
    }
    return { kept, removed }
  }

  private chooseZone(
    candidate: VolunteerCandidate,
    shift: Shift,
    placed: readonly Assignment[],
    occupancy: ZoneOccupancy,
  ): Zone | null {
    // Un bénévole « journée » garde la même zone matin et après-midi quand c’est possible.
    const otherShift: Shift = shift === 'morning' ? 'afternoon' : 'morning'
    const sameZoneKey = placed.find((a) => a.concerns(candidate.id, otherShift))?.zoneKey
    const sameZone = sameZoneKey ? this.zones.find(sameZoneKey) : undefined

    if (candidate.podKey === null) {
      if (sameZone && !occupancy.isFull(shift, sameZone.key)) return sameZone
      return this.mostLackingZone(candidate, shift, occupancy) ?? this.leastFilledZone(candidate, shift, occupancy, 'obstacles')
    }

    const candidates = this.zones.forPod(candidate.podKey).filter((zone) => !occupancy.isFull(shift, zone.key))
    if (candidates.length === 0) return null
    if (sameZone && candidates.some((zone) => zone.key === sameZone.key)) return sameZone
    return this.pickLeastFilled(candidate, shift, occupancy, candidates)
  }

  // « Je laisse l’équipe décider » : on comble d’abord les zones qui ont un effectif cible à atteindre.
  private mostLackingZone(candidate: VolunteerCandidate, shift: Shift, occupancy: ZoneOccupancy): Zone | null {
    const lacking = this.zones
      .all()
      .map((zone) => ({ zone, gap: occupancy.missing(shift, zone.key) }))
      .filter(({ gap }) => gap > 0)
      .sort(
        (a, b) =>
          b.gap - a.gap ||
          this.tieBreaker.rank(candidate.id, a.zone.key) - this.tieBreaker.rank(candidate.id, b.zone.key),
      )
    return lacking[0]?.zone ?? null
  }

  private leastFilledZone(candidate: VolunteerCandidate, shift: Shift, occupancy: ZoneOccupancy, podKey: 'obstacles'): Zone | null {
    const open = this.zones.forPod(podKey).filter((zone) => !occupancy.isFull(shift, zone.key))
    return open.length === 0 ? null : this.pickLeastFilled(candidate, shift, occupancy, open)
  }

  private pickLeastFilled(candidate: VolunteerCandidate, shift: Shift, occupancy: ZoneOccupancy, zones: readonly Zone[]): Zone {
    return [...zones].sort(
      (a, b) =>
        occupancy.fillRatio(shift, a.key) - occupancy.fillRatio(shift, b.key) ||
        this.tieBreaker.rank(candidate.id, a.key) - this.tieBreaker.rank(candidate.id, b.key),
    )[0]
  }

  private unplacedReason(candidate: VolunteerCandidate): UnplacedVolunteer['reason'] {
    return candidate.podKey && this.zones.forPod(candidate.podKey).length > 0 ? 'zone_full' : 'no_zone'
  }
}
