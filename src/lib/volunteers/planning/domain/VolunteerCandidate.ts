import { Availability } from '../../shared/Availability'
import type { PodCatalog, PodKey } from '../../shared/Pod'
import type { Shift } from '../../shared/Shift'

// Ligne de candidature telle que stockée (volunteer_applications).
export interface ApplicationRecord {
  id: string
  fullName: string
  email: string
  phone: string | null
  availability: string
  mission: string
  eventId: string | null
  eventSnapshotId: string | null
}

export interface VolunteerCandidateSnapshot {
  id: string
  fullName: string
  email: string
  phone: string | null
  availability: string
  mission: string
  shifts: Shift[]
  podKey: PodKey | null
  multiEvent: boolean
}

// Un bénévole vu sous l’angle du planning : sur quels créneaux il est disponible et quel type de
// poste il a demandé. Ces deux informations sont retrouvées depuis les libellés de la candidature.
export class VolunteerCandidate {
  private constructor(
    readonly id: string,
    readonly fullName: string,
    readonly email: string,
    readonly phone: string | null,
    readonly availability: string,
    readonly mission: string,
    readonly shifts: readonly Shift[],
    // null = « je laisse l’équipe décider » ou libellé ancien non attribuable.
    readonly podKey: PodKey | null,
    // Candidature sans événement précis (« plusieurs événements » ou événement hors liste).
    readonly multiEvent: boolean,
  ) {}

  static fromRecord(record: ApplicationRecord, pods: PodCatalog): VolunteerCandidate {
    return new VolunteerCandidate(
      record.id,
      record.fullName,
      record.email,
      record.phone,
      record.availability,
      record.mission,
      Availability.shiftsFromLabel(record.availability),
      pods.keyFromMission(record.mission),
      !record.eventId && !record.eventSnapshotId,
    )
  }

  isAvailableFor(shift: Shift): boolean {
    return this.shifts.includes(shift)
  }

  get hasRecognizedAvailability(): boolean {
    return this.shifts.length > 0
  }

  toSnapshot(): VolunteerCandidateSnapshot {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      availability: this.availability,
      mission: this.mission,
      shifts: [...this.shifts],
      podKey: this.podKey,
      multiEvent: this.multiEvent,
    }
  }
}
