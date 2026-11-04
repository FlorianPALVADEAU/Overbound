import { NextResponse, type NextRequest } from 'next/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { sendVolunteerAssignment } from '@/lib/email/volunteers'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { volunteerAssignmentSchema } from '@/lib/admin/volunteerInput'

const handlePost = async (request: NextRequest) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email provider non configuré.' }, { status: 503 })
    }

    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const parsed = volunteerAssignmentSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Paramètres manquants pour l’affectation.' }, { status: 400 })
    }

    await sendVolunteerAssignment(parsed.data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[volunteer assignment] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Notification bénévole affectée',
})
