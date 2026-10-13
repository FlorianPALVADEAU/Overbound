import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { loadPublicEventDetail } from '@/lib/events/loadEventDetail'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const detail = await loadPublicEventDetail(id)

    if (!detail) {
      return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    }

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let existingRegistration = null
    if (user) {
      const { data: registration } = await supabase
        .from('registrations')
        .select(
          `id, checked_in, tickets(name)`
        )
        .eq('user_id', user.id)
        .eq('event_id', detail.event.id)
        .is('cancelled_at', null)
        .maybeSingle()
      existingRegistration = registration ?? null
    }

    return NextResponse.json({
      ...detail,
      existingRegistration,
      user: user
        ? {
            id: user.id,
            email: user.email ?? '',
          }
        : null,
    })
  } catch (error) {
    console.error('[event detail] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
