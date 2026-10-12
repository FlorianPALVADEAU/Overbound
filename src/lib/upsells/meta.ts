/**
 * Display of an option's `meta` in the back office. `assignments` is internal
 * bookkeeping (who takes what, as ids), never something to show.
 */
const INTERNAL_META_KEYS = new Set(['assignments'])

export const isInternalUpsellMetaKey = (key: string): boolean => INTERNAL_META_KEYS.has(key)

export const humanizeMetaKey = (key: string): string =>
  key
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase())

export const extractSpecBreakdown = (
  meta: unknown,
  quantity: number,
): Array<{ label: string; quantity: number }> => {
  if (!meta || typeof meta !== 'object') return []

  const counts = new Map<string, number>()
  const increment = (label: string, by: number) => {
    if (!label || by <= 0) return
    counts.set(label, (counts.get(label) ?? 0) + by)
  }

  for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
    if (value === null || value === undefined || isInternalUpsellMetaKey(key)) continue

    if (key === 'sizes' && Array.isArray(value)) {
      // For t-shirts, one size entry represents one sold item.
      for (const size of value) {
        if (typeof size === 'string' && size.trim().length > 0) increment(`Taille ${size.trim()}`, 1)
      }
      continue
    }

    if (key === 'size' && typeof value === 'string' && value.trim().length > 0) {
      increment(`Taille ${value.trim()}`, Math.max(1, quantity))
      continue
    }

    if (Array.isArray(value)) {
      const serialized = value.map((entry) => String(entry)).join(', ')
      if (serialized.length > 0) increment(`${humanizeMetaKey(key)}: ${serialized}`, Math.max(1, quantity))
      continue
    }

    if (typeof value === 'object') continue
    increment(`${humanizeMetaKey(key)}: ${String(value)}`, Math.max(1, quantity))
  }

  return Array.from(counts.entries()).map(([label, value]) => ({ label, quantity: value }))
}
