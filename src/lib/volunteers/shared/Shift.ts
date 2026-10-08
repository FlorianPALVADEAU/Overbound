export type Shift = 'morning' | 'afternoon'

export const SHIFTS: readonly Shift[] = ['morning', 'afternoon']

export const isShift = (value: unknown): value is Shift => value === 'morning' || value === 'afternoon'

export const SHIFT_LABELS: Record<Shift, string> = {
  morning: 'Matin',
  afternoon: 'Après-midi',
}

// Titre du bloc dans le planning envoyé aux bénévoles. Le format de course change selon le créneau.
export const SHIFT_SHEET_TITLES: Record<Shift, string> = {
  morning: 'MATIN - RANKED - 07:00 à 12:00',
  afternoon: 'APRÈS-MIDI - OPEN - 12:00 à 19h',
}
