import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { sendEventOpeningEmail } from '@/lib/email'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

export const runtime = 'nodejs'

const CAMPAIGN_EVENT_TITLE = 'Ultra Arena 2026'
const CAMPAIGN_EVENT_DATE = 'Samedi 14 novembre 2026'
const CAMPAIGN_EVENT_LOCATION = 'Parc de Miribel-Jonage'
const SITE_URL = getEmailAssetsBaseUrl()
const CAMPAIGN_EVENT_URL = `${SITE_URL}/events/ultra-arena-2026`
const CAMPAIGN_HERO_IMAGE_PATH = '/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.jpg'
const CAMPAIGN_HERO_IMAGE_URL = `${SITE_URL}${CAMPAIGN_HERO_IMAGE_PATH}`
const CAMPAIGN_OFFER_TITLE = '-25% sur les 35 premiers inscrits'
const CAMPAIGN_OFFER_DESCRIPTION = 'Aucun code requis : la réduction s’applique automatiquement au checkout.'

type AudienceRecipient = {
  email: string
  userId?: string
  fullName?: string | null
  sources: Set<string>
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const ensureAdmin = async () => {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: profile.full_name ?? user.user_metadata?.full_name ?? null,
    },
  }
}

const buildAudience = async () => {
  const admin = supabaseAdmin()
  const recipients = new Map<string, AudienceRecipient>()
  const authEmailByUserId = new Map<string, { email: string; fullName?: string | null }>()

  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw error
    }

    const users = data.users ?? []
    for (const authUser of users) {
      const email = authUser.email ? normalizeEmail(authUser.email) : ''
      if (!email) continue

      const fullName =
        (authUser.user_metadata as Record<string, unknown> | undefined)?.full_name as
          | string
          | undefined
      authEmailByUserId.set(authUser.id, { email, fullName: fullName ?? null })

      const existing = recipients.get(email)
      if (existing) {
        existing.sources.add('auth')
        if (!existing.userId) existing.userId = authUser.id
        if (!existing.fullName && fullName) existing.fullName = fullName
      } else {
        recipients.set(email, {
          email,
          userId: authUser.id,
          fullName: fullName ?? null,
          sources: new Set(['auth']),
        })
      }
    }

    if (users.length < perPage) {
      break
    }
    page += 1
  }

  const { data: subscriptions, error: subscriptionError } = await admin
    .from('list_subscriptions')
    .select('user_id, email, full_name, subscribed')
    .eq('subscribed', true)

  if (subscriptionError) {
    throw subscriptionError
  }

  for (const subscription of subscriptions ?? []) {
    const resolvedEmail =
      (subscription.email ? normalizeEmail(subscription.email) : '') ||
      (subscription.user_id ? authEmailByUserId.get(subscription.user_id)?.email ?? '' : '')

    if (!resolvedEmail) continue

    const resolvedUserId =
      subscription.user_id ?? recipients.get(resolvedEmail)?.userId ?? undefined

    const fullName =
      subscription.full_name ??
      authEmailByUserId.get(subscription.user_id ?? '')?.fullName ??
      null

    const existing = recipients.get(resolvedEmail)
    if (existing) {
      existing.sources.add('list_subscriptions')
      if (!existing.userId && resolvedUserId) existing.userId = resolvedUserId
      if (!existing.fullName && fullName) existing.fullName = fullName
    } else {
      recipients.set(resolvedEmail, {
        email: resolvedEmail,
        userId: resolvedUserId,
        fullName,
        sources: new Set(['list_subscriptions']),
      })
    }
  }

  return Array.from(recipients.values())
    .sort((a, b) => a.email.localeCompare(b.email))
    .map((recipient) => ({
      email: recipient.email,
      userId: recipient.userId,
      fullName: recipient.fullName ?? null,
      sources: Array.from(recipient.sources).sort(),
    }))
}

export async function GET() {
  try {
    const adminCheck = await ensureAdmin()
    if ('error' in adminCheck) {
      return adminCheck.error
    }

    const recipients = await buildAudience()

    return NextResponse.json({
      success: true,
      total: recipients.length,
      recipients,
      campaign: {
        title: CAMPAIGN_EVENT_TITLE,
        date: CAMPAIGN_EVENT_DATE,
        location: CAMPAIGN_EVENT_LOCATION,
        url: CAMPAIGN_EVENT_URL,
      },
    })
  } catch (error) {
    console.error('[admin registration opening] preview error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const sendSchema = z.object({
  mode: z.enum(['self', 'all']),
})

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await ensureAdmin()
    if ('error' in adminCheck) {
      return adminCheck.error
    }

    const body = await request.json().catch(() => ({}))
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Mode invalide.' }, { status: 400 })
    }

    const { mode } = parsed.data

    if (mode === 'self') {
      await sendEventOpeningEmail({
        to: adminCheck.user.email,
        fullName: adminCheck.user.fullName,
        userId: adminCheck.user.id,
        eventTitle: CAMPAIGN_EVENT_TITLE,
        eventDate: CAMPAIGN_EVENT_DATE,
        eventLocation: CAMPAIGN_EVENT_LOCATION,
        eventUrl: CAMPAIGN_EVENT_URL,
        heroImageUrl: CAMPAIGN_HERO_IMAGE_URL,
        offerTitle: CAMPAIGN_OFFER_TITLE,
        offerDescription: CAMPAIGN_OFFER_DESCRIPTION,
      })

      return NextResponse.json({
        success: true,
        mode,
        sent: 1,
        failed: 0,
        message: `Email de test envoyé à ${adminCheck.user.email}.`,
      })
    }

    const recipients = await buildAudience()
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Aucun destinataire trouvé.' }, { status: 400 })
    }

    const failures: Array<{ email: string; error: string }> = []
    let sent = 0
    const BATCH_SIZE = 25

    for (let index = 0; index < recipients.length; index += BATCH_SIZE) {
      const batch = recipients.slice(index, index + BATCH_SIZE)
      await Promise.all(
        batch.map(async (recipient) => {
          try {
            await sendEventOpeningEmail({
              to: recipient.email,
              fullName: recipient.fullName,
              userId: recipient.userId,
              eventTitle: CAMPAIGN_EVENT_TITLE,
              eventDate: CAMPAIGN_EVENT_DATE,
              eventLocation: CAMPAIGN_EVENT_LOCATION,
              eventUrl: CAMPAIGN_EVENT_URL,
              heroImageUrl: CAMPAIGN_HERO_IMAGE_URL,
              offerTitle: CAMPAIGN_OFFER_TITLE,
              offerDescription: CAMPAIGN_OFFER_DESCRIPTION,
            })
            sent += 1
          } catch (error) {
            failures.push({
              email: recipient.email,
              error: error instanceof Error ? error.message : 'Erreur inconnue',
            })
          }
        }),
      )
    }

    return NextResponse.json({
      success: true,
      mode,
      total: recipients.length,
      sent,
      failed: failures.length,
      failures: failures.slice(0, 20),
      message:
        failures.length > 0
          ? `Envoi terminé avec ${failures.length} échec(s).`
          : `Envoi terminé. ${sent} email(s) envoyés.`,
    })
  } catch (error) {
    console.error('[admin registration opening] send error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
