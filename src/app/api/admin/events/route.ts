import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { dispatchNewEventAnnouncement, getMarketingOptInRecipients } from '@/lib/email/marketing'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

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

    // Récupérer tous les événements
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ events })

  } catch (error) {
    console.error('Erreur GET events:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

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
        location,
        capacity: parseInt(capacity) || 0,
        status: status || 'draft',
        external_provider: external_provider || null,
        external_event_id: external_event_id || null,
        external_url: external_url || null
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
