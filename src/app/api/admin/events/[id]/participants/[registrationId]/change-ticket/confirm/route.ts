import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { noMovementConfirmationSchema } from '@/lib/admin/noMovementConfirmation'

const paramsSchema = z.object({ id: z.string().uuid(), registrationId: z.string().uuid() })

/**
 * Deliberately disabled until a dedicated command/audit store is deployed.
 * Do not replace this with a generic registrations PATCH or the legacy request
 * logger: neither provides atomic audit + command_id idempotency.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Identifiants événement ou inscription invalides' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }
  if (!noMovementConfirmationSchema.safeParse(body).success) {
    return NextResponse.json({ error: 'Commande de confirmation invalide' }, { status: 400 })
  }

  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  return NextResponse.json({
    error: 'Confirmation indisponible : le contrat d’audit et d’idempotence n’est pas encore déployé.',
    code: 'NO_MOVEMENT_CONFIRMATION_CONTRACT_MISSING',
    eventId: parsedParams.data.id,
    registrationId: parsedParams.data.registrationId,
  }, { status: 501 })
}
