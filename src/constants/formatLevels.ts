export type FormatLevelId = 'low' | 'mid' | 'hard'

export const FORMAT_LEVELS: Record<
  FormatLevelId,
  { id: FormatLevelId; name: string; badgeClass: string; accentClass: string }
> = {
  low: {
    id: 'low',
    name: 'Primal',
    badgeClass: 'bg-green-100 text-green-800',
    accentClass: 'from-emerald-500/25 via-emerald-500/10 to-transparent',
  },
  mid: {
    id: 'mid',
    name: 'Fury',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    accentClass: 'from-amber-500/25 via-amber-500/10 to-transparent',
  },
  hard: {
    id: 'hard',
    name: 'Ultra Hardcore',
    badgeClass: 'bg-red-100 text-red-800',
    accentClass: 'from-red-500/25 via-red-500/10 to-transparent',
  },
}
