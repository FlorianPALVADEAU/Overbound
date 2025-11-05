import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import {
  sendVolunteerApplicationConfirmationEmail,
  sendVolunteerApplicationEmail,
} from '@/lib/email'

export const runtime = 'nodejs'

const toOptionalTrimmed = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => {
      if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed.length === 0 ? undefined : trimmed
      }
      return undefined
    },
    schema.optional(),
  )

const applicationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Le nom est requis.' })
    .max(120, { message: 'Le nom est trop long.' }),
  email: z
    .string()
    .trim()
    .nonempty({ message: 'L’adresse email est requise.' })
    .email({ message: 'Adresse email invalide.' })
    .max(160, { message: 'Adresse email invalide.' }),
  phone: toOptionalTrimmed(
    z
      .string()
      .min(6, { message: 'Le téléphone doit contenir au moins 6 chiffres.' })
      .max(32, { message: 'Le téléphone est trop long.' }),
  ),
  eventId: toOptionalTrimmed(z.string().max(64, { message: 'Identifiant événement invalide.' })),
  eventName: toOptionalTrimmed(z.string().max(160, { message: 'Le nom de l’événement est trop long.' })),
  availability: z
    .string()
    .trim()
    .min(2, { message: 'Précise tes disponibilités.' })
    .max(240, { message: 'Tes disponibilités sont trop longues.' }),
  mission: z
    .string()
    .trim()
    .min(2, { message: 'Choisis une mission.' })
    .max(160, { message: 'La mission est trop longue.' }),
  experience: toOptionalTrimmed(z.string().max(600, { message: 'Ce champ est trop long.' })),
  motivations: toOptionalTrimmed(z.string().max(1200, { message: 'Ce champ est trop long.' })),
  gdprConsent: z
    .boolean()
    .refine((value) => value === true, { message: 'Tu dois accepter l’utilisation de tes données.' }),
})

const VOLUNTEER_INBOX =
  process.env.VOLUNTEER_INBOX ?? process.env.SUPPORT_INBOX ?? 'benevoles@overbound-race.com'

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null)

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
    }

    const parsed = applicationSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Champs invalides.', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    const data = parsed.data
    const submittedAt = new Date()

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const admin = supabaseAdmin()

    let eventDetails:
      | {
          id: string
          title: string | null
          date: string | null
          location: string | null
        }
      | null = null

    if (data.eventId) {
      const { data: eventRecord, error: eventError } = await admin
        .from('events')
        .select('id, title, date, location')
        .eq('id', data.eventId)
        .maybeSingle()

      if (eventError) {
        console.error('[volunteer application] event lookup error', eventError)
      } else if (eventRecord) {
        eventDetails = {
          id: eventRecord.id,
          title: eventRecord.title ?? null,
          date: eventRecord.date ?? null,
          location: eventRecord.location ?? null,
        }
      }
    }

    const eventSnapshot =
      eventDetails || data.eventName
        ? {
            id: eventDetails?.id ?? null,
            title: eventDetails?.title ?? data.eventName ?? null,
            date: eventDetails?.date ?? null,
            location: eventDetails?.location ?? null,
          }
        : null

    const { error: insertError } = await admin.from('volunteer_applications').insert({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone ?? null,
      availability: data.availability,
      preferred_mission: data.mission,
      experience: data.experience ?? null,
      motivations: data.motivations ?? null,
      event_id: eventDetails?.id ?? null,
      event_snapshot: eventSnapshot,
      gdpr_consent: data.gdprConsent,
      submitted_at: submittedAt.toISOString(),
    })

    if (insertError) {
      console.error('[volunteer application] failed to persist application', insertError)
    }

    const submittedLabel = submittedAt.toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    })

    await sendVolunteerApplicationEmail({
      to: VOLUNTEER_INBOX,
      applicantName: data.fullName,
      applicantEmail: data.email,
      phone: data.phone ?? null,
      availability: data.availability,
      preferredMission: data.mission,
      experience: data.experience ?? null,
      motivations: data.motivations ?? null,
      event: eventSnapshot,
      submittedAt: submittedLabel,
    })

    try {
      await sendVolunteerApplicationConfirmationEmail({
        to: data.email,
        applicantName: data.fullName,
        preferredMission: data.mission,
        submittedAt: submittedLabel,
        event: eventSnapshot,
      })
    } catch (confirmationError) {
      console.error('[volunteer application] confirmation email failed', confirmationError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[volunteer application] unexpected error', error)
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 })
  }
}
