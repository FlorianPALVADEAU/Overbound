import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { dispatchNewEventAnnouncement, getMarketingOptInRecipients } from '@/lib/email/marketing'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'

export async function GET(request: Request) {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }

    const admin = supabaseAdmin()

    // Récupérer tous les événements
    const { data: events, error } = await admin
      .from('events')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const eventsWithStats = await Promise.all(
      (events ?? []).map(async (event) => {
        const [{ count: registrationsCount, error: registrationsError }, { count: volunteersCount, error: volunteersError }] =
          await Promise.all([
            admin
              .from('registrations')
              .select('id', { head: true, count: 'exact' })
              .eq('event_id', event.id),
            admin
              .from('volunteer_applications')
              .select('id', { head: true, count: 'exact' })
              .eq('event_id', event.id),
          ])

        if (registrationsError) {
          console.error('[admin events] registrations count error', registrationsError)
        }

        if (volunteersError) {
          console.error('[admin events] volunteers count error', volunteersError)
        }

        return {
          ...event,
          registrations_count: registrationsCount ?? 0,
          volunteer_applications_count: volunteersCount ?? 0,
        }
      }),
    )

    return NextResponse.json({ events: eventsWithStats })

  } catch (error) {
    console.error('Erreur GET events:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const {
      slug,
      title,
      subtitle,
      date,
      sales_start,
      location,
      capacity,
      status,
      external_provider,
      external_event_id,
      external_url
    } = body

    // Validation
    if (!slug || !title || !date || !location) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Utiliser supabaseAdmin pour insérer
    const admin = supabaseAdmin()
    const { data: event, error } = await admin
      .from('events')
      .insert({
        slug,
        title,
        subtitle: subtitle || null,
        date: new Date(date).toISOString(),
        sales_start: sales_start ? new Date(sales_start).toISOString() : null,
        location,
        capacity: parseInt(capacity) || 0,
        status: status || 'draft',
        external_provider: external_provider || null,
        external_event_id: external_event_id || null,
        external_url: external_url || null,
        organization_id: auth.organizationId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Un événement avec ce slug existe déjà' },
          { status: 409 }
        )
      }
      throw error
    }

    await maybeSendNewEventAnnouncement(event)

    return NextResponse.json({ event })

  } catch (error) {
    console.error('Erreur POST event:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création événement admin',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound.com'

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
