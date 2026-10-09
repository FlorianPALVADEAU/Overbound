import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { createPlanningServices } from '@/lib/volunteers/planning/infrastructure/createPlanningServices'
import { respondToPlanningError } from '../respond'

const bodySchema = z.object({ eventId: z.string().uuid() })

const handlePost = async (request: NextRequest) => {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Événement invalide.' }, { status: 400 })

  try {
    return NextResponse.json(await createPlanningServices().runAutoAssignment.execute(parsed.data.eventId))
  } catch (error) {
    return respondToPlanningError(error, 'auto assignment failed')
  }
}

export const POST = withRequestLogging(handlePost, { actionType: 'Répartition automatique bénévoles' })
