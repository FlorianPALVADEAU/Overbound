import { NextRequest } from 'next/server'
import { respondJson } from '@/app/api/stripe/create-payment-intent/utils'
import { createCheckoutSession } from '@/app/api/stripe/checkout/service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const clientIpAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null
    const clientUserAgent = request.headers.get('user-agent')
    const fbp = request.cookies.get('_fbp')?.value ?? null
    const fbc = request.cookies.get('_fbc')?.value ?? null
    const eventSourceUrl = request.headers.get('referer') ?? request.headers.get('origin') ?? null

    const response = await createCheckoutSession(payload, {
      clientIpAddress,
      clientUserAgent,
      fbp,
      fbc,
      eventSourceUrl,
    })
    return respondJson(response, 200)
  } catch (error) {
    console.error('[checkout] unexpected error', error)
    return respondJson({ error: 'Erreur serveur' }, 500)
  }
}
