import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import { supabaseAdmin } from '@/lib/supabase/server'
import { noMovementConfirmationSchema } from '@/lib/admin/noMovementConfirmation'

const paramsSchema = z.object({ id: z.string().uuid(), registrationId: z.string().uuid() })

/**
 * Server-only NO_MOVEMENT command. The database function performs the mutation
 * and audit insert in one transaction and is executable only by service_role.
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
  const parsedBody = noMovementConfirmationSchema.extend({
    targetTicketId: z.string().uuid(),
    expectedTicketId: z.string().uuid(),
    expectedWaveIndex: z.number().int().nullable(),
    expectedStartTime: z.string().datetime({ offset: true }).nullable(),
  }).safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Commande de confirmation invalide' }, { status: 400 })
  }

  const auth = await requireAdminOrganization(request)
  if (!auth.ok) return auth.response

  if (parsedBody.data.policyVariant !== 'NO_MOVEMENT') {
    return NextResponse.json({ error: 'Cette variante financière n’est pas disponible en V1.' }, { status: 422 })
  }

  const admin = supabaseAdmin()
  const { data, error } = await admin.rpc('admin_confirm_ticket_change', {
    p_organization_id: auth.organizationId,
    p_event_id: parsedParams.data.id,
    p_registration_id: parsedParams.data.registrationId,
    p_target_ticket_id: parsedBody.data.targetTicketId,
    p_command_id: parsedBody.data.commandId,
    p_preview_id: parsedBody.data.previewId,
    p_reason: parsedBody.data.reason,
    p_actor_id: auth.user.id,
    p_expected_ticket_id: parsedBody.data.expectedTicketId,
    p_expected_wave_index: parsedBody.data.expectedWaveIndex,
    p_expected_start_time: parsedBody.data.expectedStartTime,
    p_request_hash: `${parsedBody.data.targetTicketId}:${parsedBody.data.expectedTicketId}:${parsedBody.data.expectedWaveIndex ?? ''}:${parsedBody.data.expectedStartTime ?? ''}:${parsedBody.data.policyVariant}:${parsedBody.data.reason}`,
  })

  if (error) {
    console.error('[admin ticket confirm] command failed', error)
    const status = error.code === '40001' || error.code === '23505' ? 409 : error.code === '22023' || error.code === 'P0002' ? 422 : 500
    return NextResponse.json({ error: error.message, code: error.code }, { status })
  }
  return NextResponse.json({ result: data }, { status: 200 })
}
