import { NextRequest } from 'next/server'
import { respondJson } from '@/app/api/stripe/create-payment-intent/utils'
import { createCheckoutSession } from '@/app/api/stripe/checkout/service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const response = await createCheckoutSession(payload)
    return respondJson(response, 200)
  } catch (error) {
    console.error('[checkout] unexpected error', error)
    return respondJson({ error: 'Erreur serveur' }, 500)
  }
}
