import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'
import { getStripe } from '@/lib/stripe/server'
import { TicketTransferError, confirmTransferCheckout } from '@/lib/tickets/ticketTransfers'

export const runtime = 'nodejs'

const bodySchema = z.object({ session_id: z.string().trim().min(1).max(200) })

/** Called when Stripe sends the payer back: unlocks the transfer immediately. */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveRequestUser(request)
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Paiement introuvable.' }, { status: 400 })

    const outcome = await confirmTransferCheckout({
      admin: supabaseAdmin(),
      stripe: getStripe(),
      userId: user.id,
      sessionId: parsed.data.session_id,
    })

    if (outcome === 'ignored') {
      // Session exists but is not a valid paid transfer (unpaid, wrong amount…): nothing was unlocked.
      return NextResponse.json({ error: 'Le paiement n’est pas confirmé.' }, { status: 402 })
    }
    return NextResponse.json({ unlocked: true })
  } catch (error) {
    if (error instanceof TicketTransferError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[ticket transfer] confirm error', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
