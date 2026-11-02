import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import { registrationBelongsToOrganization } from '@/lib/auth/organizationScope'
import { AdminCancelError, cancelRegistrationAsAdmin } from '@/lib/admin/cancelRegistration'
import type { RefundCreator } from '@/lib/tickets/flexibleRefund'

export const runtime = 'nodejs'

const bodySchema = z.object({
  reason: z.string().trim().min(3, 'Indique le motif de l’annulation.').max(200),
  refund: z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('none') }),
    z.object({ mode: z.literal('ticket') }),
    z.object({ mode: z.literal('custom'), amountCents: z.number().int().positive() }),
  ]),
})

/** Cancels a registration (soft cancel) and optionally refunds it on Stripe. Replaces the old hard delete. */
const handlePost = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) return auth.response

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide.' }, { status: 400 })
    }

    const { id } = await params
    const admin = supabaseAdmin()
    if (!(await registrationBelongsToOrganization(admin, auth.organizationId, id))) {
      return NextResponse.json({ error: 'Inscription inaccessible' }, { status: 404 })
    }

    const result = await cancelRegistrationAsAdmin({
      admin,
      stripe: getStripe() as unknown as RefundCreator,
      adminUserId: auth.user.id,
      registrationId: id,
      reason: parsed.data.reason,
      refund: parsed.data.refund,
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AdminCancelError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin cancel registration] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, { actionType: 'Annulation inscription admin' })
