import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { notifyDocumentUploadReminder } from '@/lib/email/documents'

export const runtime = 'nodejs'

const REMINDER_DAYS = [90, 60, 30, 7]
const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, reason: 'resend_disabled' })
  }

  const admin = supabaseAdmin()

  const { data: registrations, error } = await admin
    .from('registrations')
    .select(
      `
        id,
        user_id,
        email,
        approval_status,
        document_url,
        ticket:tickets(
          requires_document,
          document_types
        ),
        event:events(
          id,
          title,
          date
        )
      `,
    )
    .eq('ticket.requires_document', true)

  if (error) {
    console.error('[document-reminders] registrations fetch error', error)
    return NextResponse.json({ ok: false, error: 'fetch_failed' }, { status: 500 })
  }

  const rows = (registrations ?? []).map((row: any) => ({
    ...row,
    ticket: Array.isArray(row.ticket) ? row.ticket[0] ?? null : row.ticket ?? null,
    event: Array.isArray(row.event) ? row.event[0] ?? null : row.event ?? null,
  }))

  const registrationIds = rows.map((row: any) => row.id).filter(Boolean)
  const userIds = rows.map((row: any) => row.user_id).filter(Boolean)

  const [documentsResult, profilesResult] = await Promise.all([
    registrationIds.length
      ? admin
          .from('registration_documents')
          .select('registration_id, document_type')
          .in('registration_id', registrationIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    userIds.length
      ? admin.from('profiles').select('id, full_name').in('id', userIds)
      : Promise.resolve({ data: [] as any[], error: null }),
  ])

  if (documentsResult.error) {
    console.error('[document-reminders] documents fetch error', documentsResult.error)
  }
  if (profilesResult.error) {
    console.error('[document-reminders] profiles fetch error', profilesResult.error)
  }

  const documentsByRegistration = new Map<string, Set<string>>()
  for (const row of documentsResult.data ?? []) {
    if (!documentsByRegistration.has(row.registration_id)) {
      documentsByRegistration.set(row.registration_id, new Set())
    }
    if (row.document_type) {
      documentsByRegistration.get(row.registration_id)!.add(row.document_type)
    }
  }

  const profileNameById = new Map<string, string | null>()
  for (const profile of profilesResult.data ?? []) {
    profileNameById.set(profile.id, profile.full_name ?? null)
  }

  const today = Date.now()
  let remindersSent = 0

  for (const registration of rows) {
    if (!registration?.event?.date || !registration?.ticket?.requires_document) {
      continue
    }

    const eventDate = new Date(registration.event.date).getTime()
    if (Number.isNaN(eventDate) || eventDate <= today) {
      continue
    }

    const daysUntil = Math.ceil((eventDate - today) / DAY_MS)
    if (!REMINDER_DAYS.includes(daysUntil)) {
      continue
    }

    const requiredTypes = Array.isArray(registration.ticket.document_types)
      ? registration.ticket.document_types
      : []
    const requiredCount = requiredTypes.length > 0 ? requiredTypes.length : 1
    const uploadedCount =
      documentsByRegistration.get(registration.id)?.size ?? (registration.document_url ? 1 : 0)

    if (uploadedCount >= requiredCount) {
      continue
    }

    const participantName =
      profileNameById.get(registration.user_id) ??
      registration.email ??
      null

    try {
      await notifyDocumentUploadReminder({
        registrationId: registration.id,
        userId: registration.user_id,
        participantName,
        eventTitle: registration.event.title ?? 'Ton événement',
        email: registration.email,
        requiredDocuments: requiredTypes,
        daysBefore: daysUntil,
      })
      remindersSent += 1
    } catch (reminderError) {
      console.error('[document-reminders] reminder error', reminderError)
    }
  }

  return NextResponse.json({ ok: true, remindersSent })
}
