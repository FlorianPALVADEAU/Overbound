import type { PricingError, PromoRejection, PromoRejectionReason } from './types'

/** Visitor-facing wording of pricing problems, shared by the checkout and the payment API. */

const REJECTION_MESSAGES: Record<PromoRejectionReason, (code: string) => string> = {
  TOO_MANY_CODES: () => 'Deux codes promo maximum par commande.',
  DUPLICATE_CODE: (code) => `Le code ${code} est déjà appliqué.`,
  ONE_AMBASSADOR_CODE: () => 'Un seul code ambassadeur par commande.',
  ONE_TICKET_CODE: () => 'Un seul code promo billet par commande.',
  ONE_PRODUCT_CODE: () => 'Un seul code promo produit par commande.',
  OPEN_TICKET_CODE_WITHOUT_OPEN_TICKET: (code) => `Le code ${code} n'est valable que sur un billet OPEN.`,
}

export const promoRejectionMessage = ({ code, reason }: PromoRejection) => REJECTION_MESSAGES[reason](code)

export const pricingErrorMessage = (error: PricingError): string => {
  switch (error.kind) {
    case 'UNKNOWN_TICKET':
      return "Un billet sélectionné n'appartient pas à cet événement."
    case 'TICKET_PRICE_MISSING':
      return `Le billet « ${error.ticketName} » n'a pas encore de tarif.`
    case 'TIERS_SOLD_OUT':
      return 'Tous les paliers de prix sont complets pour cet événement.'
  }
}
