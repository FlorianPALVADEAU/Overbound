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
  isOpenFormat: boolean
  /** OPEN bibs of the other tickets in the same order: they count toward the group discount. */
  otherOpenCount: number
}

export const quantityOption = ({ unitCents, isOpenFormat, otherOpenCount }: QuantityOptionsInput, quantity: number): QuantityOption => {
  const percent = isOpenFormat ? groupDiscountPercent(otherOpenCount + quantity) : 0
  const discounted = applyTierDiscount(unitCents, percent)
  return { quantity, unitCents: discounted, percent, totalCents: discounted * quantity }
}

export const buildQuantityOptions = (input: QuantityOptionsInput): QuantityOption[] =>
  Array.from({ length: QUANTITY_DROPDOWN_MAX }, (_, index) => quantityOption(input, index + 1))

export interface GroupTierHint {
  label: string
  percent: number
  /** First OPEN bib count of the order at which this tier applies. */
  minOpenTickets: number
}

/** "2 : −10 %", "3 à 5 : −15 %", "6 et + : −20 %", lowest threshold first. */
export const groupTierHints = (): GroupTierHint[] => {
  const ascending = [...GROUP_DISCOUNT_TIERS].reverse()
  return ascending.map((groupTier, index) => {
    const next = ascending[index + 1]
    const range = !next
      ? `${groupTier.minOpenTickets} et +`
      : next.minOpenTickets - groupTier.minOpenTickets === 1
        ? `${groupTier.minOpenTickets}`
        : `${groupTier.minOpenTickets} à ${next.minOpenTickets - 1}`
    return { label: range, percent: groupTier.percent, minOpenTickets: groupTier.minOpenTickets }
  })
}
