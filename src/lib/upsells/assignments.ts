import type { UpsellType } from '@/types/Upsell'

/**
 * Every option belongs to a participant (a ticket), never to the order as a
 * whole. A selection is a list of "this participant takes N of it", with a size
 * for t-shirts. Client state keys participants by id; the API receives their
 * position in the order, which is also the position of their registration.
 */
export type UpsellAssignment = { participantId: string; quantity: number; size?: string }
export type RequestAssignment = { participantIndex: number; quantity: number; size?: string }

/** How many of one option a single participant may take. */
export const upsellMaxPerParticipant = (type: UpsellType): number => {
  switch (type) {
    case 'tshirt':
    case 'photos':
      return 1
    case 'patch':
      return 2
    case 'other':
      return 10
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Reads client assignments, ignoring anything malformed (including pre-redesign drafts). */
export const readAssignments = (meta: Record<string, any> | undefined): UpsellAssignment[] => {
  const raw = meta?.assignments
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.participantId !== 'string') return []
    const quantity = Number(entry.quantity)
    if (!Number.isInteger(quantity) || quantity <= 0) return []
    return [{ participantId: entry.participantId, quantity, ...(typeof entry.size === 'string' && entry.size ? { size: entry.size } : {}) }]
  })
}

export const totalQuantity = (assignments: UpsellAssignment[]): number =>
  assignments.reduce((sum, entry) => sum + entry.quantity, 0)

/** Sets one participant's quantity (0 removes them), capped at `max`. */
export const setParticipantQuantity = (
  assignments: UpsellAssignment[],
  participantId: string,
  quantity: number,
  max: number,
  size?: string,
): UpsellAssignment[] => {
  const next = Math.min(Math.max(0, Math.floor(quantity)), max)
  const others = assignments.filter((entry) => entry.participantId !== participantId)
  if (next === 0) return others
  const previous = assignments.find((entry) => entry.participantId === participantId)
  const keptSize = size ?? previous?.size
  const updated: UpsellAssignment = { participantId, quantity: next, ...(keptSize ? { size: keptSize } : {}) }
  // Keep the order of first selection stable so summaries do not jump around.
  return previous ? assignments.map((entry) => (entry.participantId === participantId ? updated : entry)) : [...others, updated]
}

/** Drops participants who left the order and clamps what is left. */
export const pruneAssignments = (assignments: UpsellAssignment[], participantIds: string[], max: number): UpsellAssignment[] => {
  const present = new Set(participantIds)
  return assignments
    .filter((entry) => present.has(entry.participantId))
    .map((entry) => ({ ...entry, quantity: Math.min(entry.quantity, max) }))
}

/** Converts client assignments to what the API expects (position in the order). */
export const toRequestAssignments = (assignments: UpsellAssignment[], participantIds: string[]): RequestAssignment[] =>
  assignments.flatMap((entry) => {
    const participantIndex = participantIds.indexOf(entry.participantId)
    if (participantIndex < 0) return []
    return [{ participantIndex, quantity: entry.quantity, ...(entry.size ? { size: entry.size } : {}) }]
  })

type RequestUpsell = { upsellId: string; quantity: number; meta?: Record<string, unknown> }

/** Reads API assignments from an upsell's meta, or null when the client sent none (older clients). */
export const readRequestAssignments = (meta: Record<string, unknown> | undefined): RequestAssignment[] | null => {
  const raw = meta?.assignments
  if (!Array.isArray(raw)) return null
  const parsed: RequestAssignment[] = []
  for (const entry of raw) {
    if (!isRecord(entry)) return null
    const participantIndex = Number(entry.participantIndex)
    const quantity = Number(entry.quantity)
    if (!Number.isInteger(participantIndex) || !Number.isInteger(quantity)) return null
    parsed.push({ participantIndex, quantity, ...(typeof entry.size === 'string' && entry.size ? { size: entry.size } : {}) })
  }
  return parsed
}

/**
 * Checks that an option's assignments add up to its quantity, point at real
 * participants and respect the per-participant limit. Selections without
 * assignments are accepted (older clients attach them to the order).
 */
export const validateUpsellAssignments = (
  selections: RequestUpsell[],
  products: Map<string, { type: UpsellType }>,
  participantCount: number,
): string | null => {
  for (const selection of selections) {
    const assignments = readRequestAssignments(selection.meta)
    if (assignments === null) continue
    const product = products.get(selection.upsellId)
    if (!product) continue

    const max = upsellMaxPerParticipant(product.type)
    const seen = new Set<number>()
    let total = 0
    for (const entry of assignments) {
      if (entry.participantIndex < 0 || entry.participantIndex >= participantCount) {
        return 'Une option est associée à un participant inconnu.'
      }
      if (seen.has(entry.participantIndex)) return 'Une option est associée deux fois au même participant.'
      seen.add(entry.participantIndex)
      if (entry.quantity <= 0 || entry.quantity > max) {
        return `La quantité maximale par participant pour cette option est de ${max}.`
      }
      total += entry.quantity
    }
    if (total !== selection.quantity) return 'La répartition des options ne correspond pas à la quantité choisie.'
  }
  return null
}

/** What the API receives for the selected options: totals plus who takes what (by position). */
export const buildUpsellRequest = (
  selected: Record<string, { quantity: number; meta?: Record<string, any> }>,
  participantIds: string[],
) =>
  Object.entries(selected)
    .filter(([, config]) => config.quantity > 0)
    .map(([upsellId, config]) => ({
      upsellId,
      quantity: config.quantity,
      meta: { assignments: toRequestAssignments(readAssignments(config.meta), participantIds) },
    }))
