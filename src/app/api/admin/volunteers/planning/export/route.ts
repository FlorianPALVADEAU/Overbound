import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createPlanningServices } from '@/lib/volunteers/planning/infrastructure/createPlanningServices'
import { respondToPlanningError } from '../respond'

export const runtime = 'nodejs'

const querySchema = z.object({ eventId: z.string().uuid() })

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const parsed = querySchema.safeParse({ eventId: request.nextUrl.searchParams.get('eventId') })
  if (!parsed.success) return NextResponse.json({ error: 'Événement invalide.' }, { status: 400 })

  try {
    const file = await createPlanningServices().exportPlanning.execute(parsed.data.eventId)
    return new NextResponse(file.content as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return respondToPlanningError(error, 'export failed')
  }
}
