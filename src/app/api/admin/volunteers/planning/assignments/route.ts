import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { createPlanningServices } from '@/lib/volunteers/planning/infrastructure/createPlanningServices'
import { respondToPlanningError } from '../respond'

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('assign'),
    eventId: z.string().uuid(),
    assignmentId: z.string().uuid().optional(),
    applicationId: z.string().uuid().nullable(),
    displayName: z.string().max(120),
    shift: z.enum(['morning', 'afternoon']),
    zoneKey: z.string().max(64),
    role: z.enum(['resp', 'aide', 'member']),
  }),
  z.object({
    action: z.literal('remove'),
    eventId: z.string().uuid(),
    assignmentId: z.string().uuid(),
  }),
])

const handlePost = async (request: NextRequest) => {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Champs invalides.', details: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const services = createPlanningServices()
    if (parsed.data.action === 'remove') {
      await services.removeAssignment.execute(parsed.data.eventId, parsed.data.assignmentId)
    } else {
      const { action: _action, ...command } = parsed.data
      await services.assignManually.execute(command)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return respondToPlanningError(error, 'assignment write failed')
  }
}

export const POST = withRequestLogging(handlePost, { actionType: 'Affectation bénévole' })
