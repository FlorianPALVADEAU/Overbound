import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { dispatchNewEventAnnouncement, getMarketingOptInRecipients } from '@/lib/email/marketing'
import { notifyEventUpdate } from '@/lib/email/eventUpdates'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound.com'

const handlePut = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { data: existingEvent } = await supabase
      .from('events')
      .select('id, status, title, date, location, subtitle, slug')
      .eq('id', id)
      .single()

    const body = await request.json()
    const {
      slug,
      title,
      subtitle,
      date,
      location,
      capacity,
      status,
      external_provider,
      external_event_id,
      external_url
    } = body

    // Utiliser supabaseAdmin pour modifier
    const admin = supabaseAdmin()
    const { data: event, error } = await admin
      .from('events')
      .update({
        slug,
        title,
        subtitle: subtitle || null,
        date: new Date(date).toISOString(),
        location,
        capacity: parseInt(capacity) || 0,
        status: status || 'draft',
        external_provider: external_provider || null,
        external_event_id: external_event_id || null,
        external_url: external_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    await maybeSendNewEventAnnouncement(event, existingEvent?.status ?? null)
    await notifyEventUpdate({
      previous: existingEvent
        ? {
            id,
            title: existingEvent.title,
            date: existingEvent.date,
            location: existingEvent.location,
            slug: existingEvent.slug,
          }
        : null,
      current: {
        id,
        title: event.title,
        date: event.date,
        location: event.location,
        slug: event.slug,
      },
      statusMessage:
        existingEvent?.status !== event.status && event.status === 'cancelled'
          ? 'L’événement est annulé. Nous reviendrons vers toi prochainement concernant les modalités.'
          : undefined,
    })

    return NextResponse.json({ event })

  } catch (error) {
    console.error('Erreur PUT event:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handleDelete = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Vérifier s'il y a des inscriptions
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un événement avec des inscriptions' },
        { status: 409 }
      )
    }

    // Utiliser supabaseAdmin pour supprimer
    const admin = supabaseAdmin()
    const { error } = await admin
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur DELETE event:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PUT = withRequestLogging(handlePut, {
  actionType: 'Mise à jour événement admin',
})

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression événement admin',
})

const maybeSendNewEventAnnouncement = async (
  event: Record<string, any>,
  previousStatus?: string | null,
) => {
  if (!event || event.status !== 'on_sale') {
    return
  }

  if (previousStatus === 'on_sale') {
    return
  }

  try {
    const recipients = await getMarketingOptInRecipients()
    if (recipients.length === 0) {
      return
    }

    await dispatchNewEventAnnouncement({
      recipients,
      eventTitle: event.title ?? 'Nouvel événement OverBound',
      eventDate: event.date
        ? new Date(event.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })
        : '',
      eventLocation: event.location ?? '',
      eventUrl: `${SITE_URL}/events/${event.slug ?? event.id ?? ''}`,
      highlight: event.subtitle ?? null,
    })
  } catch (error) {
    console.error('[marketing] new event announcement error', error)
  }
}
