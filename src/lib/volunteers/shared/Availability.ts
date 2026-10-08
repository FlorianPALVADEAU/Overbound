import type { Shift } from './Shift'

export interface AvailabilityOption {
  value: string
  label: string
}

export const AVAILABILITY_OPTIONS: readonly AvailabilityOption[] = [
  { value: 'morning', label: 'Matin' },
  { value: 'afternoon', label: 'Après-midi' },
  { value: 'full_day', label: 'Toute la journée' },
]

export const DEFAULT_AVAILABILITY = 'full_day'

export class Availability {
  static labelOf(value: string): string {
    return AVAILABILITY_OPTIONS.find((option) => option.value === value)?.label ?? value
  }

  // Retrouve les créneaux depuis le libellé stocké (`availability`), anciens libellés compris.
  // Un libellé inconnu ne donne aucun créneau : la candidature reste à traiter à la main.
  static shiftsFromLabel(label: string): Shift[] {
    const normalized = label.trim().toLowerCase()
    if (normalized === 'matin') return ['morning']
    if (normalized === 'après-midi') return ['afternoon']
    if (
      normalized === 'toute la journée' ||
      normalized.startsWith('journée complète') ||
      normalized.startsWith('flexible')
    ) {
      return ['morning', 'afternoon']
    }
    return []
  }
}
