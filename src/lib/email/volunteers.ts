import { supabaseAdmin } from '@/lib/supabase/server'
import { sendVolunteerRecruitmentEmail, sendVolunteerAssignmentEmail } from '@/lib/email'
import { getLastEmailLog, recordEmailLog } from '@/lib/email/emailLogs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound.com'

interface VolunteerRecipient {
  id: string
  email: string
  fullName?: string | null
}

interface VolunteerEventRecord {
  id: string
  title: string
  date: string
  location: string
  status: string
}

export async function sendVolunteerRecruitmentDigest(options: { lookaheadDays?: number } = {}) {
  if (!process.env.RESEND_API_KEY) {
    return 0
  }

  const admin = supabaseAdmin()
  const volunteers = await getVolunteerRecipients(admin)
  if (volunteers.length === 0) {
    return 0
  }

  const lookaheadDays = options.lookaheadDays ?? 30
  const now = new Date()
  const end = new Date(now.getTime() + lookaheadDays * 24 * 60 * 60 * 1000)

  const { data: events, error } = await admin
    .from('events')
    .select('id, title, date, location, status')
    .gte('date', now.toISOString())
    .lte('date', end.toISOString())
    .in('status', ['on_sale', 'sold_out'])
    .order('date', { ascending: true })

  if (error) {
    console.error('[volunteers] events fetch error', error)
    return 0
  }

  const upcomingEvents = (events ?? []) as VolunteerEventRecord[]
  if (upcomingEvents.length === 0) {
    return 0
  }

  const [headline, ...rest] = upcomingEvents
  const otherEvents = rest.slice(0, 3)

  await Promise.all(
    volunteers.map(async (volunteer) => {
      const alreadySent = await getLastEmailLog({
        userId: volunteer.id,
        emailType: 'volunteer_recruitment',
        contextFilters: { headline_event_id: headline.id },
      })

      if (alreadySent) {
        return
      }

      await sendVolunteerRecruitmentEmail({
        to: volunteer.email,
        fullName: volunteer.fullName ?? null,
        headlineEvent: {
          id: headline.id,
          title: headline.title,
          date: headline.date,
          location: headline.location,
          checkinWindow: getDefaultCheckinWindow(headline.date),
        },
        otherEvents: otherEvents.map((event) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
          checkinWindow: getDefaultCheckinWindow(event.date),
        })),
        callToActionUrl: `${SITE_URL}/volunteers`,
      })

      await recordEmailLog({
        userId: volunteer.id,
        email: volunteer.email,
        emailType: 'volunteer_recruitment',
        context: { headline_event_id: headline.id },
      })
    }),
  )

  return volunteers.length
}

export async function sendVolunteerAssignment(params: {
  volunteerId: string
  email: string
  fullName?: string | null
  eventId: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  shiftStart: string
  shiftEnd: string
  arrivalInstructions?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  checkinUrl?: string | null
}) {
  if (!process.env.RESEND_API_KEY) {
    return
  }

  const checkinUrl = params.checkinUrl ?? `${SITE_URL}/admin/checkin?event=${params.eventId}`

  await sendVolunteerAssignmentEmail({
    to: params.email,
    fullName: params.fullName ?? null,
    eventTitle: params.eventTitle,
    eventDate: params.eventDate,
    eventLocation: params.eventLocation,
    shiftStart: params.shiftStart,
    shiftEnd: params.shiftEnd,
    arrivalInstructions: params.arrivalInstructions ?? null,
    contactEmail: params.contactEmail ?? null,
    contactPhone: params.contactPhone ?? null,
    checkinUrl,
  })

  await recordEmailLog({
    userId: params.volunteerId,
    email: params.email,
    emailType: 'volunteer_assignment',
    context: {
      event_id: params.eventId,
      shift_start: params.shiftStart,
      shift_end: params.shiftEnd,
    },
  })
}

const getVolunteerRecipients = async (admin = supabaseAdmin()): Promise<VolunteerRecipient[]> => {
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['volunteer', 'admin'])

  if (error || !profiles || profiles.length === 0) {
    return []
  }

  const ids = profiles.map((profile) => profile.id)
  const authUsers = await loadAuthUsers(ids)

  return profiles
    .map((profile) => {
      const authUser = authUsers.get(profile.id)
      if (!authUser?.email) return null
      return {
        id: profile.id,
        email: authUser.email,
        fullName: (profile as Record<string, any>)?.full_name ?? authUser.user_metadata?.full_name ?? null,
      }
    })
    .filter(Boolean) as VolunteerRecipient[]
}

const loadAuthUsers = async (userIds: string[]) => {
  const admin = supabaseAdmin()
  const perPage = 1000
  const map = new Map<string, any>()

  for (let page = 1; ; page += 1) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage })
    const users = data.users ?? []

    for (const user of users) {
      if (userIds.includes(user.id)) {
        map.set(user.id, user)
      }
    }

    if (users.length < perPage || map.size >= userIds.length) {
      break
    }
  }

  return map
}

const getDefaultCheckinWindow = (date: string) => {
  try {
    const parsed = new Date(date)
    const start = new Date(parsed.getTime() - 60 * 60 * 1000)
    return `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} → ${parsed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return null
  }
}
