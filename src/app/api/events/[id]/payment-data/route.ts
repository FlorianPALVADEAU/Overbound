import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getEffectiveEventStatus, isEventOpenForRegistration } from '@/lib/events/registrationStatus'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Détecte si c'est un UUID ou un slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(
        `*,
        tickets (
          id,
          name,
          description,
          final_price_cents,
          currency,
          max_participants,
          requires_document,
          document_types,
          race:races!tickets_race_id_fkey (
            id,
            name,
            distance_km
          )
        ),
        price_tiers:event_price_tiers(*)
      `,
      )
      .eq(isUUID ? 'id' : 'slug', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    }

    const eventWithEffectiveStatus = {
      ...event,
      status: getEffectiveEventStatus(event),
    }

    if (!isEventOpenForRegistration(eventWithEffectiveStatus)) {
      return NextResponse.json({ error: "Les inscriptions ne sont pas encore ouvertes pour cet événement." }, { status: 409 })
    }

    const { data: upsellsData, error: upsellError } = await supabase
      .from('upsells')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_active', true)

    if (upsellError) {
      console.error('[payment-data] upsell error', upsellError)
    }

    return NextResponse.json({
      event: eventWithEffectiveStatus,
      tickets: (event.tickets || []).map((ticket: any) => ({
        ...ticket,
        requires_document: false,
        document_types: [],
      })),
      upsells: upsellsData || [],
      userEmail: user.email ?? '',
    })
  } catch (error) {
    console.error('[payment-data] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
