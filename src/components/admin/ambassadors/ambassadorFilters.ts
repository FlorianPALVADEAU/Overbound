import type { AdminAmbassadorRow } from '@/lib/admin/ambassadors/types'

/** What the list is filtered on: work waiting for the team, work waiting for the ambassador, or inactive accounts. */
export type AmbassadorHandling = 'all' | 'to_fulfil' | 'to_claim' | 'inactive'

export const AMBASSADOR_HANDLING_OPTIONS: ReadonlyArray<{ value: AmbassadorHandling; label: string }> = [
  { value: 'to_fulfil', label: 'Récompenses à remettre' },
  { value: 'to_claim', label: 'Récompenses à réclamer' },
  { value: 'inactive', label: 'Comptes inactifs' },
]

export const isAmbassadorHandling = (value: string): value is AmbassadorHandling =>
  value === 'all' || AMBASSADOR_HANDLING_OPTIONS.some((option) => option.value === value)

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const matchesTerm = (term: string, values: ReadonlyArray<string | null | undefined>) => {
  const needle = normalize(term.trim())
  if (!needle) return true
  return values.some((value) => value && normalize(value).includes(needle))
}

const matchesHandling = (row: AdminAmbassadorRow, handling: AmbassadorHandling) => {
  switch (handling) {
    case 'to_fulfil':
      return row.rewards_to_fulfil > 0
    case 'to_claim':
      return row.rewards_to_claim > 0
    case 'inactive':
      return !row.is_active
    case 'all':
      return true
  }
}

/** Rows matching the search (name or promo code, accents and case ignored) and the handling filter. */
export const filterAmbassadorRows = (rows: readonly AdminAmbassadorRow[], term: string, handling: AmbassadorHandling) =>
  rows.filter((row) => matchesHandling(row, handling) && matchesTerm(term, [row.ambassador_name, row.ambassador_code]))
