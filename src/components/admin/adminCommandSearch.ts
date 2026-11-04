import type { AdminNavItem } from './adminNavItems'

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/**
 * Pages matching the query, best first: label starts with the query, then label contains it,
 * then the href matches. Accents and case are ignored. An empty query returns every page.
 */
export function searchAdminNavItems(items: AdminNavItem[], query: string): AdminNavItem[] {
  const needle = normalize(query)
  if (needle === '') return items

  const rank = (item: AdminNavItem): number | null => {
    const label = normalize(item.label)
    if (label.startsWith(needle)) return 0
    if (label.includes(needle)) return 1
    if (normalize(item.href).includes(needle)) return 2
    return null
  }

  return items
    .map((item) => ({ item, rank: rank(item) }))
    .filter((entry): entry is { item: AdminNavItem; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.item)
}
