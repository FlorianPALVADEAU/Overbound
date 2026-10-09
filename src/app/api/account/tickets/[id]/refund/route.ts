import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'
import { getStripe } from '@/lib/stripe/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { formatLongDate } from '@/lib/account/format'
import { sendFlexibleRefundEmail } from '@/lib/email'
import { FlexibleRefundError, refundFlexibleTicket, type RefundCreator } from '@/lib/tickets/flexibleRefund'

export const runtime = 'nodejs'

const confirmSchema = z.object({ confirm: z.literal(true) })

const PARIS_DATE_TIME = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' })

/** Cancels a "billet flexible" bib for its buyer and refunds its ticket price. */
const handlePost = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const user = await resolveRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }
    if (!confirmSchema.safeParse(await request.json().catch(() => null)).success) {
      return NextResponse.json({ error: 'Confirme l’annulation du billet.' }, { status: 400 })
    }

    const { id } = await params
    const now = new Date()
    const result = await refundFlexibleTicket({
      admin: supabaseAdmin(),
      stripe: getStripe() as unknown as RefundCreator,
      userId: user.id,
      registrationId: id,
      now,
    })

    if (user.email) {
      await sendFlexibleRefundEmail({
        to: user.email,
        eventTitle: result.eventTitle ?? 'Overbound',
        eventDate: formatLongDate(result.eventDate) ?? '',
        amountLabel: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: result.currency.toUpperCase() }).format(
          result.amountCents / 100,
        ),
        cancelledAt: PARIS_DATE_TIME.format(now),
      }).catch((emailError) => console.error('[flexible refund] confirmation email failed', emailError))
    }

    return NextResponse.json({ refundedCents: result.amountCents, currency: result.currency })
  } catch (error) {
    if (error instanceof FlexibleRefundError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[flexible refund] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, { actionType: 'Annulation billet flexible' })
