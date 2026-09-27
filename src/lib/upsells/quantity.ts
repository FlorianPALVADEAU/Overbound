import type { UpsellType } from '@/types/Upsell'

export type UpsellQuantitySelection = {
  upsellId: string
  quantity: number
}

export type UpsellQuantityProduct = {
  id: string
  type: UpsellType
}

/**
 * Every upsell requires at least one ticket. Products tied to a participant
 * have their quantity capped by that ticket count.
 */
export function getUpsellQuantityLimit(type: UpsellType, ticketCount: number): number {
  const normalizedTicketCount = Math.max(0, Math.floor(ticketCount))
  if (normalizedTicketCount === 0) return 0

  switch (type) {
    case 'tshirt':
    case 'photos':
      return normalizedTicketCount
    case 'patch':
      return normalizedTicketCount * 2
    case 'other':
      return Number.MAX_SAFE_INTEGER
  }
}

export function validateUpsellQuantities(
  selections: UpsellQuantitySelection[],
  products: Map<string, UpsellQuantityProduct>,
  ticketCount: number,
): string | null {
  for (const selection of selections) {
    const product = products.get(selection.upsellId)
    if (!product) return 'Une option sélectionnée est indisponible.'

    if (!Number.isInteger(selection.quantity) || selection.quantity <= 0) {
      return 'La quantité d’une option doit être un entier positif.'
    }

    const limit = getUpsellQuantityLimit(product.type, ticketCount)
    if (limit === 0) return 'Ajoutez au moins un billet avant de choisir des options.'
    if (selection.quantity > limit) {
      return `La quantité maximale pour « ${product.type === 'patch' ? 'ce patch' : 'cette option'} » est de ${limit}.`
    }
  }

  return null
}
