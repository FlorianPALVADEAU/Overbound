import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import { registrationBelongsToOrganization } from '@/lib/auth/organizationScope'

const updateRegistrationSchema = z.union([
  z.object({ ticket_id: z.string().uuid() }),
  z.object({ wave_index: z.number().int().min(1).max(24) }),
])

const handlePatch = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const parsed = updateRegistrationSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Billet cible invalide' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    if (!(await registrationBelongsToOrganization(admin, auth.organizationId, id))) {
      return NextResponse.json({ error: 'Inscription inaccessible' }, { status: 404 })
    }
    const result = 'ticket_id' in parsed.data
      ? await admin.rpc('admin_change_registration_ticket', {
          p_registration_id: id,
          p_ticket_id: parsed.data.ticket_id,
        })
      : await admin.rpc('admin_move_open_registration_wave', {
          p_registration_id: id,
          p_wave_index: parsed.data.wave_index,
        })
    const { data, error } = result

    if (error) {
      const status = error.code === 'P0002' ? 404 : error.code === '22023' ? 400 : 500
      console.error('[admin registration] ticket change error', error)
      return NextResponse.json({ error: error.message }, { status })
    }

    return NextResponse.json({ registration: Array.isArray(data) ? data[0] : data })
  } catch (error) {
    console.error('Erreur PATCH registration:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * A registration is never hard-deleted: orders, signatures, upsells, wave counters and ambassador points
 * all reference it. Cancel it instead (POST /api/admin/registrations/[id]/cancel).
 */
const handleDelete = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await requireAdminOrganization(request)
  if (!auth.ok) return auth.response
  return NextResponse.json(
    { error: 'Une inscription ne se supprime pas : annule-la (avec remboursement si besoin).', code: 'USE_CANCEL' },
    { status: 410 },
  )
}

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression inscription admin',
})

export const PATCH = withRequestLogging(handlePatch, {
  actionType: 'Modification billet / SAS admin',
})
