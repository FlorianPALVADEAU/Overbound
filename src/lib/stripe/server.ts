import Stripe from 'stripe'

let client: Stripe | undefined

/** Shared server-side Stripe client (same API version as the registration webhook). */
export const getStripe = () => {
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' })
  return client
}
