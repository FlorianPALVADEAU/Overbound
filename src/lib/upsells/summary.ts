import type { UpsellType } from '@/types/Upsell'
import { readAssignments, type UpsellAssignment } from './assignments'

const NAMES_SHOWN = 3

export interface UpsellSummaryItem {
  id: string
  label: string
  quantity: number
  amount: number
  currency: string
  details: string[]
}

interface SummarizedUpsell {
  id: string
  name: string
  type: UpsellType
  price_cents: number
  currency?: string | null
}

const listNames = (names: string[]) => {
  const hidden = names.length - NAMES_SHOWN
  return `${names.slice(0, NAMES_SHOWN).join(', ')}${hidden > 0 ? ` et ${hidden} autre${hidden > 1 ? 's' : ''}` : ''}`
}

const sizesOf = (assignments: UpsellAssignment[]) => {
  const counts = new Map<string, number>()
  assignments.forEach(({ size, quantity }) => {
    if (size) counts.set(size, (counts.get(size) ?? 0) + quantity)
  })
  return Array.from(counts, ([size, count]) => (count > 1 ? `${size} ×${count}` : size)).join(', ')
}

/**
 * One summary line per chosen option: who takes it and, for t-shirts, which
 * sizes. Shared by the checkout summary and the payment page.
 */
export const summarizeUpsells = (
  selections: Record<string, { quantity: number; meta?: Record<string, unknown> }>,
  upsells: readonly SummarizedUpsell[],
  participantName: (participantId: string) => string,
  defaultCurrency: string,
): UpsellSummaryItem[] =>
  Object.entries(selections).flatMap(([upsellId, selection]) => {
    const upsell = upsells.find((item) => item.id === upsellId)
    if (!upsell || selection.quantity <= 0) return []
    const assignments = readAssignments(selection.meta)
    const sizes = upsell.type === 'tshirt' ? sizesOf(assignments) : ''
    const details = [
      ...(assignments.length > 0 ? [`Pour : ${listNames(assignments.map((a) => participantName(a.participantId)))}`] : []),
      ...(sizes ? [`Tailles : ${sizes}`] : []),
    ]
    return [{
      id: upsell.id,
      label: upsell.name,
      quantity: selection.quantity,
      amount: upsell.price_cents * selection.quantity,
      currency: (upsell.currency || defaultCurrency).toLowerCase(),
      details,
    }]
  })
