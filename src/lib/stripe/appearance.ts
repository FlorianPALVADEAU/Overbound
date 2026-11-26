import type { Appearance } from '@stripe/stripe-js'

/**
 * Look of the Stripe card form. It lives in a Stripe iframe that cannot read the site's CSS
 * variables, so the values are written out here: keep them in line with `globals.css`
 * (--background, --foreground, --primary, --destructive).
 */
export const STRIPE_APPEARANCE: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#26AA26',
    colorBackground: '#1c1c1c',
    colorText: '#ffffff',
    colorDanger: '#ff6b6b',
    fontFamily: 'system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '12px',
  },
}
