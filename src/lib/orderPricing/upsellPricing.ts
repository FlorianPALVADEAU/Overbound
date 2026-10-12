import type { PricingUpsell, UpsellLineInput } from './types'

/** Subtotal of each selected upsell, by upsell id. Unknown upsells and empty lines are ignored. */
export const subtotalsByUpsell = (lines: UpsellLineInput[], upsells: PricingUpsell[]): Record<string, number> => {
  const priceById = new Map(upsells.map((upsell) => [upsell.id, upsell.priceCents]))
  const subtotals: Record<string, number> = {}
  for (const line of lines) {
    const price = priceById.get(line.upsellId)
    if (price === undefined || line.quantity <= 0) continue
    subtotals[line.upsellId] = (subtotals[line.upsellId] ?? 0) + price * line.quantity
  }
  return subtotals
}

export const sumValues = (record: Record<string, number>) =>
  Object.values(record).reduce((sum, value) => sum + value, 0)
