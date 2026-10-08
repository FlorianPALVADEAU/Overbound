import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { createPlanningServices } from '@/lib/volunteers/planning/infrastructure/createPlanningServices'
import { respondToPlanningError } from '../respond'

const bodySchema = z.object({
  eventId: z.string().uuid(),
  shift: z.enum(['morning', 'afternoon']),
  zoneKey: z.string().max(64),
  capacity: z.number().nullable(),
  weight: z.number().nullable(),
})

const handlePut = async (request: NextRequest) => {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Champs invalides.', details: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const { eventId, ...setting } = parsed.data
    await createPlanningServices().configureZone.execute(eventId, setting)
    return NextResponse.json({ success: true })
  } catch (error) {
    return respondToPlanningError(error, 'setting write failed')
  }
}

export const PUT = withRequestLogging(handlePut, { actionType: 'Effectif cible zone bénévoles' })
