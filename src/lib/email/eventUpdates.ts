import { supabaseAdmin } from '@/lib/supabase/server'
import { getLastEmailLog, recordEmailLog } from '@/lib/email/emailLogs'
import { sendEventUpdateEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound.com'

interface EventSnapshot {
  id: string
  title?: string | null
  date?: string | null
  location?: string | null
  slug?: string | null
}

interface EventChangePayload {
  previous: EventSnapshot | null
  current: EventSnapshot
  statusMessage?: string | null
}

export async function notifyEventUpdate(payload: EventChangePayload) {
  const { current, previous } = payload

  if (!changeRequiresNotification(current, previous)) {
    return
  }

  const admin = supabaseAdmin()

  const { data: registrations, error } = await admin
    .from('registrations')
    .select('id, user_id, email')
    .eq('event_id', current.id)

  if (error) {
    console.error('[event update] registrations fetch error', error)
    return
  }

  const registrationsList = registrations ?? []
  if (registrationsList.length === 0) {
    return
  }

  const manageUrlBase = `${SITE_URL}/account/tickets`
  const profileNames = await getProfileNames(registrationsList, admin)

  await Promise.all(
    registrationsList.map(async (registration) => {
      const email = registration.email
      if (!email) return

      const alreadySent = await getLastEmailLog({
        userId: registration.user_id ?? registration.id,
        emailType: 'event_updated',
        contextFilters: { event_id: current.id, registration_id: registration.id },
      })

      if (alreadySent) {
        return
      }

      const participantName =
        (registration as any).participant_name ??
        (registration.user_id ? profileNames.get(registration.user_id) ?? null : null) ??
        null

      await sendEventUpdateEmail({
        to: email,
        participantName,
        eventTitle: current.title ?? 'Événement OverBound',
        previousDate: formatDate(previous?.date),
        newDate: formatDate(current?.date),
        previousLocation: previous?.location ?? null,
        newLocation: current?.location ?? null,
        statusMessage: payload.statusMessage ?? null,
        manageUrl: manageUrlBase,
      })

      await recordEmailLog({
        userId: registration.user_id ?? registration.id,
        email,
        emailType: 'event_updated',
        context: {
          event_id: current.id,
          registration_id: registration.id,
        },
      })
    }),
  )
}

const changeRequiresNotification = (current: EventSnapshot, previous: EventSnapshot | null) => {
  if (!previous) return true

  const dateChanged = current.date && previous.date && formatDate(current.date) !== formatDate(previous.date)
  const locationChanged = current.location && previous.location && current.location !== previous.location

  return Boolean(dateChanged || locationChanged)
}

const formatDate = (value?: string | null) => {
  if (!value) return null
  try {
    return new Date(value).toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

async function getProfileNames(
  registrations: Array<{ user_id: string | null }>,
  admin: ReturnType<typeof supabaseAdmin>,
) {
  const userIds = Array.from(
    new Set(
      registrations
        .map((registration) => registration.user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  )

  if (userIds.length === 0) {
    return new Map<string, string | null>()
  }

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  if (error) {
    console.error('[event update] profile lookup error', error)
    return new Map<string, string | null>()
  }

  return new Map(
    (data ?? []).map((profile: any) => [profile.id as string, (profile.full_name as string | null) ?? null]),
  )
}
