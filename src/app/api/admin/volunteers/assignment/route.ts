import { NextResponse, type NextRequest } from 'next/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { sendVolunteerAssignment } from '@/lib/email/volunteers'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const handlePost = async (request: NextRequest) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email provider non configuré.' }, { status: 503 })
    }

    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const {
      volunteerId,
      email,
      fullName,
      eventId,
      eventTitle,
      eventDate,
      eventLocation,
      shiftStart,
      shiftEnd,
      arrivalInstructions,
      contactEmail,
      contactPhone,
      checkinUrl,
    } = body as Record<string, string | null>

    if (!volunteerId || !email || !eventId || !eventTitle || !eventDate || !eventLocation || !shiftStart || !shiftEnd) {
      return NextResponse.json({ error: 'Paramètres manquants pour l’affectation.' }, { status: 400 })
    }

    await sendVolunteerAssignment({
      volunteerId,
      email,
      fullName: fullName ?? null,
      eventId,
      eventTitle,
      eventDate,
      eventLocation,
      shiftStart,
      shiftEnd,
      arrivalInstructions: arrivalInstructions ?? null,
      contactEmail: contactEmail ?? null,
      contactPhone: contactPhone ?? null,
      checkinUrl: checkinUrl ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[volunteer assignment] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Notification bénévole affectée',
})
