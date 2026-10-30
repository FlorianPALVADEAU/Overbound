import { applyTierDiscount, groupDiscountPercent, GROUP_DISCOUNT_TIERS } from '@/lib/orderPricing'

/** The dropdown lists 1 to 10; beyond that the visitor types a number. */
export const QUANTITY_DROPDOWN_MAX = 10
export const QUANTITY_INPUT_MAX = 100

export interface QuantityOption {
  quantity: number
  /** Price of one bib at this quantity, group discount included. */
  unitCents: number
  percent: number
  totalCents: number
}

interface QuantityOptionsInput {
  /** Price of one bib today, tier already applied. */
  unitCents: number
  /** Bibs of the other tickets in the same order, any format: they count toward the group discount. */
  otherTicketCount: number
}

export const quantityOption = ({ unitCents, otherTicketCount }: QuantityOptionsInput, quantity: number): QuantityOption => {
  const percent = groupDiscountPercent(otherTicketCount + quantity)
  const discounted = applyTierDiscount(unitCents, percent)
  return { quantity, unitCents: discounted, percent, totalCents: discounted * quantity }
}

export const buildQuantityOptions = (input: QuantityOptionsInput): QuantityOption[] =>
  Array.from({ length: QUANTITY_DROPDOWN_MAX }, (_, index) => quantityOption(input, index + 1))

export interface GroupTierHint {
  label: string
  percent: number
  /** First bib count of the order at which this tier applies. */
  minTickets: number
}

/** "2 : −10 %", "3 à 5 : −15 %", "6 et + : −20 %", lowest threshold first. */
export const groupTierHints = (): GroupTierHint[] => {
  const ascending = [...GROUP_DISCOUNT_TIERS].reverse()
  return ascending.map((groupTier, index) => {
    const next = ascending[index + 1]
    const range = !next
      ? `${groupTier.minTickets} et +`
      : next.minTickets - groupTier.minTickets === 1
        ? `${groupTier.minTickets}`
        : `${groupTier.minTickets} à ${next.minTickets - 1}`
    return { label: range, percent: groupTier.percent, minTickets: groupTier.minTickets }
  })
}
