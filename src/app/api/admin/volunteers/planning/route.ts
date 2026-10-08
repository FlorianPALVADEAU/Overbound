import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createPlanningServices } from '@/lib/volunteers/planning/infrastructure/createPlanningServices'
import { respondToPlanningError } from './respond'

const querySchema = z.object({ eventId: z.string().uuid() })

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const parsed = querySchema.safeParse({ eventId: request.nextUrl.searchParams.get('eventId') })
  if (!parsed.success) return NextResponse.json({ error: 'Événement invalide.' }, { status: 400 })

  try {
    return NextResponse.json(await createPlanningServices().getPlanning.execute(parsed.data.eventId))
  } catch (error) {
    return respondToPlanningError(error, 'load failed')
  }
}
