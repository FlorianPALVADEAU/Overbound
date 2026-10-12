import { pricingErrorMessage, promoRejectionMessage } from '../messages'
import type { PricingError, PromoRejection } from '../types'

/** A refusal the API sends back as is: HTTP status and a message for the visitor. */
export interface HttpFailure {
  status: number
  message: string
}

const PRICING_ERROR_STATUS: Record<PricingError['kind'], number> = {
  UNKNOWN_TICKET: 422,
  TICKET_PRICE_MISSING: 422,
  TIERS_SOLD_OUT: 409,
}

export const pricingErrorFailure = (error: PricingError): HttpFailure => ({
  status: PRICING_ERROR_STATUS[error.kind],
  message: pricingErrorMessage(error),
})

/** The payment API never charges an order with a refused code: the first refusal is reported. */
export const promoRejectionFailure = (rejection: PromoRejection): HttpFailure => ({
  status: 409,
  message: promoRejectionMessage(rejection),
})
