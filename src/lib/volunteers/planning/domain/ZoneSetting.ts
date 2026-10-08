import type { Shift } from '../../shared/Shift'

// Réglage d’une zone pour un créneau. `null` = valeur par défaut (pas de limite d’effectif,
// poids de la zone).
export interface ZoneSetting {
  shift: Shift
  zoneKey: string
  capacity: number | null
  weight: number | null
}
