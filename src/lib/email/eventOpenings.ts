import { supabaseAdmin } from '@/lib/supabase/server'
import { sendEventOpeningEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound.com'

interface EventSnapshot {
  id: string
  title?: string | null
  date?: string | null
  location?: string | null
  slug?: string | null
}

interface NotificationRow {
  id: string
  email: string
  full_name?: string | null
  user_id?: string | null
}

export async function notifyEventOpening(eventId: string) {
  if (!process.env.RESEND_API_KEY) {
    return
  }

  const admin = supabaseAdmin()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id, title, date, location, slug')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    console.error('[event opening] event not found', eventError)
    return
  }

  const { data: rows, error: rowsError } = await admin
    .from('event_opening_notifications')
    .select('id, email, full_name, user_id')
    .eq('event_id', eventId)
    .is('notified_at', null)

  if (rowsError) {
    console.error('[event opening] fetch error', rowsError)
    return
  }

  const recipients = (rows as NotificationRow[] | null) ?? []
  if (recipients.length === 0) {
    return
  }

  const eventUrl = `${SITE_URL}/events/${event.slug ?? event.id}`
  const formattedDate = formatDate(event)
  const eventLocation = event.location ?? 'Lieu à confirmer'

  await Promise.all(
    recipients.map(async (recipient) => {
      try {
        await sendEventOpeningEmail({
          to: recipient.email,
          fullName: recipient.full_name ?? null,
          eventTitle: event.title ?? 'Événement Overbound',
          eventDate: formattedDate,
          eventLocation,
          eventUrl,
        })

        await admin
          .from('event_opening_notifications')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', recipient.id)
      } catch (error) {
        console.error('[event opening] send error', error)
      }
    })
  )
}

const formatDate = (event: EventSnapshot) => {
  if (!event.date) {
    return 'Date à confirmer'
  }
  try {
    return new Date(event.date).toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    })
  } catch {
    return event.date
  }
}
