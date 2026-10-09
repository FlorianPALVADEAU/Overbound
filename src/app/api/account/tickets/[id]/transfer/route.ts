import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'
import { getStripe } from '@/lib/stripe/server'
import { TicketTransferError, startTransferCheckout } from '@/lib/tickets/ticketTransfers'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

export const runtime = 'nodejs'

const transferConsentSchema = z.object({
  acceptTerms: z.literal(true),
  waiveWithdrawal: z.literal(true),
})

/** Starts the Stripe Checkout that unlocks the hand-over of one bib. */
const handlePost = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const user = await resolveRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const consent = transferConsentSchema.safeParse(await request.json().catch(() => null))
    if (!consent.success) {
      return NextResponse.json(
        { error: 'Accepte les conditions du transfert et la renonciation au droit de rétractation.' },
        { status: 400 },
      )
    }

    const { id } = await params
    const result = await startTransferCheckout({
      admin: supabaseAdmin(),
      stripe: getStripe(),
      userId: user.id,
      userEmail: user.email,
      registrationId: id,
      origin: request.nextUrl.origin,
      consentedAt: new Date(),
    })

    return NextResponse.json(result.alreadyUnlocked ? { alreadyUnlocked: true } : { url: result.url })
  } catch (error) {
    if (error instanceof TicketTransferError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[ticket transfer] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, { actionType: 'Paiement transfert billet' })
