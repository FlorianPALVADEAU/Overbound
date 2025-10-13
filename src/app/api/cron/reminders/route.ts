import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { sendEventPrepEmail, sendPostEventThankYouEmail } from '@/lib/email'
import { getLastEmailLog, recordEmailLog } from '@/lib/email/emailLogs'

export const runtime = 'nodejs'

const PREP_WEEKS = [4, 3, 2] as const
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'
const TRAINING_BASE_URL = `${BASE_URL}/trainings`
const FEEDBACK_BASE_URL = `${BASE_URL}/feedback`
const EVENTS_URL = `${BASE_URL}/events`

interface RegistrationWithEvent {
  id: string
  user_id: string
  email: string | null
  participant_name: string | null
  checked_in: boolean
  event: {
    id: string
    title: string
    date: string
    location: string
  } | null
}

export async function GET() {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, reason: 'resend_disabled' })
  }

  const admin = supabaseAdmin()

  let prepSent = 0
  for (const weeks of PREP_WEEKS) {
    prepSent += await sendEventPrepBatch(admin, weeks)
  }

  const thankYouSent = await sendPostEventThankYouBatch(admin)

  return NextResponse.json({ ok: true, prepSent, thankYouSent })
}

async function sendEventPrepBatch(admin: ReturnType<typeof supabaseAdmin>, weeksRemaining: number) {
  const today = new Date()
  const target = new Date(today)
  target.setDate(target.getDate() + weeksRemaining * 7)

  const { start, end } = getDayRange(target)

  const { data, error } = await admin
    .from('registrations')
    .select(
      `
        id,
        user_id,
        email,
        participant_name,
        checked_in,
        event:events!inner(
          id,
          title,
          date,
          location
        )
      `,
    )
    .not('email', 'is', null)
    .gte('events.date', start.toISOString())
    .lte('events.date', end.toISOString())

  if (error) {
    console.error('[cron] event prep query error', error)
    return 0
  }

  const registrations: RegistrationWithEvent[] =
    (data ?? []).map((row: any) => ({
      ...row,
      event: Array.isArray(row.event) ? row.event[0] ?? null : row.event ?? null,
    }))

  let sent = 0
  for (const row of registrations) {
    if (!row.email || !row.event) {
      continue
    }

    const alreadySent = await getLastEmailLog({
      userId: row.user_id,
      emailType: 'event_prep',
      contextFilters: { event_id: row.event.id, weeks_remaining: weeksRemaining },
    })

    if (alreadySent) {
      continue
    }

    const checklist = getPrepChecklist(weeksRemaining)

    try {
      await sendEventPrepEmail({
        to: row.email,
        participantName: row.participant_name || 'Athlète',
        eventTitle: row.event.title,
        eventDate: new Date(row.event.date).toLocaleDateString('fr-FR', {
          dateStyle: 'full',
        }),
        eventLocation: row.event.location,
        weeksRemaining,
        checklist,
        trainingUrl: TRAINING_BASE_URL,
      })

      await recordEmailLog({
        userId: row.user_id,
        email: row.email,
        emailType: 'event_prep',
        context: {
          event_id: row.event.id,
          weeks_remaining: weeksRemaining,
        },
      })
      sent += 1
    } catch (emailError) {
      console.error('[cron] event prep email error', emailError)
    }
  }

  return sent
}

async function sendPostEventThankYouBatch(admin: ReturnType<typeof supabaseAdmin>) {
  const today = new Date()
  const target = new Date(today)
  target.setDate(target.getDate() - 1)
  const { start, end } = getDayRange(target)

  const { data, error } = await admin
    .from('registrations')
    .select(
      `
        id,
        user_id,
        email,
        participant_name,
        checked_in,
        event:events!inner(
          id,
          title,
          date,
          location
        )
      `,
    )
    .eq('checked_in', true)
    .not('email', 'is', null)
    .gte('events.date', start.toISOString())
    .lte('events.date', end.toISOString())

  if (error) {
    console.error('[cron] thank you query error', error)
    return 0
  }

  const registrations: RegistrationWithEvent[] =
    (data ?? []).map((row: any) => ({
      ...row,
      event: Array.isArray(row.event) ? row.event[0] ?? null : row.event ?? null,
    }))

  let sent = 0
  for (const row of registrations) {
    if (!row.email || !row.event) continue

    const alreadySent = await getLastEmailLog({
      userId: row.user_id,
      emailType: 'post_event_thankyou',
      contextFilters: { event_id: row.event.id },
    })

    if (alreadySent) {
      continue
    }

    const feedbackUrl = `${FEEDBACK_BASE_URL}?event=${row.event.id}`

    try {
      await sendPostEventThankYouEmail({
        to: row.email,
        participantName: row.participant_name || 'Athlète',
        eventTitle: row.event.title,
        feedbackUrl,
        nextEventUrl: EVENTS_URL,
        photosUrl: null,
      })

      await recordEmailLog({
        userId: row.user_id,
        email: row.email,
        emailType: 'post_event_thankyou',
        context: {
          event_id: row.event.id,
        },
      })
      sent += 1
    } catch (emailError) {
      console.error('[cron] thank you email error', emailError)
    }
  }

  return sent
}

function getDayRange(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

function getPrepChecklist(weeksRemaining: number) {
  switch (weeksRemaining) {
    case 4:
      return [
        'Valide ton plan d’entraînement et ton calendrier personnel.',
        'Fais un check-up matériel (chaussures, tenue, sac).',
        'Planifie tes entraînements clés et sorties longues.',
      ]
    case 3:
      return [
        'Travaille les obstacles techniques et l’endurance musculaire.',
        'Teste ton ravitaillement et ton hydratation.',
        'Repère ton trajet vers le site de la course.',
      ]
    case 2:
      return [
        'Diminue légèrement la charge d’entraînement pour arriver frais.',
        'Prépare ta checklist logistique (transport, hébergement).',
        'Vérifie la validité de tes documents obligatoires.',
      ]
    default:
      return [
        'Prépare ton équipement et vérifie ton billet OverBound.',
        'Consulte les informations de course dans ton espace perso.',
      ]
  }
}
